using System.Net;
using System.Text.Json;
using Amazon.DynamoDBv2;
using Amazon.Lambda.APIGatewayEvents;
using Amazon.Lambda.Core;
using GreenLens.Api.Admin;
using GreenLens.Api.Auth;
using GreenLens.Api.Services;
using GreenLens.Application.Modules.Quiz.Interfaces;
using GreenLens.Infrastructure.AWS.DynamoDB;

namespace GreenLens.Api.Functions;

public sealed class AdminFunction
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly IAdminService _adminService;
    private readonly CognitoSubExtractor _cognitoSubExtractor;

    public AdminFunction()
        : this(CreateService(), new CognitoSubExtractor())
    {
    }

    public AdminFunction(
        IAdminService adminService,
        CognitoSubExtractor cognitoSubExtractor)
    {
        _adminService = adminService;
        _cognitoSubExtractor = cognitoSubExtractor;
    }

    public async Task<APIGatewayProxyResponse> HandleAsync(
        APIGatewayProxyRequest request,
        ILambdaContext context)
    {
        var principal = _cognitoSubExtractor.ExtractPrincipal(request);
        if (string.IsNullOrWhiteSpace(principal.Subject))
        {
            return JsonResponse(HttpStatusCode.Unauthorized, new { message = "Authorization Bearer token is required." });
        }

        if (!principal.IsAdmin)
        {
            return JsonResponse(HttpStatusCode.Forbidden, new { message = "Admin access is required." });
        }

        try
        {
            var method = request.HttpMethod?.ToUpperInvariant() ?? "GET";
            var path = request.Path?.TrimEnd('/') ?? string.Empty;
            var childId = GetPathParam(request, "childId");
            var fallbackKey = GetPathParam(request, "fallbackKey");
            var itemId = GetPathParam(request, "itemId");

            return (method, path) switch
            {
                ("GET", "/admin/overview") => JsonResponse(HttpStatusCode.OK, await _adminService.GetOverviewAsync()),
                ("GET", "/admin/children") => JsonResponse(HttpStatusCode.OK, await _adminService.GetChildrenAsync(
                    GetQuery(request, "search"),
                    GetQuery(request, "status"))),
                ("GET", _) when !string.IsNullOrWhiteSpace(childId) && path == $"/admin/children/{childId}" =>
                    JsonResponse(HttpStatusCode.OK, await _adminService.GetChildAsync(childId)),
                ("POST", _) when !string.IsNullOrWhiteSpace(childId) && path == $"/admin/children/{childId}/archive" =>
                    await EmptyOkAsync(() => _adminService.ArchiveChildAsync(childId, principal.Subject!)),
                ("POST", _) when !string.IsNullOrWhiteSpace(childId) && path == $"/admin/children/{childId}/lock" =>
                    await EmptyOkAsync(() => _adminService.LockChildAsync(childId, principal.Subject!)),
                ("POST", _) when !string.IsNullOrWhiteSpace(childId) && path == $"/admin/children/{childId}/unlock" =>
                    await EmptyOkAsync(() => _adminService.UnlockChildAsync(childId, principal.Subject!)),
                ("POST", _) when !string.IsNullOrWhiteSpace(childId) && path == $"/admin/children/{childId}/streak/reset" =>
                    await EmptyOkAsync(() => _adminService.ResetChildStreakAsync(childId, principal.Subject!)),
                ("POST", _) when !string.IsNullOrWhiteSpace(childId) && path == $"/admin/children/{childId}/ai-camera/reset-quota" =>
                    JsonResponse(HttpStatusCode.OK, await ResetAiCameraQuotaAsync(childId, principal.Subject!)),
                ("POST", _) when !string.IsNullOrWhiteSpace(childId) && path == $"/admin/children/{childId}/xp-adjust" =>
                    JsonResponse(HttpStatusCode.OK, await AdjustXpAsync(request, childId, principal.Subject!)),
                ("GET", "/admin/quiz/fallbacks") => JsonResponse(HttpStatusCode.OK, await _adminService.GetQuizFallbacksAsync()),
                ("POST", "/admin/quiz/fallbacks") => JsonResponse(HttpStatusCode.OK, await SaveQuizFallbackAsync(request, principal.Subject!)),
                ("PUT", _) when !string.IsNullOrWhiteSpace(fallbackKey) && path == $"/admin/quiz/fallbacks/{fallbackKey}" =>
                    JsonResponse(HttpStatusCode.OK, await SaveQuizFallbackAsync(request, principal.Subject!, fallbackKey)),
                ("POST", _) when !string.IsNullOrWhiteSpace(fallbackKey) && path == $"/admin/quiz/fallbacks/{fallbackKey}/archive" =>
                    await EmptyOkAsync(() => _adminService.ArchiveQuizFallbackAsync(fallbackKey, principal.Subject!)),
                ("GET", "/admin/quiz/pool") => JsonResponse(HttpStatusCode.OK, await _adminService.GetQuizPoolAsync()),
                ("POST", "/admin/quiz/pool/refill") => await EmptyAcceptedAsync(() => _adminService.TriggerQuizPoolRefillAsync(principal.Subject!)),
                ("GET", "/admin/ai-camera/classifications") => JsonResponse(HttpStatusCode.OK, await _adminService.GetAiCameraClassificationsAsync()),
                ("GET", "/admin/mini-games/items") => JsonResponse(HttpStatusCode.OK, await _adminService.GetMiniGameItemsAsync()),
                ("POST", "/admin/mini-games/items") => JsonResponse(HttpStatusCode.OK, await SaveMiniGameItemAsync(request, principal.Subject!)),
                ("PUT", _) when !string.IsNullOrWhiteSpace(itemId) && path == $"/admin/mini-games/items/{itemId}" =>
                    JsonResponse(HttpStatusCode.OK, await SaveMiniGameItemAsync(request, principal.Subject!, itemId)),
                ("POST", _) when !string.IsNullOrWhiteSpace(itemId) && path == $"/admin/mini-games/items/{itemId}/archive" =>
                    await EmptyOkAsync(() => _adminService.ArchiveMiniGameItemAsync(itemId, principal.Subject!)),
                _ => JsonResponse(HttpStatusCode.NotFound, new { message = "Admin endpoint not found." })
            };
        }
        catch (ArgumentException exception)
        {
            return JsonResponse(HttpStatusCode.BadRequest, new { message = exception.Message });
        }
        catch (JsonException)
        {
            return JsonResponse(HttpStatusCode.BadRequest, new { message = "Invalid request body." });
        }
        catch (InvalidOperationException exception)
        {
            return JsonResponse(HttpStatusCode.NotFound, new { message = exception.Message });
        }
    }

    private async Task<object> AdjustXpAsync(APIGatewayProxyRequest request, string childId, string adminSub)
    {
        var body = DeserializeBody<AdminAdjustXpRequest>(request);
        await _adminService.AdjustChildXpAsync(childId, adminSub, body.Xp);
        return new { success = true };
    }

    private async Task<AdminResetAiCameraQuotaResponse> ResetAiCameraQuotaAsync(string childId, string adminSub)
    {
        var deletedCount = await _adminService.ResetChildAiCameraQuotaAsync(childId, adminSub);
        return new AdminResetAiCameraQuotaResponse(true, deletedCount);
    }

    private Task<AdminQuizFallbackDto> SaveQuizFallbackAsync(APIGatewayProxyRequest request, string adminSub, string? fallbackKey = null)
    {
        var body = DeserializeBody<AdminSaveQuizFallbackRequest>(request);
        var normalizedBody = fallbackKey is null ? body : body with { FallbackKey = fallbackKey };
        return _adminService.SaveQuizFallbackAsync(normalizedBody, adminSub);
    }

    private Task<AdminMiniGameItemDto> SaveMiniGameItemAsync(APIGatewayProxyRequest request, string adminSub, string? itemId = null)
    {
        var body = DeserializeBody<AdminSaveMiniGameItemRequest>(request);
        var normalizedBody = itemId is null ? body : body with { ItemId = itemId };
        return _adminService.SaveMiniGameItemAsync(normalizedBody, adminSub);
    }

    private static T DeserializeBody<T>(APIGatewayProxyRequest request)
    {
        return JsonSerializer.Deserialize<T>(request.Body ?? string.Empty, JsonOptions)
            ?? throw new ArgumentException("Invalid request body.");
    }

    private static string? GetPathParam(APIGatewayProxyRequest request, string key)
    {
        return request.PathParameters is not null && request.PathParameters.TryGetValue(key, out var value)
            ? value
            : null;
    }

    private static string? GetQuery(APIGatewayProxyRequest request, string key)
    {
        return request.QueryStringParameters is not null && request.QueryStringParameters.TryGetValue(key, out var value)
            ? value
            : null;
    }

    private static async Task<APIGatewayProxyResponse> EmptyOkAsync(Func<Task> action)
    {
        await action();
        return JsonResponse(HttpStatusCode.OK, new { success = true });
    }

    private static async Task<APIGatewayProxyResponse> EmptyAcceptedAsync(Func<Task> action)
    {
        await action();
        return JsonResponse(HttpStatusCode.Accepted, new { success = true });
    }

    private static IAdminService CreateService()
    {
        var configuration = new ConfigurationBuilder()
            .AddEnvironmentVariables()
            .Build();

        var dynamoDb = new AmazonDynamoDBClient();
        var quizOptions = new QuizDynamoDbOptions
        {
            ChildProfilesTableName = configuration["CHILD_PROFILES_TABLE_NAME"] ?? "GreenLens-ChildProfiles",
            QuizSessionsTableName = configuration["QUIZ_SESSIONS_TABLE_NAME"] ?? "GreenLens-QuizSessions",
            QuizFallbackTableName = configuration["QUIZ_FALLBACK_TABLE_NAME"] ?? "GreenLens-QuizFallbacks",
            QuizPoolTableName = configuration["QUIZ_POOL_TABLE_NAME"] ?? "GreenLens-QuizPool",
            PoolTargetReadyCount = configuration.GetValue<int?>("QUIZ_POOL_TARGET_READY_COUNT") ?? 5,
            PoolRefillThreshold = configuration.GetValue<int?>("QUIZ_POOL_REFILL_THRESHOLD") ?? 2,
            PoolItemTtlDays = configuration.GetValue<int?>("QUIZ_POOL_ITEM_TTL_DAYS") ?? 14,
            DefaultAge = configuration.GetValue<int?>("QUIZ_DEFAULT_AGE") ?? 8
        };
        var miniGameOptions = new MiniGameDynamoDbOptions
        {
            ResultsTableName = configuration["MINI_GAME_RESULTS_TABLE_NAME"] ?? "GreenLens-MiniGameResults",
            ItemsTableName = configuration["MINI_GAME_ITEMS_TABLE_NAME"] ?? "GreenLens-MiniGameItems",
            AssetBaseUrl = configuration["MINI_GAME_ASSET_BASE_URL"] ?? string.Empty
        };
        IQuizPoolRefillQueue refillQueue = string.IsNullOrWhiteSpace(configuration["QUIZ_POOL_REFILL_FUNCTION_NAME"])
            ? new LocalQuizPoolRefillQueue()
            : new LambdaQuizPoolRefillQueue(new Amazon.Lambda.AmazonLambdaClient(), configuration["QUIZ_POOL_REFILL_FUNCTION_NAME"]!);

        return new AdminService(dynamoDb, quizOptions, miniGameOptions, refillQueue, configuration);
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
