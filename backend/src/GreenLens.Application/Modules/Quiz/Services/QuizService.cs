using GreenLens.Application.Modules.Quiz.DTOs;
using GreenLens.Application.Modules.Quiz.Interfaces;
using GreenLens.Application.Modules.ChildProfiles.Interfaces;

namespace GreenLens.Application.Modules.Quiz.Services;

public sealed class QuizService : IQuizService
{
    private const string QuizGameType = "quiz";
    private const int QuestionCount = 3;
    private const int OptionCount = 4;
    private const int XpPerCorrectAnswer = 10;
    private const int XpPerWrongAnswer = 5;
    private const int MinTargetAge = 6;
    private const int MaxTargetAge = 12;
    private static readonly string[] RandomTopics = ["recyclable", "organic", "hazardous", "trash"];

    private readonly IChildQuizContextReader _childContextReader;
    private readonly IQuizRepository _quizRepository;
    private readonly IQuizPoolRepository _quizPoolRepository;
    private readonly IQuizPoolRefillQueue _quizPoolRefillQueue;
    private readonly IChildProgressService _childProgressService;
    private readonly int _poolRefillThreshold;

    public QuizService(
        IChildQuizContextReader childContextReader,
        IQuizRepository quizRepository,
        IQuizPoolRepository quizPoolRepository,
        IQuizPoolRefillQueue quizPoolRefillQueue,
        IChildProgressService childProgressService,
        int poolRefillThreshold = 2)
    {
        _childContextReader = childContextReader;
        _quizRepository = quizRepository;
        _quizPoolRepository = quizPoolRepository;
        _quizPoolRefillQueue = quizPoolRefillQueue;
        _childProgressService = childProgressService;
        _poolRefillThreshold = Math.Max(1, poolRefillThreshold);
    }

    public async Task<GenerateQuizResponse> GenerateAsync(
        GenerateQuizRequest request,
        string cognitoSub,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(cognitoSub))
        {
            throw new UnauthorizedAccessException("Bearer token is required.");
        }

        if (string.IsNullOrWhiteSpace(request.ChildId))
        {
            throw new ArgumentException("childId is required.", nameof(request));
        }

        var childContext = await _childContextReader.GetAsync(
            request.ChildId.Trim(),
            cognitoSub,
            cancellationToken);

        var poolItem = await _quizPoolRepository.ClaimReadyAsync(
            childContext.ChildId,
            cognitoSub,
            cancellationToken);

        var selectedTopic = poolItem?.Topic ?? RandomTopics[Random.Shared.Next(RandomTopics.Length)];
        var targetAge = poolItem?.TargetAge ?? Random.Shared.Next(MinTargetAge, MaxTargetAge + 1);
        var questions = NormalizeQuestions(poolItem?.Questions ?? []);
        var usedFallback = false;

        if (questions.Count < QuestionCount)
        {
            questions = NormalizeQuestions(await _quizRepository.GetFallbackQuestionsAsync(
                selectedTopic,
                targetAge,
                cancellationToken));
            usedFallback = true;
        }

        await EnqueueRefillIfNeededAsync(childContext, cognitoSub, cancellationToken);

        var now = DateTime.UtcNow;
        var session = new QuizSessionDto(
            $"quiz_{Guid.NewGuid():N}",
            childContext.ChildId,
            QuizGameType,
            selectedTopic,
            targetAge,
            "InProgress",
            questions,
            now,
            now);

        await _quizRepository.SaveSessionAsync(session, cognitoSub, cancellationToken);

        return new GenerateQuizResponse(
            session.SessionId,
            session.ChildId,
            session.GameType,
            session.WasteType,
            session.TargetAge,
            session.Questions,
            usedFallback);
    }

    private async Task EnqueueRefillIfNeededAsync(
        ChildQuizContext childContext,
        string cognitoSub,
        CancellationToken cancellationToken)
    {
        try
        {
            var readyCount = await _quizPoolRepository.CountReadyAsync(
                childContext.ChildId,
                cognitoSub,
                cancellationToken);

            if (readyCount < _poolRefillThreshold)
            {
                await _quizPoolRefillQueue.EnqueueAsync(
                    new QuizPoolRefillRequest(childContext.ChildId, cognitoSub),
                    cancellationToken);
            }
        }
        catch (Exception) when (!cancellationToken.IsCancellationRequested)
        {
            try
            {
                await _quizPoolRefillQueue.EnqueueAsync(
                    new QuizPoolRefillRequest(childContext.ChildId, cognitoSub),
                    cancellationToken);
            }
            catch (Exception) when (!cancellationToken.IsCancellationRequested)
            {
            }
        }
    }

    public async Task<QuizSessionDto> GetSessionAsync(
        string sessionId,
        string cognitoSub,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(sessionId))
        {
            throw new ArgumentException("sessionId is required.", nameof(sessionId));
        }

        var session = await _quizRepository.GetSessionAsync(
            sessionId.Trim(),
            cognitoSub,
            cancellationToken);

        return session ?? throw new InvalidOperationException("Quiz session was not found.");
    }

    public async Task<CompleteQuizResponse> CompleteAsync(
        CompleteQuizRequest request,
        string cognitoSub,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.SessionId))
        {
            throw new ArgumentException("sessionId is required.", nameof(request));
        }

        var session = await GetSessionAsync(request.SessionId, cognitoSub, cancellationToken);
        if (string.Equals(session.Status, "Completed", StringComparison.OrdinalIgnoreCase))
        {
            return new CompleteQuizResponse(
                session.SessionId,
                session.GameType,
                0,
                request.CorrectAnswers,
                session.Questions.Count,
                0,
                "Completed");
        }

        var correctAnswers = Math.Clamp(request.CorrectAnswers, 0, session.Questions.Count);
        var wrongAnswers = Math.Max(session.Questions.Count - correctAnswers, 0);
        var score = correctAnswers * XpPerCorrectAnswer;
        var xpAwarded = correctAnswers * XpPerCorrectAnswer + wrongAnswers * XpPerWrongAnswer;

        await _quizRepository.MarkSessionCompletedAsync(
            session.SessionId,
            cognitoSub,
            correctAnswers,
            xpAwarded,
            cancellationToken);

        await _childProgressService.AwardQuizAsync(
            session.ChildId,
            cognitoSub,
            correctAnswers,
            session.Questions.Count,
            cancellationToken);

        return new CompleteQuizResponse(
            session.SessionId,
            session.GameType,
            score,
            correctAnswers,
            session.Questions.Count,
            xpAwarded,
            "Completed");
    }

    private static IReadOnlyList<QuizQuestionDto> NormalizeQuestions(
        IReadOnlyList<QuizQuestionDto> questions)
    {
        return questions
            .Where(question =>
                !string.IsNullOrWhiteSpace(question.Question) &&
                question.Options.Count == OptionCount &&
                !string.IsNullOrWhiteSpace(question.Correct) &&
                question.Options.Any(option => string.Equals(option, question.Correct, StringComparison.OrdinalIgnoreCase)) &&
                !string.IsNullOrWhiteSpace(question.Explanation))
            .Take(QuestionCount)
            .ToList();
    }
}
