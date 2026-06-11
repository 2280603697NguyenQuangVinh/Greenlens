using System.Text.Json;
using Amazon.Lambda.APIGatewayEvents;

namespace GreenLens.Api.Auth;

public sealed class CognitoSubExtractor
{
    public string? Extract(APIGatewayProxyRequest request)
    {
        var authorizerSub = ExtractFromAuthorizer(request);
        if (!string.IsNullOrWhiteSpace(authorizerSub))
        {
            return authorizerSub;
        }

        var token = ExtractBearerToken(request);
        return string.IsNullOrWhiteSpace(token) ? null : ExtractFromJwt(token);
    }

    public string? ExtractFromAuthorizationHeader(string? authorizationHeader)
    {
        var token = ExtractBearerToken(authorizationHeader);
        return string.IsNullOrWhiteSpace(token) ? null : ExtractFromJwt(token);
    }

    private static string? ExtractFromAuthorizer(APIGatewayProxyRequest request)
    {
        var claims = request.RequestContext?.Authorizer?.Claims;
        if (claims is null)
        {
            return null;
        }

        if (claims.TryGetValue("sub", out var sub) && !string.IsNullOrWhiteSpace(sub))
        {
            return sub;
        }

        if (claims.TryGetValue("cognito:username", out var username) && !string.IsNullOrWhiteSpace(username))
        {
            return username;
        }

        return null;
    }

    private static string? ExtractBearerToken(APIGatewayProxyRequest request)
    {
        if (request.Headers is null)
        {
            return null;
        }

        var header = request.Headers.FirstOrDefault(header =>
            string.Equals(header.Key, "Authorization", StringComparison.OrdinalIgnoreCase)).Value;

        return ExtractBearerToken(header);
    }

    private static string? ExtractBearerToken(string? authorizationHeader)
    {
        if (string.IsNullOrWhiteSpace(authorizationHeader) ||
            !authorizationHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        return authorizationHeader["Bearer ".Length..].Trim();
    }

    private static string? ExtractFromJwt(string token)
    {
        try
        {
            var parts = token.Split('.');
            if (parts.Length != 3)
            {
                return null;
            }

            using var payload = JsonDocument.Parse(DecodeBase64Url(parts[1]));
            var root = payload.RootElement;

            if (IsExpired(root) || IsNotYetValid(root))
            {
                return null;
            }

            return root.TryGetProperty("sub", out var sub) ? sub.GetString() : null;
        }
        catch (FormatException)
        {
            return null;
        }
        catch (JsonException)
        {
            return null;
        }
        catch (ArgumentException)
        {
            return null;
        }
    }

    private static bool IsExpired(JsonElement root)
    {
        return root.TryGetProperty("exp", out var exp) &&
            exp.TryGetInt64(out var expSeconds) &&
            DateTimeOffset.FromUnixTimeSeconds(expSeconds) <= DateTimeOffset.UtcNow;
    }

    private static bool IsNotYetValid(JsonElement root)
    {
        return root.TryGetProperty("nbf", out var nbf) &&
            nbf.TryGetInt64(out var nbfSeconds) &&
            DateTimeOffset.FromUnixTimeSeconds(nbfSeconds) > DateTimeOffset.UtcNow;
    }

    private static byte[] DecodeBase64Url(string value)
    {
        var padded = value.Replace('-', '+').Replace('_', '/');
        padded = padded.PadRight(padded.Length + (4 - padded.Length % 4) % 4, '=');
        return Convert.FromBase64String(padded);
    }
}
