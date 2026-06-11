using Amazon.CognitoIdentityProvider;
using Amazon.CognitoIdentityProvider.Model;
using GreenLens.Application.Modules.ChildProfiles.Interfaces;

namespace GreenLens.Infrastructure.AWS.Cognito;

public sealed class CognitoChildIdentityService : IChildIdentityService
{
    private readonly IAmazonCognitoIdentityProvider _cognitoIdentityProvider;
    private readonly string _userPoolId;

    public CognitoChildIdentityService(
        IAmazonCognitoIdentityProvider cognitoIdentityProvider,
        string? userPoolId = null)
    {
        _cognitoIdentityProvider = cognitoIdentityProvider;
        _userPoolId = string.IsNullOrWhiteSpace(userPoolId)
            ? Environment.GetEnvironmentVariable("COGNITO_USER_POOL_ID")
                ?? throw new InvalidOperationException("COGNITO_USER_POOL_ID is required.")
            : userPoolId;
    }

    public async Task<string> CreateChildIdentityAsync(
        string childId,
        string characterName,
        CancellationToken cancellationToken = default)
    {
        var response = await _cognitoIdentityProvider.AdminCreateUserAsync(new AdminCreateUserRequest
        {
            UserPoolId = _userPoolId,
            Username = childId,
            MessageAction = MessageActionType.SUPPRESS,
            UserAttributes =
            [
                new AttributeType { Name = "name", Value = characterName }
            ]
        }, cancellationToken);

        var sub = response.User.Attributes.FirstOrDefault(attribute => attribute.Name == "sub")?.Value;
        if (string.IsNullOrWhiteSpace(sub))
        {
            throw new InvalidOperationException("Cognito did not return a sub for the child identity.");
        }

        return sub;
    }
}
