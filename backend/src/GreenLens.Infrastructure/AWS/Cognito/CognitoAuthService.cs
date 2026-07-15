using System.Security.Cryptography;
using System.Text;
using Amazon.CognitoIdentityProvider;
using Amazon.CognitoIdentityProvider.Model;
using GreenLens.Application.Modules.Auth.DTOs;
using GreenLens.Application.Modules.Auth.Interfaces;

namespace GreenLens.Infrastructure.AWS.Cognito;

public sealed class CognitoAuthService : IAuthService
{
    private readonly IAmazonCognitoIdentityProvider _cognito;
    private readonly CognitoAuthOptions _options;

    public CognitoAuthService(
        IAmazonCognitoIdentityProvider cognito,
        CognitoAuthOptions options)
    {
        _cognito = cognito;
        _options = options;
    }

    public async Task<AuthTokenResponse> RegisterAsync(
        AuthRegisterRequest request,
        CancellationToken cancellationToken = default)
    {
        var username = NormalizeUsername(request.Username ?? request.Email);
        var password = string.IsNullOrWhiteSpace(request.Password)
            ? GeneratePassword()
            : request.Password;
        EnsureConfigured();

        try
        {
            await _cognito.AdminCreateUserAsync(new AdminCreateUserRequest
            {
                UserPoolId = _options.UserPoolId,
                Username = username,
                MessageAction = MessageActionType.SUPPRESS,
                UserAttributes = BuildUserAttributes(request)
            }, cancellationToken);
        }
        catch (UsernameExistsException)
        {
            throw new ArgumentException("Username already exists.");
        }

        await _cognito.AdminSetUserPasswordAsync(new AdminSetUserPasswordRequest
        {
            UserPoolId = _options.UserPoolId,
            Username = username,
            Password = password,
            Permanent = true
        }, cancellationToken);

        return await LoginAsync(new AuthLoginRequest(username, password), cancellationToken);
    }

    public async Task<AuthTokenResponse> LoginAsync(
        AuthLoginRequest request,
        CancellationToken cancellationToken = default)
    {
        var username = NormalizeUsername(request.Username);
        var password = RequirePassword(request.Password);
        EnsureConfigured();

        var authParameters = new Dictionary<string, string>
        {
            ["USERNAME"] = username,
            ["PASSWORD"] = password
        };
        AddSecretHash(authParameters, username);

        try
        {
            var response = await _cognito.AdminInitiateAuthAsync(new AdminInitiateAuthRequest
            {
                UserPoolId = _options.UserPoolId,
                ClientId = _options.AppClientId,
                AuthFlow = AuthFlowType.ADMIN_USER_PASSWORD_AUTH,
                AuthParameters = authParameters
            }, cancellationToken);

            return MapAuthResult(username, response.AuthenticationResult);
        }
        catch (NotAuthorizedException)
        {
            throw new UnauthorizedAccessException("Invalid username or password.");
        }
        catch (UserNotFoundException)
        {
            throw new UnauthorizedAccessException("Invalid username or password.");
        }
        catch (InvalidParameterException exception)
            when (exception.Message.Contains("Auth flow not enabled", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                "Cognito app client must enable ALLOW_ADMIN_USER_PASSWORD_AUTH for backend login.",
                exception);
        }
    }

    public async Task<AuthTokenResponse> RefreshAsync(
        AuthRefreshRequest request,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.RefreshToken))
        {
            throw new ArgumentException("refreshToken is required.");
        }

        EnsureConfigured();
        var username = request.Username?.Trim() ?? string.Empty;
        var authParameters = new Dictionary<string, string>
        {
            ["REFRESH_TOKEN"] = request.RefreshToken.Trim()
        };

        if (!string.IsNullOrWhiteSpace(username))
        {
            AddSecretHash(authParameters, username);
        }
        else if (!string.IsNullOrWhiteSpace(_options.AppClientSecret))
        {
            throw new ArgumentException("username is required when Cognito app client secret is configured.");
        }

        try
        {
            var response = await _cognito.InitiateAuthAsync(new InitiateAuthRequest
            {
                ClientId = _options.AppClientId,
                AuthFlow = AuthFlowType.REFRESH_TOKEN_AUTH,
                AuthParameters = authParameters
            }, cancellationToken);

            return MapAuthResult(username, response.AuthenticationResult, request.RefreshToken.Trim());
        }
        catch (NotAuthorizedException)
        {
            throw new UnauthorizedAccessException("Refresh token has expired.");
        }
        catch (UserNotFoundException)
        {
            throw new UnauthorizedAccessException("Refresh token is no longer valid.");
        }
        catch (InvalidParameterException exception)
            when (exception.Message.Contains("Refresh Token has expired", StringComparison.OrdinalIgnoreCase))
        {
            throw new UnauthorizedAccessException("Refresh token has expired.");
        }
    }

    public async Task<AuthTokenResponse> IssueChildSessionAsync(
        string cognitoSub,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(cognitoSub))
        {
            throw new ArgumentException("cognitoSub is required.");
        }

        EnsureConfigured();

        var username = await ResolveUsernameBySubAsync(cognitoSub.Trim(), cancellationToken);
        var password = GeneratePassword();

        await _cognito.AdminSetUserPasswordAsync(new AdminSetUserPasswordRequest
        {
            UserPoolId = _options.UserPoolId,
            Username = username,
            Password = password,
            Permanent = true
        }, cancellationToken);

        return await LoginAsync(new AuthLoginRequest(username, password), cancellationToken);
    }

    private static List<AttributeType> BuildUserAttributes(AuthRegisterRequest request)
    {
        var attributes = new List<AttributeType>();

        if (!string.IsNullOrWhiteSpace(request.DisplayName))
        {
            attributes.Add(new AttributeType { Name = "name", Value = request.DisplayName.Trim() });
        }

        if (!string.IsNullOrWhiteSpace(request.Email))
        {
            attributes.Add(new AttributeType { Name = "email", Value = request.Email.Trim() });
            attributes.Add(new AttributeType { Name = "email_verified", Value = "true" });
        }

        return attributes;
    }

    private AuthTokenResponse MapAuthResult(
        string username,
        AuthenticationResultType result,
        string? fallbackRefreshToken = null)
    {
        if (string.IsNullOrWhiteSpace(result.IdToken) || string.IsNullOrWhiteSpace(result.AccessToken))
        {
            throw new InvalidOperationException("Cognito did not return authentication tokens.");
        }

        return new AuthTokenResponse(
            "Bearer",
            result.IdToken,
            result.AccessToken,
            result.RefreshToken ?? fallbackRefreshToken,
            result.ExpiresIn,
            DateTimeOffset.UtcNow,
            username);
    }

    private void AddSecretHash(IDictionary<string, string> authParameters, string username)
    {
        if (string.IsNullOrWhiteSpace(_options.AppClientSecret))
        {
            return;
        }

        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(_options.AppClientSecret));
        var message = Encoding.UTF8.GetBytes(username + _options.AppClientId);
        authParameters["SECRET_HASH"] = Convert.ToBase64String(hmac.ComputeHash(message));
    }

    private void EnsureConfigured()
    {
        if (string.IsNullOrWhiteSpace(_options.UserPoolId))
        {
            throw new InvalidOperationException("COGNITO_USER_POOL_ID is required.");
        }

        if (string.IsNullOrWhiteSpace(_options.AppClientId))
        {
            throw new InvalidOperationException("COGNITO_APP_CLIENT_ID is required.");
        }
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

    private static string GeneratePassword()
    {
        return $"GL-{Guid.NewGuid():N}-aA1!";
    }

    private async Task<string> ResolveUsernameBySubAsync(
        string cognitoSub,
        CancellationToken cancellationToken)
    {
        var response = await _cognito.ListUsersAsync(new ListUsersRequest
        {
            UserPoolId = _options.UserPoolId,
            Filter = $"sub = \"{cognitoSub}\"",
            Limit = 1
        }, cancellationToken);

        var username = response.Users
            .FirstOrDefault()?.Username?
            .Trim();

        if (string.IsNullOrWhiteSpace(username))
        {
            throw new UnauthorizedAccessException("Child identity was not found in Cognito.");
        }

        return username;
    }
}
