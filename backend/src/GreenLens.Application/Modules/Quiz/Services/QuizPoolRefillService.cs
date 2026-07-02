using GreenLens.Application.Modules.Quiz.DTOs;
using GreenLens.Application.Modules.Quiz.Interfaces;

namespace GreenLens.Application.Modules.Quiz.Services;

public sealed class QuizPoolRefillService : IQuizPoolRefillService
{
    private const int QuestionCount = 3;
    private const int OptionCount = 4;
    private const int MinTargetAge = 6;
    private const int MaxTargetAge = 12;
    private static readonly string[] RandomTopics = ["recyclable", "organic", "hazardous", "trash"];

    private readonly IQuizGenerator _quizGenerator;
    private readonly IQuizPoolRepository _quizPoolRepository;
    private readonly int _targetReadyCount;
    private readonly int _ttlDays;

    public QuizPoolRefillService(
        IQuizGenerator quizGenerator,
        IQuizPoolRepository quizPoolRepository,
        int targetReadyCount = 5,
        int ttlDays = 14)
    {
        _quizGenerator = quizGenerator;
        _quizPoolRepository = quizPoolRepository;
        _targetReadyCount = Math.Max(1, targetReadyCount);
        _ttlDays = Math.Max(1, ttlDays);
    }

    public async Task RefillAsync(
        QuizPoolRefillRequest request,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.ChildId) ||
            string.IsNullOrWhiteSpace(request.CognitoSub))
        {
            return;
        }

        int readyCount;
        try
        {
            readyCount = await _quizPoolRepository.CountReadyAsync(
                request.ChildId,
                request.CognitoSub,
                cancellationToken);
        }
        catch (Exception) when (!cancellationToken.IsCancellationRequested)
        {
            return;
        }

        var missingCount = Math.Max(_targetReadyCount - readyCount, 0);
        for (var i = 0; i < missingCount; i++)
        {
            cancellationToken.ThrowIfCancellationRequested();

            var topic = RandomTopics[Random.Shared.Next(RandomTopics.Length)];
            var targetAge = Random.Shared.Next(MinTargetAge, MaxTargetAge + 1);
            var now = DateTime.UtcNow;

            try
            {
                var questions = NormalizeQuestions(await _quizGenerator.GenerateAsync(
                    topic,
                    targetAge,
                    cancellationToken));

                if (questions.Count < QuestionCount)
                {
                    await _quizPoolRepository.SaveFailedAsync(
                        request.ChildId,
                        request.CognitoSub,
                        topic,
                        targetAge,
                        "Bedrock returned fewer than 3 valid 4-option questions.",
                        cancellationToken);
                    continue;
                }

                await _quizPoolRepository.SaveReadyAsync(
                    new QuizPoolItemDto(
                        request.ChildId,
                        $"quizset_{Guid.NewGuid():N}",
                        request.CognitoSub,
                        topic,
                        targetAge,
                        questions,
                        "Ready",
                        now,
                        null,
                        null,
                        now.AddDays(_ttlDays)),
                    cancellationToken);
            }
            catch (Exception exception) when (!cancellationToken.IsCancellationRequested)
            {
                await _quizPoolRepository.SaveFailedAsync(
                    request.ChildId,
                    request.CognitoSub,
                    topic,
                    targetAge,
                    exception.Message,
                    cancellationToken);
            }
        }
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
