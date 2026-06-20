using GreenLens.Application.Modules.Quiz.DTOs;

namespace GreenLens.Application.Modules.Quiz.Interfaces;

public interface IQuizRepository
{
    Task<IReadOnlyList<QuizQuestionDto>> GetFallbackQuestionsAsync(
        string wasteType,
        int age,
        CancellationToken cancellationToken = default);

    Task SaveSessionAsync(
        QuizSessionDto session,
        string cognitoSub,
        CancellationToken cancellationToken = default);

    Task<QuizSessionDto?> GetSessionAsync(
        string sessionId,
        string cognitoSub,
        CancellationToken cancellationToken = default);

    Task MarkSessionCompletedAsync(
        string sessionId,
        string cognitoSub,
        int correctAnswers,
        int xpAwarded,
        CancellationToken cancellationToken = default);

}
