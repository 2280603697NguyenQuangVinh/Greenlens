using System.Collections.Concurrent;
using System.Text.RegularExpressions;
using GreenLens.Api.Interfaces;
using GreenLens.Api.Models;

namespace GreenLens.Api.Services.Mocks;

public partial class MockUserProfileService : IUserProfileService
{
    private static readonly ConcurrentDictionary<string, UserProfile> Users = new();

    [GeneratedRegex(@"^mock-jwt-(\d{6})-", RegexOptions.IgnoreCase)]
    private static partial Regex TokenBadgePattern();

    public Task<UserProfile?> GetByBadgeIdAsync(string badgeId) =>
        Task.FromResult(Users.TryGetValue(badgeId, out var profile) ? profile : null);

    public Task<UserProfile> UpsertAsync(string badgeId, AvatarConfigDto avatar)
    {
        var profile = Users.AddOrUpdate(
            badgeId,
            _ => CreateProfile(badgeId, avatar),
            (_, existing) =>
            {
                existing.Gender = avatar.Gender;
                existing.Skin = avatar.Skin;
                existing.Hair = avatar.Hair;
                existing.Eyes = avatar.Eyes;
                existing.Outfit = avatar.Outfit;
                return existing;
            });

        return Task.FromResult(profile);
    }

    public Task<UserProfile> AddXpAsync(string badgeId, int xp, string activityIcon, string activityText)
    {
        if (!Users.TryGetValue(badgeId, out var profile))
        {
            throw new KeyNotFoundException($"BadgeId {badgeId} chưa được đăng ký.");
        }

        profile.XP += xp;
        profile.Level = Math.Max(1, profile.XP / 100 + 1);
        profile.RecentActivity.Insert(0, new ActivityItem
        {
            Icon = activityIcon,
            Action = activityText,
            XpLabel = $"+{xp} XP",
            TimeAgo = "just now"
        });
        if (profile.RecentActivity.Count > 10)
        {
            profile.RecentActivity = profile.RecentActivity.Take(10).ToList();
        }

        return Task.FromResult(profile);
    }

    public Task<UserProfile> RecordScanAsync(string badgeId)
    {
        if (!Users.TryGetValue(badgeId, out var profile))
        {
            throw new KeyNotFoundException($"BadgeId {badgeId} chưa được đăng ký.");
        }

        profile.DailyScansCompleted = Math.Min(profile.DailyScansTarget, profile.DailyScansCompleted + 1);
        return Task.FromResult(profile);
    }

    public string? ExtractBadgeIdFromToken(string? authorizationHeader)
    {
        if (string.IsNullOrWhiteSpace(authorizationHeader))
        {
            return null;
        }

        var token = authorizationHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)
            ? authorizationHeader["Bearer ".Length..].Trim()
            : authorizationHeader.Trim();

        var match = TokenBadgePattern().Match(token);
        return match.Success ? match.Groups[1].Value : null;
    }

    private static UserProfile CreateProfile(string badgeId, AvatarConfigDto avatar) => new()
    {
        BadgeId = badgeId,
        Gender = avatar.Gender,
        Skin = avatar.Skin,
        Hair = avatar.Hair,
        Eyes = avatar.Eyes,
        Outfit = avatar.Outfit,
        XP = 0,
        Level = 1,
        Streak = 1,
        DailyScansCompleted = 0,
        DailyScansTarget = 3
    };
}
