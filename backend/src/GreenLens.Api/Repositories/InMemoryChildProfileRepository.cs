using GreenLens.Domain.Common.Interfaces;
using GreenLens.Domain.Modules.ChildProfiles.Entities;

namespace GreenLens.Api.Repositories;

public sealed class InMemoryChildProfileRepository : IChildProfileRepository
{
    private readonly Dictionary<string, ChildProfile> _profiles = [];

    public Task SaveAsync(ChildProfile profile, CancellationToken cancellationToken = default)
    {
        if (_profiles.ContainsKey(profile.ChildId))
        {
            throw new InvalidOperationException("Child profile already exists.");
        }

        _profiles[profile.ChildId] = profile;
        return Task.CompletedTask;
    }

    public Task<ChildProfile?> GetByIdAsync(string childId, CancellationToken cancellationToken = default)
    {
        _profiles.TryGetValue(childId, out var profile);
        return Task.FromResult(profile);
    }

    public Task UpdateProgressAsync(
        string childId,
        int xp,
        int level,
        int streak,
        CancellationToken cancellationToken = default)
    {
        if (!_profiles.TryGetValue(childId, out var profile))
        {
            throw new KeyNotFoundException($"Child profile '{childId}' was not found.");
        }

        _profiles[childId] = new ChildProfile
        {
            ChildId = profile.ChildId,
            CognitoSub = profile.CognitoSub,
            CharacterName = profile.CharacterName,
            Gender = profile.Gender,
            Hair = profile.Hair,
            Eyes = profile.Eyes,
            Outfit = profile.Outfit,
            AvatarPreview = profile.AvatarPreview,
            Xp = xp,
            Level = level,
            Streak = streak,
            Badges = profile.Badges,
            Rewards = profile.Rewards,
            CreatedAt = profile.CreatedAt,
            UpdatedAt = DateTime.UtcNow
        };

        return Task.CompletedTask;
    }
}
