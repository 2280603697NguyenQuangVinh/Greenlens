using GreenLens.Application.Modules.ChildProfiles.Interfaces;

namespace GreenLens.Api.Repositories;

public sealed class InMemoryChildIdentityService : IChildIdentityService
{
    public Task<string> CreateChildIdentityAsync(
        string childId,
        string characterName,
        CancellationToken cancellationToken = default)
    {
        return Task.FromResult($"local-cognito-sub-{childId}");
    }
}
