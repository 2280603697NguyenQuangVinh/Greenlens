namespace GreenLens.Application.Interfaces;

public interface IMiniGameDailyActivitiesRepository
{
    Task UpsertGameCompletedAsync(
        string childId,
        DateOnly date,
        bool gameCompleted,
        CancellationToken cancellationToken = default);
}
