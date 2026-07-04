using System.Text.Json;
using GreenLens.Application.Modules.Auth.DTOs;

namespace GreenLens.Api.Auth;

public static class DevBearerTokenFactory
{
    private static readonly TimeSpan TokenLifetime = TimeSpan.FromHours(8);

    public static AuthTokenResponse Create(string cognitoSub, IReadOnlyCollection<string>? groups = null)
    {
        if (string.IsNullOrWhiteSpace(cognitoSub))
        {
            throw new ArgumentException("cognitoSub is required.");
        }

        var username = cognitoSub.Trim();
        var now = DateTimeOffset.UtcNow;
        var token = BuildUnsignedJwt(username, now.Add(TokenLifetime), groups ?? []);

        return new AuthTokenResponse(
            "Bearer",
            token,
            token,
            $"dev-refresh-{Guid.NewGuid():N}",
            (int)TokenLifetime.TotalSeconds,
            now,
            username);
    }

    private static string BuildUnsignedJwt(string cognitoSub, DateTimeOffset expiresAt, IReadOnlyCollection<string> groups)
    {
        var header = Base64UrlEncode(JsonSerializer.SerializeToUtf8Bytes(new
        {
            alg = "none",
            typ = "JWT"
        }));

        var payloadJson = $$"""
        {
          "sub": {{JsonSerializer.Serialize(cognitoSub)}},
          "username": {{JsonSerializer.Serialize(cognitoSub)}},
          "cognito:groups": {{JsonSerializer.Serialize(groups)}},
          "exp": {{expiresAt.ToUnixTimeSeconds()}},
          "iat": {{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}}
        }
        """;

        var payload = Base64UrlEncode(JsonSerializer.SerializeToUtf8Bytes(
            JsonSerializer.Deserialize<JsonElement>(payloadJson)));

        return $"{header}.{payload}.dev-signature";
    }

    private static string Base64UrlEncode(byte[] value)
    {
        return Convert.ToBase64String(value)
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');
    }
}
