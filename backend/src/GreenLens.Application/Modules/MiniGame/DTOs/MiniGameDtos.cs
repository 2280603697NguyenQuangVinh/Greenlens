using System.Text.Json.Serialization;

namespace GreenLens.Application.Modules.MiniGame.DTOs;

public sealed record CompleteMiniGameRequest(
    [property: JsonPropertyName("childId")] string? ChildId,
    [property: JsonPropertyName("score")] int Score,
    [property: JsonPropertyName("correctAnswers")] int CorrectAnswers,
    [property: JsonPropertyName("wrongAnswers")] int WrongAnswers,
    [property: JsonPropertyName("durationSeconds")] int DurationSeconds);

public sealed record CompleteMiniGameResponse(
    [property: JsonPropertyName("xpEarned")] int XpEarned,
    [property: JsonPropertyName("newXp")] int NewXp,
    [property: JsonPropertyName("newLevel")] int NewLevel,
    [property: JsonPropertyName("streak")] int Streak,
    [property: JsonPropertyName("dailyActivityCompleted")] bool DailyActivityCompleted);
