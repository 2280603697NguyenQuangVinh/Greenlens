namespace GreenLens.Domain.Modules.ChildProfiles.Entities;

public sealed class ChildProfile
{
    public required string ChildId { get; init; }
    public required string CognitoSub { get; init; }
    public required string CharacterName { get; init; }
    public required string Gender { get; init; }
    public required string Hair { get; init; }
    public required string Eyes { get; init; }
    public required string Outfit { get; init; }
    public required string AvatarPreview { get; init; }
    public int Xp { get; init; }
    public int Level { get; init; }
    public int Streak { get; init; }
    public string? LastStreakDate { get; init; }
    public int StreakFreezeDaysUsed { get; init; }
    public int AiCameraScanCount { get; init; }
    public int MiniGameHighScore { get; init; }
    public IReadOnlyList<string> Badges { get; init; } = [];
    public IReadOnlyList<string> Rewards { get; init; } = [];
    public required DateTime CreatedAt { get; init; }
    public required DateTime UpdatedAt { get; init; }
}
