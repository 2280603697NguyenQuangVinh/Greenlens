namespace GreenLens.Api.Auth;

public sealed record CognitoPrincipal(
    string? Subject,
    IReadOnlyList<string> Groups)
{
    public bool IsAdmin => Groups.Any(group =>
        string.Equals(group, "admin", StringComparison.OrdinalIgnoreCase));
}
