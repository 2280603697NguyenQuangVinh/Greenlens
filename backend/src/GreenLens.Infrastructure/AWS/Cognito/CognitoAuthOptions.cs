namespace GreenLens.Infrastructure.AWS.Cognito;

public sealed class CognitoAuthOptions
{
    public string UserPoolId { get; init; } = string.Empty;
    public string AppClientId { get; init; } = string.Empty;
    public string? AppClientSecret { get; init; }
}
