using GreenLens.Domain.Modules.Activities.Entities;

namespace GreenLens.Domain.Common.Interfaces;

public interface IActivityHistoryRepository
{
    Task SaveAsync(ActivityHistory history, CancellationToken cancellationToken = default);
}
