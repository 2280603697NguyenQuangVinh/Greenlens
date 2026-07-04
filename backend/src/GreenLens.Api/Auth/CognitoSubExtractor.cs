using System.Text.Json;
using Amazon.Lambda.APIGatewayEvents;

namespace GreenLens.Api.Auth;

public sealed class CognitoSubExtractor
{
    public CognitoPrincipal ExtractPrincipal(APIGatewayProxyRequest request)
    {
        var subject = ExtractFromAuthorizer(request);
        var groups = ExtractGroupsFromAuthorizer(request);
        if (!string.IsNullOrWhiteSpace(subject))
        {
            return new CognitoPrincipal(subject, groups);
        }

        var token = ExtractBearerToken(request);
        return string.IsNullOrWhiteSpace(token)
            ? new CognitoPrincipal(null, [])
            : ExtractPrincipalFromJwt(token);
    }

    public CognitoPrincipal ExtractPrincipalFromAuthorizationHeader(string? authorizationHeader)
    {
        var token = ExtractBearerToken(authorizationHeader);
        return string.IsNullOrWhiteSpace(token)
            ? new CognitoPrincipal(null, [])
            : ExtractPrincipalFromJwt(token);
    }

    public string? Extract(APIGatewayProxyRequest request)
    {
        return ExtractPrincipal(request).Subject;
    }

    public string? ExtractFromAuthorizationHeader(string? authorizationHeader)
    {
        return ExtractPrincipalFromAuthorizationHeader(authorizationHeader).Subject;
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

    private static IReadOnlyList<string> ExtractGroupsFromAuthorizer(APIGatewayProxyRequest request)
    {
        var claims = request.RequestContext?.Authorizer?.Claims;
        if (claims is null)
        {
            return [];
        }

        if (!claims.TryGetValue("cognito:groups", out var groupsValue) ||
            string.IsNullOrWhiteSpace(groupsValue))
        {
            return [];
        }

        return groupsValue
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .ToList();
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

    private static CognitoPrincipal ExtractPrincipalFromJwt(string token)
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
                return new CognitoPrincipal(null, []);
            }

            var subject = root.TryGetProperty("sub", out var sub) ? sub.GetString() : null;
            var groups = ExtractGroups(root);
            return new CognitoPrincipal(subject, groups);
        }
        catch (FormatException)
        {
            return new CognitoPrincipal(null, []);
        }
        catch (JsonException)
        {
            return new CognitoPrincipal(null, []);
        }
        catch (ArgumentException)
        {
            return new CognitoPrincipal(null, []);
        }
    }

    private static IReadOnlyList<string> ExtractGroups(JsonElement root)
    {
        if (!root.TryGetProperty("cognito:groups", out var groups))
        {
            return [];
        }

        if (groups.ValueKind == JsonValueKind.Array)
        {
            return groups.EnumerateArray()
                .Select(item => item.GetString())
                .Where(item => !string.IsNullOrWhiteSpace(item))
                .Select(item => item!)
                .ToList();
        }

        if (groups.ValueKind == JsonValueKind.String)
        {
            var value = groups.GetString();
            if (string.IsNullOrWhiteSpace(value))
            {
                return [];
            }

            if (value.StartsWith("[", StringComparison.Ordinal))
            {
                try
                {
                    using var parsed = JsonDocument.Parse(value);
                    if (parsed.RootElement.ValueKind == JsonValueKind.Array)
                    {
                        return parsed.RootElement.EnumerateArray()
                            .Select(item => item.GetString())
                            .Where(item => !string.IsNullOrWhiteSpace(item))
                            .Select(item => item!)
                            .ToList();
                    }
                }
                catch (JsonException)
                {
                }
            }

            return value
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .ToList();
        }

        return [];
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
