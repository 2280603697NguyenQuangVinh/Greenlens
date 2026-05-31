using GreenLens.Api.Models;

namespace GreenLens.Api.Interfaces;

public interface IAuthService
{
    Task<AuthResult> LoginOrRegisterAsync(string badgeId, AvatarConfigDto? avatar);
    Task<AuthResult> LoginAsync(string badgeId);
}
