using GreenLens.Domain.Common.Interfaces;
using GreenLens.Domain.Modules.ChildProfiles.Entities;

namespace GreenLens.Api.Repositories;

public sealed class InMemoryChildProfileRepository : IChildProfileRepository
{
    private readonly Dictionary<string, ChildProfile> _profiles = [];

    public Task SaveAsync(ChildProfile profile, CancellationToken cancellationToken = default)
    {
        _profiles[profile.ChildId] = profile;
        return Task.CompletedTask;
    }

    public Task<ChildProfile?> GetAsync(
        string childId,
        CancellationToken cancellationToken = default)
    {
        _profiles.TryGetValue(childId, out var profile);
        return Task.FromResult(profile);
    }
}
