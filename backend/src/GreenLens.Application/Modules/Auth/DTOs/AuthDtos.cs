using System.Text.Json.Serialization;

namespace GreenLens.Application.Modules.Auth.DTOs;

public sealed record AuthRegisterRequest(
    [property: JsonPropertyName("username")] string? Username,
    [property: JsonPropertyName("password")] string? Password,
    [property: JsonPropertyName("displayName")] string? DisplayName,
    [property: JsonPropertyName("email")] string? Email);

public sealed record AuthLoginRequest(
    [property: JsonPropertyName("username")] string? Username,
    [property: JsonPropertyName("password")] string? Password);

public sealed record AuthRefreshRequest(
    [property: JsonPropertyName("refreshToken")] string? RefreshToken,
    [property: JsonPropertyName("username")] string? Username);

public sealed record DevLoginRequest(
    [property: JsonPropertyName("cognitoSub")] string? CognitoSub);

public sealed record RegisterChildRequest(
    [property: JsonPropertyName("username")] string? Username,
    [property: JsonPropertyName("displayName")] string? DisplayName,
    [property: JsonPropertyName("email")] string? Email,
    [property: JsonPropertyName("characterName")] string? CharacterName,
    [property: JsonPropertyName("gender")] string? Gender,
    [property: JsonPropertyName("hair")] string? Hair,
    [property: JsonPropertyName("eyes")] string? Eyes,
    [property: JsonPropertyName("outfit")] string? Outfit,
    [property: JsonPropertyName("avatarPreview")] string? AvatarPreview,
    [property: JsonPropertyName("deviceId")] string? DeviceId);

public sealed record GuestChildLoginRequest(
    [property: JsonPropertyName("childId")] string? ChildId,
    [property: JsonPropertyName("deviceId")] string? DeviceId,
    [property: JsonPropertyName("cognitoSub")] string? CognitoSub);

public sealed record RegisterChildResponse(
    [property: JsonPropertyName("auth")] AuthTokenResponse Auth,
    [property: JsonPropertyName("profile")] GreenLens.Application.Modules.ChildProfiles.DTOs.ChildProfileResponse Profile);

public sealed record GuestChildLoginResponse(
    [property: JsonPropertyName("auth")] AuthTokenResponse Auth,
    [property: JsonPropertyName("profile")] GreenLens.Application.Modules.ChildProfiles.DTOs.ChildProfileResponse Profile);

public sealed record AuthTokenResponse(
    [property: JsonPropertyName("tokenType")] string TokenType,
    [property: JsonPropertyName("idToken")] string IdToken,
    [property: JsonPropertyName("accessToken")] string AccessToken,
    [property: JsonPropertyName("refreshToken")] string? RefreshToken,
    [property: JsonPropertyName("expiresIn")] int ExpiresIn,
    [property: JsonPropertyName("issuedAt")] DateTimeOffset IssuedAt,
    [property: JsonPropertyName("username")] string Username)
{
    [JsonPropertyName("bearerToken")]
    public string BearerToken => IdToken;
}
