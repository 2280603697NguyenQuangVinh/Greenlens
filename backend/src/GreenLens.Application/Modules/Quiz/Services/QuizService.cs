using GreenLens.Application.Modules.Quiz.DTOs;
using GreenLens.Application.Modules.Quiz.Interfaces;
using GreenLens.Application.Modules.ChildProfiles.Interfaces;

namespace GreenLens.Application.Modules.Quiz.Services;

public sealed class QuizService : IQuizService
{
    private const int QuestionCount = 3;
    private const int XpPerCorrectAnswer = 10;
    private const int XpPerWrongAnswer = 5;

    private readonly IChildQuizContextReader _childContextReader;
    private readonly IQuizGenerator _quizGenerator;
    private readonly IQuizRepository _quizRepository;
    private readonly IChildProgressService _childProgressService;

    public QuizService(
        IChildQuizContextReader childContextReader,
        IQuizGenerator quizGenerator,
        IQuizRepository quizRepository,
        IChildProgressService childProgressService)
    {
        _childContextReader = childContextReader;
        _quizGenerator = quizGenerator;
        _quizRepository = quizRepository;
        _childProgressService = childProgressService;
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

        if (string.IsNullOrWhiteSpace(request.WasteType))
        {
            throw new ArgumentException("wasteType is required.", nameof(request));
        }

        var childContext = await _childContextReader.GetAsync(
            request.ChildId.Trim(),
            cognitoSub,
            cancellationToken);

        IReadOnlyList<QuizQuestionDto> questions;
        var usedFallback = false;

        try
        {
            questions = await _quizGenerator.GenerateAsync(
                request.WasteType.Trim(),
                childContext.Age,
                cancellationToken);
        }
        catch (Exception) when (!cancellationToken.IsCancellationRequested)
        {
            questions = await _quizRepository.GetFallbackQuestionsAsync(
                request.WasteType.Trim(),
                childContext.Age,
                cancellationToken);
            usedFallback = true;
        }

        questions = NormalizeQuestions(questions);
        if (questions.Count < QuestionCount)
        {
            questions = NormalizeQuestions(await _quizRepository.GetFallbackQuestionsAsync(
                request.WasteType.Trim(),
                childContext.Age,
                cancellationToken));
            usedFallback = true;
        }

        var now = DateTime.UtcNow;
        var session = new QuizSessionDto(
            $"quiz_{Guid.NewGuid():N}",
            childContext.ChildId,
            request.WasteType.Trim(),
            childContext.Age,
            "InProgress",
            questions,
            now,
            now);

        await _quizRepository.SaveSessionAsync(session, cognitoSub, cancellationToken);

        return new GenerateQuizResponse(
            session.SessionId,
            session.ChildId,
            session.WasteType,
            session.Age,
            session.Questions,
            usedFallback);
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
                request.CorrectAnswers,
                session.Questions.Count,
                0,
                "Completed");
        }

        var correctAnswers = Math.Clamp(request.CorrectAnswers, 0, session.Questions.Count);
        var wrongAnswers = Math.Max(session.Questions.Count - correctAnswers, 0);
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
                question.Options.Count >= 3 &&
                !string.IsNullOrWhiteSpace(question.Correct) &&
                question.Options.Any(option => string.Equals(option, question.Correct, StringComparison.OrdinalIgnoreCase)) &&
                !string.IsNullOrWhiteSpace(question.Explanation))
            .Take(QuestionCount)
            .ToList();
    }
}
