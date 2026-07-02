using GreenLens.Application.Modules.Quiz.DTOs;

namespace GreenLens.Application.Modules.Quiz.Interfaces;

public interface IQuizPoolRepository
{
    Task<QuizPoolItemDto?> ClaimReadyAsync(
        string childId,
        string cognitoSub,
        CancellationToken cancellationToken = default);

    Task<int> CountReadyAsync(
        string childId,
        string cognitoSub,
        CancellationToken cancellationToken = default);

    Task SaveReadyAsync(
        QuizPoolItemDto item,
        CancellationToken cancellationToken = default);

    Task SaveFailedAsync(
        string childId,
        string cognitoSub,
        string topic,
        int targetAge,
        string reason,
        CancellationToken cancellationToken = default);
}
