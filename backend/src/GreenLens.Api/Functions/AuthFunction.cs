using System.Net;
using System.Text.Json;
using Amazon.DynamoDBv2;
using Amazon.CognitoIdentityProvider;
using Amazon.Lambda.APIGatewayEvents;
using Amazon.Lambda.Core;
using GreenLens.Application.Modules.Auth.DTOs;
using GreenLens.Application.Modules.Auth.Interfaces;
using GreenLens.Application.Modules.ChildProfiles.DTOs;
using GreenLens.Application.Modules.ChildProfiles.Interfaces;
using GreenLens.Application.Modules.ChildProfiles.Services;
using GreenLens.Application.Modules.ChildProfiles.Validators;
using GreenLens.Api.Auth;
using GreenLens.Api.Repositories;
using GreenLens.Infrastructure.AWS.Cognito;
using GreenLens.Infrastructure.Repositories;

namespace GreenLens.Api.Functions;

public sealed class AuthFunction
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly IAuthService _authService;
    private readonly IChildProfileService _childProfileService;
    private readonly CognitoSubExtractor _cognitoSubExtractor;

    public AuthFunction()
        : this(CreateAuthService(), CreateChildProfileService(), new CognitoSubExtractor())
    {
    }

    public AuthFunction(
        IAuthService authService,
        IChildProfileService childProfileService,
        CognitoSubExtractor cognitoSubExtractor)
    {
        _authService = authService;
        _childProfileService = childProfileService;
        _cognitoSubExtractor = cognitoSubExtractor;
    }

    public Task<APIGatewayProxyResponse> RegisterAsync(
        APIGatewayProxyRequest request,
        ILambdaContext context)
    {
        return HandleAsync<AuthRegisterRequest>(request, context, _authService.RegisterAsync);
    }

    public Task<APIGatewayProxyResponse> LoginAsync(
        APIGatewayProxyRequest request,
        ILambdaContext context)
    {
        return HandleAsync<AuthLoginRequest>(request, context, _authService.LoginAsync);
    }

    public Task<APIGatewayProxyResponse> RefreshAsync(
        APIGatewayProxyRequest request,
        ILambdaContext context)
    {
        return HandleAsync<AuthRefreshRequest>(request, context, _authService.RefreshAsync);
    }

    public async Task<APIGatewayProxyResponse> RegisterChildAsync(
        APIGatewayProxyRequest request,
        ILambdaContext context)
    {
        RegisterChildRequest? body;
        try
        {
            body = JsonSerializer.Deserialize<RegisterChildRequest>(request.Body ?? string.Empty, JsonOptions);
        }
        catch (JsonException)
        {
            return JsonResponse(HttpStatusCode.BadRequest, new { message = "Invalid request body." });
        }

        if (body is null)
        {
            return JsonResponse(HttpStatusCode.BadRequest, new { message = "Invalid request body." });
        }

        try
        {
            var auth = await _authService.RegisterAsync(
                new AuthRegisterRequest(
                    body.Username,
                    null,
                    body.DisplayName ?? body.CharacterName,
                    body.Email),
                CancellationToken.None);

            var cognitoSub = _cognitoSubExtractor.ExtractFromAuthorizationHeader($"Bearer {auth.BearerToken}");
            if (string.IsNullOrWhiteSpace(cognitoSub))
            {
                return JsonResponse(
                    HttpStatusCode.BadGateway,
                    new { message = "Could not read Cognito sub from issued token." });
            }

            var profile = await _childProfileService.CreateAsync(
                new CreateChildProfileRequest(
                    body.CharacterName,
                    body.Gender,
                    body.Hair,
                    body.Eyes,
                    body.Outfit,
                    body.AvatarPreview),
                cognitoSub,
                CancellationToken.None);

            return JsonResponse(HttpStatusCode.OK, new RegisterChildResponse(auth, profile));
        }
        catch (ArgumentException exception)
        {
            return JsonResponse(HttpStatusCode.BadRequest, new { message = exception.Message });
        }
        catch (UnauthorizedAccessException)
        {
            return JsonResponse(HttpStatusCode.Unauthorized, new { message = "Invalid username or password." });
        }
        catch (InvalidOperationException exception)
        {
            context.Logger.LogLine($"Register child failed: {exception}");
            return JsonResponse(HttpStatusCode.BadGateway, new { message = exception.Message });
        }
    }

    private static async Task<APIGatewayProxyResponse> HandleAsync<TRequest>(
        APIGatewayProxyRequest request,
        ILambdaContext context,
        Func<TRequest, CancellationToken, Task<AuthTokenResponse>> handler)
    {
        TRequest? body;
        try
        {
            body = JsonSerializer.Deserialize<TRequest>(request.Body ?? string.Empty, JsonOptions);
        }
        catch (JsonException)
        {
            return JsonResponse(HttpStatusCode.BadRequest, new { message = "Invalid request body." });
        }

        if (body is null)
        {
            return JsonResponse(HttpStatusCode.BadRequest, new { message = "Invalid request body." });
        }

        try
        {
            var response = await handler(body, CancellationToken.None);
            return JsonResponse(HttpStatusCode.OK, response);
        }
        catch (ArgumentException exception)
        {
            return JsonResponse(HttpStatusCode.BadRequest, new { message = exception.Message });
        }
        catch (UnauthorizedAccessException)
        {
            return JsonResponse(HttpStatusCode.Unauthorized, new { message = "Invalid username or password." });
        }
        catch (InvalidOperationException exception)
        {
            context.Logger.LogLine($"Auth operation failed: {exception}");
            return JsonResponse(HttpStatusCode.BadGateway, new { message = exception.Message });
        }
    }

    private static IAuthService CreateAuthService()
    {
        return new CognitoAuthService(
            new AmazonCognitoIdentityProviderClient(),
            new CognitoAuthOptions
            {
                UserPoolId = Environment.GetEnvironmentVariable("COGNITO_USER_POOL_ID") ?? string.Empty,
                AppClientId = Environment.GetEnvironmentVariable("COGNITO_APP_CLIENT_ID") ?? string.Empty,
                AppClientSecret = Environment.GetEnvironmentVariable("COGNITO_APP_CLIENT_SECRET")
            });
    }

    private static IChildProfileService CreateChildProfileService()
    {
        return new ChildProfileService(
            new ChildProfileRepository(
                new AmazonDynamoDBClient(),
                Environment.GetEnvironmentVariable("CHILD_PROFILES_TABLE_NAME") ??
                Environment.GetEnvironmentVariable("DYNAMODB_CHILD_PROFILES_TABLE")),
            new InMemoryChildIdentityService(),
            new CreateChildProfileValidator());
    }

    private static APIGatewayProxyResponse JsonResponse(HttpStatusCode statusCode, object body)
    {
        return new APIGatewayProxyResponse
        {
            StatusCode = (int)statusCode,
            Headers = new Dictionary<string, string>
            {
                ["Content-Type"] = "application/json",
                ["Access-Control-Allow-Origin"] = "*"
            },
            Body = JsonSerializer.Serialize(body, JsonOptions)
        };
    }
}
