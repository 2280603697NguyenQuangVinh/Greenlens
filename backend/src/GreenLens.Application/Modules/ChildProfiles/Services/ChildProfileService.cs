using GreenLens.Application.Modules.ChildProfiles.DTOs;
using GreenLens.Application.Modules.ChildProfiles.Interfaces;
using GreenLens.Application.Modules.ChildProfiles.Validators;
using GreenLens.Domain.Common.Interfaces;
using GreenLens.Domain.Modules.ChildProfiles.Entities;

namespace GreenLens.Application.Modules.ChildProfiles.Services;

public sealed class ChildProfileService(
    IChildProfileRepository childProfileRepository,
    IChildIdentityService childIdentityService,
    CreateChildProfileValidator validator) : IChildProfileService
{
    private const int FirstScanTarget = 1;
    private const int Streak7Target = 7;
    private const int Streak30Target = 30;
    private const int QuizGeniusTarget = 3;
    private const int TrashSortMasterTarget = 81;
    private const int LeaderboardChampionTarget = 1;
    private const int EnvironmentHeroTarget = 100;

    private static readonly IReadOnlyList<BadgeDefinition> BadgeDefinitions =
    [
        new(
            "first_scan",
            "First Scan",
            "Chup va phan loai rac thanh cong lan dau tien.",
            "Phan loai thanh cong vat dau tien bang AI Camera.",
            FirstScanTarget),
        new(
            "streak_7_days",
            "Streak 7 ngày",
            "Hoan thanh hoat dong moi ngay trong 7 ngay lien tiep.",
            "Hoan thanh daily activity 7 ngay lien tiep.",
            Streak7Target),
        new(
            "streak_30_days",
            "Streak 30 ngày",
            "Hoan thanh hoat dong moi ngay trong 30 ngay lien tiep.",
            "Hoan thanh daily activity 30 ngay lien tiep.",
            Streak30Target),
        new(
            "quiz_genius",
            "Thiên tài quiz",
            "Tra loi dung tat ca cau hoi trong mot lan quiz.",
            "Tra loi dung 3/3 cau trong mot lan quiz.",
            QuizGeniusTarget),
        new(
            "trash_sort_master",
            "Rác Kỳ Thủ",
            "Dat diem cao trong mini game keo tha rac.",
            "Dat tren 80 diem trong mini game keo tha rac.",
            TrashSortMasterTarget),
        new(
            "mini_game_champion",
            "Vô địch mini game",
            "Dung dau bang xep hang tong hop giua quiz va cac mini game.",
            "Dat hang nhat tren bang xep hang tong hop quiz va mini game keo tha rac.",
            LeaderboardChampionTarget),
        new(
            "environment_hero",
            "Anh hùng môi trường",
            "Kien tri phan loai that nhieu vat dung.",
            "Tong cong phan loai dung 100 vat bang AI Camera.",
            EnvironmentHeroTarget)
    ];

    public async Task<ChildProfileResponse> CreateAsync(
        CreateChildProfileRequest request,
        string? cognitoSub = null,
        CancellationToken cancellationToken = default)
    {
        var validationErrors = validator.Validate(request);
        if (validationErrors.Count > 0)
        {
            throw new ArgumentException(string.Join(" ", validationErrors));
        }

        var now = DateTime.UtcNow;
        var childId = $"child_{Guid.NewGuid():N}";
        var resolvedCognitoSub = string.IsNullOrWhiteSpace(cognitoSub)
            ? await childIdentityService.CreateChildIdentityAsync(
                childId,
                request.CharacterName!.Trim(),
                cancellationToken)
            : cognitoSub.Trim();

        var profile = new ChildProfile
        {
            ChildId = childId,
            CognitoSub = resolvedCognitoSub,
            DeviceId = request.DeviceId?.Trim(),
            CharacterName = request.CharacterName!.Trim(),
            Gender = request.Gender!.Trim(),
            Hair = request.Hair!.Trim(),
            Eyes = request.Eyes!.Trim(),
            Outfit = request.Outfit!.Trim(),
            AvatarPreview = request.AvatarPreview!.Trim(),
            Xp = 0,
            Level = 1,
            Streak = 0,
            LastStreakDate = null,
            StreakFreezeDaysUsed = 0,
            AiCameraScanCount = 0,
            MiniGameHighScore = 0,
            Badges = [],
            Rewards = [],
            CreatedAt = now,
            UpdatedAt = now
        };

        await childProfileRepository.SaveAsync(profile, cancellationToken);

        return ToResponse(profile);
    }

    public async Task<ChildProfileResponse> GetAsync(
        string childId,
        string cognitoSub,
        CancellationToken cancellationToken = default)
    {
        var profile = await GetOwnedProfileAsync(childId, cognitoSub, cancellationToken);

        return ToResponse(profile);
    }

    public async Task<ChildProfileResponse> RestoreSessionAsync(
        string childId,
        string deviceId,
        string? cognitoSub = null,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(childId))
        {
            throw new ArgumentException("childId is required.", nameof(childId));
        }

        if (string.IsNullOrWhiteSpace(deviceId))
        {
            throw new ArgumentException("deviceId is required.", nameof(deviceId));
        }

        var profile = await childProfileRepository.GetAsync(childId.Trim(), cancellationToken)
            ?? throw new InvalidOperationException("Child profile was not found.");

        if (!string.Equals(profile.Status, "Active", StringComparison.OrdinalIgnoreCase))
        {
            throw new UnauthorizedAccessException("Child profile is disabled.");
        }

        var normalizedDeviceId = deviceId.Trim();
        if (!string.IsNullOrWhiteSpace(profile.DeviceId))
        {
            if (!string.Equals(profile.DeviceId, normalizedDeviceId, StringComparison.Ordinal))
            {
                throw new UnauthorizedAccessException("This child profile is linked to another device.");
            }

            return ToResponse(profile);
        }

        if (string.IsNullOrWhiteSpace(cognitoSub) ||
            !string.Equals(profile.CognitoSub, cognitoSub.Trim(), StringComparison.Ordinal))
        {
            throw new UnauthorizedAccessException("This device is not linked to the child profile yet.");
        }

        await childProfileRepository.UpdateDeviceIdAsync(
            profile.ChildId,
            profile.CognitoSub,
            normalizedDeviceId,
            cancellationToken);

        var reboundProfile = new ChildProfile
        {
            ChildId = profile.ChildId,
            CognitoSub = profile.CognitoSub,
            DeviceId = normalizedDeviceId,
            CharacterName = profile.CharacterName,
            Gender = profile.Gender,
            Hair = profile.Hair,
            Eyes = profile.Eyes,
            Outfit = profile.Outfit,
            AvatarPreview = profile.AvatarPreview,
            Xp = profile.Xp,
            Level = profile.Level,
            Streak = profile.Streak,
            LastStreakDate = profile.LastStreakDate,
            StreakFreezeDaysUsed = profile.StreakFreezeDaysUsed,
            AiCameraScanCount = profile.AiCameraScanCount,
            MiniGameHighScore = profile.MiniGameHighScore,
            Badges = profile.Badges,
            Rewards = profile.Rewards,
            Status = profile.Status,
            UpdatedBy = profile.UpdatedBy,
            CreatedAt = profile.CreatedAt,
            UpdatedAt = DateTime.UtcNow
        };

        return ToResponse(reboundProfile);
    }

    public async Task<IReadOnlyList<LeaderboardEntryDto>> GetLeaderboardAsync(
        string? currentChildId,
        int limit = 10,
        CancellationToken cancellationToken = default)
    {
        var clampedLimit = Math.Clamp(limit, 1, 50);
        var profiles = await childProfileRepository.ListTopByMiniGameHighScoreAsync(clampedLimit, cancellationToken);
        var currentId = currentChildId?.Trim();

        return profiles
            .Select((profile, index) => new LeaderboardEntryDto(
                index + 1,
                profile.ChildId,
                string.IsNullOrWhiteSpace(profile.CharacterName)
                    ? $"Người chơi {index + 1}"
                    : profile.CharacterName.Trim(),
                Math.Max(profile.MiniGameHighScore, 0),
                !string.IsNullOrWhiteSpace(currentId) &&
                    string.Equals(profile.ChildId, currentId, StringComparison.Ordinal)))
            .ToList();
    }

    public async Task<ChildStreakResponse> GetStreakAsync(
        string childId,
        string cognitoSub,
        CancellationToken cancellationToken = default)
    {
        var profile = await GetOwnedProfileAsync(childId, cognitoSub, cancellationToken);
        var streakState = ChildStreakCalculator.Preview(
            profile.Streak,
            profile.LastStreakDate,
            ChildStreakCalculator.GetVietnamToday(),
            profile.StreakFreezeDaysUsed);

        return BuildStreakResponse(profile, streakState);
    }

    public async Task<ChildStreakResponse> CheckInStreakAsync(
        string childId,
        string cognitoSub,
        CancellationToken cancellationToken = default)
    {
        var profile = await GetOwnedProfileAsync(childId, cognitoSub, cancellationToken);
        var streakState = ChildStreakCalculator.CheckIn(
            profile.Streak,
            profile.LastStreakDate,
            ChildStreakCalculator.GetVietnamToday());

        if (streakState.LastStreakDate is not null &&
            !string.Equals(streakState.Status, "AlreadyCheckedIn", StringComparison.Ordinal))
        {
            await childProfileRepository.UpdateStreakAsync(
                profile.ChildId,
                profile.CognitoSub,
                streakState.CurrentStreak,
                streakState.LastStreakDate,
                streakState.FreezeDaysUsed,
                cancellationToken);
        }

        var updatedProfile = new ChildProfile
        {
            ChildId = profile.ChildId,
            CognitoSub = profile.CognitoSub,
            DeviceId = profile.DeviceId,
            CharacterName = profile.CharacterName,
            Gender = profile.Gender,
            Hair = profile.Hair,
            Eyes = profile.Eyes,
            Outfit = profile.Outfit,
            AvatarPreview = profile.AvatarPreview,
            Xp = profile.Xp,
            Level = profile.Level,
            Streak = streakState.CurrentStreak,
            LastStreakDate = streakState.LastStreakDate,
            StreakFreezeDaysUsed = streakState.FreezeDaysUsed,
            AiCameraScanCount = profile.AiCameraScanCount,
            MiniGameHighScore = profile.MiniGameHighScore,
            Badges = profile.Badges,
            Rewards = profile.Rewards,
            CreatedAt = profile.CreatedAt,
            UpdatedAt = DateTime.UtcNow
        };

        return BuildStreakResponse(updatedProfile, streakState);
    }

    private static ChildStreakResponse BuildStreakResponse(
        ChildProfile profile,
        ChildStreakState streakState)
    {
        var currentStreak = Math.Max(streakState.CurrentStreak, 0);
        var badge = BuildBadgeCatalog(profile.Badges, profile)
            .First(item => item.Code == "streak_30_days");

        return new ChildStreakResponse(
            profile.ChildId,
            currentStreak,
            Streak30Target,
            Math.Max(Streak30Target - currentStreak, 0),
            Math.Clamp((int)Math.Round(currentStreak * 100d / Streak30Target), 0, 100),
            badge.IsUnlocked,
            streakState.LastStreakDate,
            ChildStreakCalculator.MaxFreezeDays,
            streakState.FreezeDaysUsed,
            streakState.FreezeDaysRemaining,
            streakState.MissedDaysCoveredByFreeze,
            streakState.Status,
            badge);
    }

    private async Task<ChildProfile> GetOwnedProfileAsync(
        string childId,
        string cognitoSub,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(childId))
        {
            throw new ArgumentException("childId is required.", nameof(childId));
        }

        if (string.IsNullOrWhiteSpace(cognitoSub))
        {
            throw new UnauthorizedAccessException("Bearer token is required.");
        }

        var profile = await childProfileRepository.GetAsync(childId.Trim(), cancellationToken)
            ?? throw new InvalidOperationException("Child profile was not found.");

        if (!string.Equals(profile.CognitoSub, cognitoSub.Trim(), StringComparison.Ordinal))
        {
            throw new UnauthorizedAccessException("Child profile does not belong to this user.");
        }

        if (!string.Equals(profile.Status, "Active", StringComparison.OrdinalIgnoreCase))
        {
            throw new UnauthorizedAccessException("Child profile is disabled.");
        }

        return profile;
    }

    private static ChildProfileResponse ToResponse(ChildProfile profile)
    {
        var level = ChildLeveling.GetLevel(profile.Xp);

        return new ChildProfileResponse(
            profile.ChildId,
            profile.CognitoSub,
            profile.DeviceId,
            profile.CharacterName,
            profile.Gender,
            profile.Hair,
            profile.Eyes,
            profile.Outfit,
            profile.AvatarPreview,
            profile.Xp,
            level,
            ChildLeveling.BuildProgress(profile.Xp),
            ChildLeveling.Milestones,
            profile.Streak,
            profile.Badges,
            BuildBadgeCatalog(profile.Badges, profile),
            profile.Rewards,
            profile.CreatedAt,
            profile.UpdatedAt);
    }

    private static IReadOnlyList<BadgeStatusDto> BuildBadgeCatalog(
        IReadOnlyList<string> unlockedBadges,
        ChildProfile profile)
    {
        var unlocked = unlockedBadges.ToHashSet(StringComparer.OrdinalIgnoreCase);

        return BadgeDefinitions
            .Select(badge => (Badge: badge, Progress: GetBadgeProgress(badge.Code, profile, unlocked)))
            .Select(badge => new BadgeStatusDto(
                badge.Badge.Code,
                badge.Badge.Name,
                badge.Badge.Description,
                badge.Badge.UnlockCondition,
                unlocked.Contains(badge.Badge.Name) || badge.Progress >= badge.Badge.ProgressTarget,
                Math.Min(badge.Progress, badge.Badge.ProgressTarget),
                badge.Badge.ProgressTarget))
            .ToList();
    }

    private static int GetBadgeProgress(
        string badgeCode,
        ChildProfile profile,
        IReadOnlySet<string> unlockedBadges)
    {
        return badgeCode switch
        {
            "first_scan" => profile.AiCameraScanCount,
            "streak_7_days" => profile.Streak,
            "streak_30_days" => profile.Streak,
            "quiz_genius" => unlockedBadges.Contains("Thiên tài quiz") ? QuizGeniusTarget : 0,
            "trash_sort_master" => profile.MiniGameHighScore,
            "mini_game_champion" => unlockedBadges.Contains("Vô địch mini game") ? LeaderboardChampionTarget : 0,
            "environment_hero" => profile.AiCameraScanCount,
            _ => 0
        };
    }

    private sealed record BadgeDefinition(
        string Code,
        string Name,
        string Description,
        string UnlockCondition,
        int ProgressTarget);
}
