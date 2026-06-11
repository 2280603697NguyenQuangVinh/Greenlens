namespace GreenLens.Application.Modules.ChildProfiles.Interfaces;

public interface IChildIdentityService
{
    Task<string> CreateChildIdentityAsync(string childId, string characterName, CancellationToken cancellationToken = default);
}
