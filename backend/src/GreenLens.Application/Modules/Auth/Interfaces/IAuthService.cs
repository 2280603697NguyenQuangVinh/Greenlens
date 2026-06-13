using GreenLens.Application.Modules.Auth.DTOs;

namespace GreenLens.Application.Modules.Auth.Interfaces;

public interface IAuthService
{
    Task<AuthTokenResponse> RegisterAsync(
        AuthRegisterRequest request,
        CancellationToken cancellationToken = default);

    Task<AuthTokenResponse> LoginAsync(
        AuthLoginRequest request,
        CancellationToken cancellationToken = default);

    Task<AuthTokenResponse> RefreshAsync(
        AuthRefreshRequest request,
        CancellationToken cancellationToken = default);
}
