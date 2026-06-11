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
    [property: JsonPropertyName("streak")] int Streak,
    [property: JsonPropertyName("badges")] IReadOnlyList<string> Badges,
    [property: JsonPropertyName("rewards")] IReadOnlyList<string> Rewards,
    [property: JsonPropertyName("createdAt")] DateTime CreatedAt,
    [property: JsonPropertyName("updatedAt")] DateTime UpdatedAt);
