using GreenLens.Domain.Common.Interfaces;
using GreenLens.Domain.Modules.Activities.Entities;

namespace GreenLens.Api.Repositories;

public sealed class InMemoryDailyActivityRepository : IDailyActivityRepository
{
    private readonly Dictionary<(string ChildId, string Date), DailyActivity> _activities = [];

    public Task<DailyActivity?> GetAsync(
        string childId,
        string date,
        CancellationToken cancellationToken = default)
    {
        _activities.TryGetValue((childId, date), out var activity);
        return Task.FromResult(activity);
    }

    public Task SaveAsync(DailyActivity activity, CancellationToken cancellationToken = default)
    {
        _activities[(activity.ChildId, activity.Date)] = activity;
        return Task.CompletedTask;
    }
}
