using GreenLens.Api.Models;

namespace GreenLens.Api.Interfaces;

public interface IUserProfileService
{
    Task<UserProfile?> GetByBadgeIdAsync(string badgeId);
    Task<UserProfile> UpsertAsync(string badgeId, AvatarConfigDto avatar);
    Task<UserProfile> AddXpAsync(string badgeId, int xp, string activityIcon, string activityText);
    Task<UserProfile> RecordScanAsync(string badgeId);
    string? ExtractBadgeIdFromToken(string? authorizationHeader);
}
