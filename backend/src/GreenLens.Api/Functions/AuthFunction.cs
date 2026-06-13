using System.Net;
using System.Text.Json;
using Amazon.CognitoIdentityProvider;
using Amazon.Lambda.APIGatewayEvents;
using Amazon.Lambda.Core;
using GreenLens.Application.Modules.Auth.DTOs;
using GreenLens.Application.Modules.Auth.Interfaces;
using GreenLens.Infrastructure.AWS.Cognito;

namespace GreenLens.Api.Functions;

public sealed class AuthFunction
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly IAuthService _authService;

    public AuthFunction()
        : this(CreateService())
    {
    }

    public AuthFunction(IAuthService authService)
    {
        _authService = authService;
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

    private static IAuthService CreateService()
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
