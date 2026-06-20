using GreenLens.Domain.Common.Interfaces;
using GreenLens.Domain.Modules.Activities.Entities;

namespace GreenLens.Api.Repositories;

public sealed class InMemoryActivityHistoryRepository : IActivityHistoryRepository
{
    private readonly List<ActivityHistory> _history = [];

    public Task SaveAsync(ActivityHistory history, CancellationToken cancellationToken = default)
    {
        _history.Add(history);
        return Task.CompletedTask;
    }
}
