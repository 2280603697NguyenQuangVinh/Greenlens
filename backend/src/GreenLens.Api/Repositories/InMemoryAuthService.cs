using GreenLens.Api.Auth;
using GreenLens.Application.Modules.Auth.DTOs;
using GreenLens.Application.Modules.Auth.Interfaces;

namespace GreenLens.Api.Repositories;

public sealed class InMemoryAuthService : IAuthService
{
    private readonly Dictionary<string, string> _passwords = new(StringComparer.OrdinalIgnoreCase);

    public Task<AuthTokenResponse> RegisterAsync(
        AuthRegisterRequest request,
        CancellationToken cancellationToken = default)
    {
        var username = NormalizeUsername(request.Username ?? request.Email);
        var password = string.IsNullOrWhiteSpace(request.Password)
            ? $"Dev-{Guid.NewGuid():N}-1a!"
            : request.Password;

        _passwords[username] = password;

        return Task.FromResult(DevBearerTokenFactory.Create(username));
    }

    public Task<AuthTokenResponse> LoginAsync(
        AuthLoginRequest request,
        CancellationToken cancellationToken = default)
    {
        var username = NormalizeUsername(request.Username);
        var password = RequirePassword(request.Password);

        if (_passwords.TryGetValue(username, out var savedPassword) && savedPassword != password)
        {
            throw new UnauthorizedAccessException("Invalid username or password.");
        }

        _passwords.TryAdd(username, password);
        return Task.FromResult(DevBearerTokenFactory.Create(username));
    }

    public Task<AuthTokenResponse> RefreshAsync(
        AuthRefreshRequest request,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.RefreshToken))
        {
            throw new ArgumentException("refreshToken is required.");
        }

        var username = NormalizeUsername(request.Username ?? "local-child");
        return Task.FromResult(DevBearerTokenFactory.Create(username));
    }

    private static string NormalizeUsername(string? username)
    {
        if (string.IsNullOrWhiteSpace(username))
        {
            throw new ArgumentException("username is required.");
        }

        return username.Trim();
    }

    private static string RequirePassword(string? password)
    {
        if (string.IsNullOrWhiteSpace(password))
        {
            throw new ArgumentException("password is required.");
        }

        return password;
    }
}
