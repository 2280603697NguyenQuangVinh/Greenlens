using System.Text.Json;
using GreenLens.Application.Modules.Auth.DTOs;

namespace GreenLens.Api.Auth;

public static class DevBearerTokenFactory
{
    private static readonly TimeSpan TokenLifetime = TimeSpan.FromHours(8);

    public static AuthTokenResponse Create(string cognitoSub)
    {
        if (string.IsNullOrWhiteSpace(cognitoSub))
        {
            throw new ArgumentException("cognitoSub is required.");
        }

        var username = cognitoSub.Trim();
        var now = DateTimeOffset.UtcNow;
        var token = BuildUnsignedJwt(username, now.Add(TokenLifetime));

        return new AuthTokenResponse(
            "Bearer",
            token,
            token,
            $"dev-refresh-{Guid.NewGuid():N}",
            (int)TokenLifetime.TotalSeconds,
            now,
            username);
    }

    private static string BuildUnsignedJwt(string cognitoSub, DateTimeOffset expiresAt)
    {
        var header = Base64UrlEncode(JsonSerializer.SerializeToUtf8Bytes(new
        {
            alg = "none",
            typ = "JWT"
        }));

        var payload = Base64UrlEncode(JsonSerializer.SerializeToUtf8Bytes(new
        {
            sub = cognitoSub,
            username = cognitoSub,
            exp = expiresAt.ToUnixTimeSeconds(),
            iat = DateTimeOffset.UtcNow.ToUnixTimeSeconds()
        }));

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
