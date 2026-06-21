using System.Text.Json.Serialization;

namespace GreenLens.Application.Modules.MiniGames.DTOs;

public sealed record SubmitTrashSortResultRequest(
    [property: JsonPropertyName("childId")] string? ChildId,
    [property: JsonPropertyName("correctCount")] int CorrectCount,
    [property: JsonPropertyName("wrongCount")] int WrongCount,
    [property: JsonPropertyName("durationSeconds")] int DurationSeconds,
    [property: JsonPropertyName("completedFromDailyActivity")] bool CompletedFromDailyActivity = false);

public sealed record SubmitTrashSortResultResponse(
    [property: JsonPropertyName("resultId")] string ResultId,
    [property: JsonPropertyName("childId")] string ChildId,
    [property: JsonPropertyName("gameType")] string GameType,
    [property: JsonPropertyName("score")] int Score,
    [property: JsonPropertyName("correctCount")] int CorrectCount,
    [property: JsonPropertyName("wrongCount")] int WrongCount,
    [property: JsonPropertyName("durationSeconds")] int DurationSeconds,
    [property: JsonPropertyName("xpAwarded")] int XpAwarded,
    [property: JsonPropertyName("isPersonalBest")] bool IsPersonalBest,
    [property: JsonPropertyName("unlockedBadges")] IReadOnlyList<string> UnlockedBadges,
    [property: JsonPropertyName("dailyActivityUpdated")] bool DailyActivityUpdated,
    [property: JsonPropertyName("createdAt")] DateTime CreatedAt);

public sealed record TrashSortItemsResponse(
    [property: JsonPropertyName("items")] IReadOnlyList<TrashSortItemDto> Items,
    [property: JsonPropertyName("bins")] IReadOnlyList<TrashSortBinDto> Bins);

public sealed record TrashSortItemDto(
    [property: JsonPropertyName("itemId")] string ItemId,
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("category")] string Category,
    [property: JsonPropertyName("binColor")] string BinColor,
    [property: JsonPropertyName("iconUrl")] string IconUrl,
    [property: JsonPropertyName("difficulty")] string Difficulty);

public sealed record TrashSortBinDto(
    [property: JsonPropertyName("category")] string Category,
    [property: JsonPropertyName("binColor")] string BinColor,
    [property: JsonPropertyName("label")] string Label);

public sealed record MiniGameItemDto(
    string ItemId,
    string Name,
    string Category,
    string BinColor,
    string IconKey,
    string Difficulty,
    bool IsActive);

public sealed record MiniGameResultDto(
    string ResultId,
    string ChildId,
    string CognitoSub,
    string GameType,
    int Score,
    int CorrectCount,
    int WrongCount,
    int DurationSeconds,
    int XpAwarded,
    bool CompletedFromDailyActivity,
    DateTime CreatedAt);
