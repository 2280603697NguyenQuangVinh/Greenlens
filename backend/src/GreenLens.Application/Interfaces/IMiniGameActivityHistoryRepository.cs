namespace GreenLens.Application.Interfaces;

public interface IMiniGameActivityHistoryRepository
{
    Task InsertMiniGameCompletionAsync(
        string childId,
        int xpEarned,
        DateTime completedAtUtc,
        CancellationToken cancellationToken = default);
}
