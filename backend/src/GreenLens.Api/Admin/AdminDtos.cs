using System.Text.Json.Serialization;
using GreenLens.Application.Modules.Quiz.DTOs;

namespace GreenLens.Api.Admin;

public sealed record AdminOverviewResponse(
    [property: JsonPropertyName("totals")] AdminTotalsDto Totals,
    [property: JsonPropertyName("daily")] IReadOnlyList<AdminDailyMetricDto> Daily,
    [property: JsonPropertyName("quizPool")] AdminQuizPoolHealthDto QuizPool,
    [property: JsonPropertyName("streak")] AdminStreakSummaryDto Streak,
    [property: JsonPropertyName("badgeCatalog")] IReadOnlyList<AdminBadgeCatalogDto> BadgeCatalog,
    [property: JsonPropertyName("notes")] IReadOnlyList<string> Notes);

public sealed record AdminTotalsDto(
    int TotalChildren,
    int TotalAiCameraScans,
    int TotalQuizSessions,
    int TotalMiniGameSessions,
    int DailyActiveUsers,
    int ChildrenWithActiveStreak);

public sealed record AdminDailyMetricDto(
    string Date,
    int Signups,
    int Scans,
    int QuizCompletions,
    int MiniGameSessions);

public sealed record AdminQuizPoolHealthDto(
    int ReadyCount,
    int ClaimedCount,
    int FailedCount,
    int SupersededCount,
    int FallbackCount,
    DateTime? LastRefillAt);

public sealed record AdminStreakSummaryDto(
    int ActiveToday,
    int Streak7OrMore,
    int Streak30OrMore,
    int DisabledChildren,
    int ArchivedChildren);

public sealed record AdminBadgeCatalogDto(
    string Code,
    string Name,
    string Description,
    bool Enabled);

public sealed record AdminChildListResponse(
    IReadOnlyList<AdminChildListItemDto> Items,
    int Total);

public sealed record AdminChildListItemDto(
    string ChildId,
    string CharacterName,
    int Level,
    int Xp,
    int Streak,
    int MiniGameHighScore,
    int AiCameraScanCount,
    string Status,
    DateTime CreatedAt,
    DateTime UpdatedAt);

public sealed record AdminChildDetailDto(
    string ChildId,
    string CognitoSub,
    string CharacterName,
    string Gender,
    string Hair,
    string Eyes,
    string Outfit,
    string AvatarPreview,
    int Xp,
    int Level,
    int Streak,
    string? LastStreakDate,
    int StreakFreezeDaysUsed,
    int AiCameraScanCount,
    int MiniGameHighScore,
    IReadOnlyList<string> Badges,
    IReadOnlyList<string> Rewards,
    string Status,
    string? UpdatedBy,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    IReadOnlyList<AdminQuizSessionListItemDto> RecentQuizSessions,
    IReadOnlyList<AdminMiniGameResultDto> RecentMiniGameResults);

public sealed record AdminAdjustXpRequest(
    [property: JsonPropertyName("xp")] int Xp);

public sealed record AdminQuizFallbackDto(
    string FallbackKey,
    int TargetAge,
    string Status,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    string? UpdatedBy,
    IReadOnlyList<QuizQuestionDto> Questions);

public sealed record AdminSaveQuizFallbackRequest(
    [property: JsonPropertyName("fallbackKey")] string? FallbackKey,
    [property: JsonPropertyName("targetAge")] int TargetAge,
    [property: JsonPropertyName("questions")] IReadOnlyList<QuizQuestionDto>? Questions);

public sealed record AdminQuizPoolListResponse(
    IReadOnlyList<AdminQuizPoolItemDto> Items,
    AdminQuizPoolHealthDto Health);

public sealed record AdminQuizPoolItemDto(
    string QuizSetId,
    string Topic,
    int TargetAge,
    string Status,
    int QuestionCount,
    DateTime CreatedAt,
    DateTime? ClaimedAt,
    DateTime? FailedAt,
    DateTime ExpiresAt);

public sealed record AdminQuizSessionListItemDto(
    string SessionId,
    string ChildId,
    string WasteType,
    int TargetAge,
    string Status,
    int CorrectAnswers,
    int XpAwarded,
    DateTime CreatedAt,
    DateTime UpdatedAt);

public sealed record AdminAiCameraRecordDto(
    string RecordId,
    string ChildId,
    string Label,
    string Category,
    double Confidence,
    DateTime CreatedAt,
    string Status);

public sealed record AdminMiniGameItemsResponse(
    IReadOnlyList<AdminMiniGameItemDto> Items,
    IReadOnlyList<AdminLeaderboardEntryDto> Leaderboard);

public sealed record AdminMiniGameItemDto(
    string ItemId,
    string Name,
    string Category,
    string BinColor,
    string IconKey,
    string Difficulty,
    bool IsActive,
    string Status,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    string? UpdatedBy);

public sealed record AdminSaveMiniGameItemRequest(
    [property: JsonPropertyName("itemId")] string? ItemId,
    [property: JsonPropertyName("name")] string? Name,
    [property: JsonPropertyName("category")] string? Category,
    [property: JsonPropertyName("binColor")] string? BinColor,
    [property: JsonPropertyName("iconKey")] string? IconKey,
    [property: JsonPropertyName("difficulty")] string? Difficulty,
    [property: JsonPropertyName("isActive")] bool IsActive);

public sealed record AdminLeaderboardEntryDto(
    int Rank,
    string ChildId,
    string Name,
    int MiniGameHighScore);

public sealed record AdminMiniGameResultDto(
    string ResultId,
    string GameType,
    int Score,
    int CorrectCount,
    int WrongCount,
    int DurationSeconds,
    int XpAwarded,
    DateTime CreatedAt);
