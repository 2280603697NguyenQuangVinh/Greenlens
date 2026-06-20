using GreenLens.Domain.Modules.Activities.Entities;

namespace GreenLens.Domain.Common.Interfaces;

public interface IDailyActivityRepository
{
    Task<DailyActivity?> GetAsync(
        string childId,
        string date,
        CancellationToken cancellationToken = default);

    Task SaveAsync(DailyActivity activity, CancellationToken cancellationToken = default);
}
