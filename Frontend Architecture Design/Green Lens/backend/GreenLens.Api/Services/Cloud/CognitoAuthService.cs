using GreenLens.Api.Interfaces;
using GreenLens.Api.Models;

namespace GreenLens.Api.Services.Cloud;

public class CognitoAuthService : IAuthService
{
    public Task<AuthResult> LoginOrRegisterAsync(string badgeId, AvatarConfigDto? avatar)
    {
        // TODO: Integrate AWS Cognito custom auth with Badge ID attribute.
        throw new NotImplementedException();
    }

    public Task<AuthResult> LoginAsync(string badgeId)
    {
        // TODO: Cognito login by Badge ID.
        throw new NotImplementedException();
    }
}
