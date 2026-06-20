using System.Text.Json.Serialization;

namespace GreenLens.Application.Modules.ChildProfiles.DTOs;

public sealed record CreateChildProfileRequest(
    [property: JsonPropertyName("characterName")] string? CharacterName,
    [property: JsonPropertyName("gender")] string? Gender,
    [property: JsonPropertyName("hair")] string? Hair,
    [property: JsonPropertyName("eyes")] string? Eyes,
    [property: JsonPropertyName("outfit")] string? Outfit,
    [property: JsonPropertyName("avatarPreview")] string? AvatarPreview);

public sealed record ChildProfileResponse(
    [property: JsonPropertyName("childId")] string ChildId,
    [property: JsonPropertyName("cognitoSub")] string CognitoSub,
    [property: JsonPropertyName("characterName")] string CharacterName,
    [property: JsonPropertyName("gender")] string Gender,
    [property: JsonPropertyName("hair")] string Hair,
    [property: JsonPropertyName("eyes")] string Eyes,
    [property: JsonPropertyName("outfit")] string Outfit,
    [property: JsonPropertyName("avatarPreview")] string AvatarPreview,
    [property: JsonPropertyName("xp")] int Xp,
    [property: JsonPropertyName("level")] int Level,
    [property: JsonPropertyName("levelProgress")] LevelProgressDto LevelProgress,
    [property: JsonPropertyName("levelMilestones")] IReadOnlyList<LevelMilestoneDto> LevelMilestones,
    [property: JsonPropertyName("streak")] int Streak,
    [property: JsonPropertyName("badges")] IReadOnlyList<string> Badges,
    [property: JsonPropertyName("badgeCatalog")] IReadOnlyList<BadgeStatusDto> BadgeCatalog,
    [property: JsonPropertyName("rewards")] IReadOnlyList<string> Rewards,
    [property: JsonPropertyName("createdAt")] DateTime CreatedAt,
    [property: JsonPropertyName("updatedAt")] DateTime UpdatedAt);

public sealed record BadgeStatusDto(
    [property: JsonPropertyName("code")] string Code,
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("description")] string Description,
    [property: JsonPropertyName("unlockCondition")] string UnlockCondition,
    [property: JsonPropertyName("isUnlocked")] bool IsUnlocked,
    [property: JsonPropertyName("progressCurrent")] int ProgressCurrent,
    [property: JsonPropertyName("progressTarget")] int ProgressTarget);

public sealed record LevelProgressDto(
    [property: JsonPropertyName("currentLevel")] int CurrentLevel,
    [property: JsonPropertyName("currentLevelXp")] int CurrentLevelXp,
    [property: JsonPropertyName("nextLevel")] int? NextLevel,
    [property: JsonPropertyName("nextLevelXp")] int? NextLevelXp,
    [property: JsonPropertyName("xpIntoCurrentLevel")] int XpIntoCurrentLevel,
    [property: JsonPropertyName("xpToNextLevel")] int XpToNextLevel,
    [property: JsonPropertyName("progressPercent")] int ProgressPercent);

public sealed record LevelMilestoneDto(
    [property: JsonPropertyName("level")] int Level,
    [property: JsonPropertyName("requiredXp")] int RequiredXp);

public sealed record ChildStreakResponse(
    [property: JsonPropertyName("childId")] string ChildId,
    [property: JsonPropertyName("currentStreak")] int CurrentStreak,
    [property: JsonPropertyName("targetStreakDays")] int TargetStreakDays,
    [property: JsonPropertyName("daysToStreak30")] int DaysToStreak30,
    [property: JsonPropertyName("progressPercent")] int ProgressPercent,
    [property: JsonPropertyName("isStreak30Unlocked")] bool IsStreak30Unlocked,
    [property: JsonPropertyName("badge")] BadgeStatusDto Badge);
