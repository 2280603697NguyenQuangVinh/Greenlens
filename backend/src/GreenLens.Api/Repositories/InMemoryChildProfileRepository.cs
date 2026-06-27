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

    public Task UpdateStreakAsync(
        string childId,
        string cognitoSub,
        int streak,
        string lastStreakDate,
        int streakFreezeDaysUsed,
        CancellationToken cancellationToken = default)
    {
        if (!_profiles.TryGetValue(childId, out var profile))
        {
            return Task.CompletedTask;
        }

        if (!string.Equals(profile.CognitoSub, cognitoSub, StringComparison.Ordinal))
        {
            return Task.CompletedTask;
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
            Xp = profile.Xp,
            Level = profile.Level,
            Streak = streak,
            LastStreakDate = lastStreakDate,
            StreakFreezeDaysUsed = streakFreezeDaysUsed,
            AiCameraScanCount = profile.AiCameraScanCount,
            MiniGameHighScore = profile.MiniGameHighScore,
            Badges = profile.Badges,
            Rewards = profile.Rewards,
            CreatedAt = profile.CreatedAt,
            UpdatedAt = DateTime.UtcNow
        };

        return Task.CompletedTask;
    }
}
