using System.Text.RegularExpressions;
using GreenLens.Api.Interfaces;
using GreenLens.Api.Models;

namespace GreenLens.Api.Services.Mocks;

public partial class MockAuthService : IAuthService
{
    private readonly IUserProfileService _profiles;

    [GeneratedRegex(@"^\d{6}$")]
    private static partial Regex BadgeIdPattern();

    public MockAuthService(IUserProfileService profiles)
    {
        _profiles = profiles;
    }

    public async Task<AuthResult> LoginOrRegisterAsync(string badgeId, AvatarConfigDto? avatar)
    {
        ValidateBadgeId(badgeId);
        if (avatar is null)
        {
            throw new ArgumentException("Avatar config is required for registration.", nameof(avatar));
        }

        var profile = await _profiles.UpsertAsync(badgeId, avatar);
        return BuildAuthResult(badgeId, profile);
    }

    public async Task<AuthResult> LoginAsync(string badgeId)
    {
        ValidateBadgeId(badgeId);
        var profile = await _profiles.GetByBadgeIdAsync(badgeId);
        if (profile is null)
        {
            throw new KeyNotFoundException("Mã số này chưa được chế tạo, bạn thử lại nhé!");
        }

        return BuildAuthResult(badgeId, profile);
    }

    private static void ValidateBadgeId(string badgeId)
    {
        if (!BadgeIdPattern().IsMatch(badgeId))
        {
            throw new ArgumentException("BadgeId phải là chuỗi 6 chữ số.", nameof(badgeId));
        }
    }

    private static AuthResult BuildAuthResult(string badgeId, UserProfile profile) => new()
    {
        Token = $"mock-jwt-{badgeId}-{Guid.NewGuid():N}",
        Profile = profile
    };
}
