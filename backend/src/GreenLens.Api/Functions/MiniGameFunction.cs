using System.Net;
using System.Text.Json;
using Amazon.DynamoDBv2;
using Amazon.Lambda.APIGatewayEvents;
using Amazon.Lambda.Core;
using GreenLens.Api.Auth;
using GreenLens.Application.Modules.MiniGames.DTOs;
using GreenLens.Application.Modules.MiniGames.Interfaces;
using GreenLens.Application.Modules.MiniGames.Services;
using GreenLens.Infrastructure.AWS.DynamoDB;

namespace GreenLens.Api.Functions;

public sealed class MiniGameFunction
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly IMiniGameService _miniGameService;
    private readonly CognitoSubExtractor _cognitoSubExtractor;

    public MiniGameFunction()
        : this(CreateService(), new CognitoSubExtractor())
    {
    }

    public MiniGameFunction(
        IMiniGameService miniGameService,
        CognitoSubExtractor cognitoSubExtractor)
    {
        _miniGameService = miniGameService;
        _cognitoSubExtractor = cognitoSubExtractor;
    }

    public async Task<APIGatewayProxyResponse> GetTrashSortItemsAsync(
        APIGatewayProxyRequest request,
        ILambdaContext context)
    {
        try
        {
            var cognitoSub = _cognitoSubExtractor.Extract(request);
            if (string.IsNullOrWhiteSpace(cognitoSub))
            {
                return JsonResponse(HttpStatusCode.Unauthorized, new { message = "Authorization Bearer token is required." });
            }

            var response = await _miniGameService.GetTrashSortItemsAsync(cognitoSub);
            return JsonResponse(HttpStatusCode.OK, response);
        }
        catch (UnauthorizedAccessException exception)
        {
            return JsonResponse(HttpStatusCode.Forbidden, new { message = exception.Message });
        }
        catch (Exception exception)
        {
            context.Logger.LogLine($"Unexpected mini game item loading failure: {exception}");
            return JsonResponse(HttpStatusCode.BadGateway, new { message = "Mini game items could not be loaded." });
        }
    }

    public async Task<APIGatewayProxyResponse> SubmitTrashSortResultAsync(
        APIGatewayProxyRequest request,
        ILambdaContext context)
    {
        SubmitTrashSortResultRequest? body;
        try
        {
            body = JsonSerializer.Deserialize<SubmitTrashSortResultRequest>(request.Body ?? string.Empty, JsonOptions);
        }
        catch (JsonException)
        {
            return JsonResponse(HttpStatusCode.BadRequest, new { message = "Invalid request body." });
        }

        try
        {
            var cognitoSub = _cognitoSubExtractor.Extract(request);
            if (string.IsNullOrWhiteSpace(cognitoSub))
            {
                return JsonResponse(HttpStatusCode.Unauthorized, new { message = "Authorization Bearer token is required." });
            }

            var response = await _miniGameService.SubmitTrashSortResultAsync(body!, cognitoSub);
            return JsonResponse(HttpStatusCode.OK, response);
        }
        catch (ArgumentException exception)
        {
            return JsonResponse(HttpStatusCode.BadRequest, new { message = exception.Message });
        }
        catch (UnauthorizedAccessException exception)
        {
            return JsonResponse(HttpStatusCode.Forbidden, new { message = exception.Message });
        }
        catch (InvalidOperationException exception)
        {
            return JsonResponse(HttpStatusCode.NotFound, new { message = exception.Message });
        }
        catch (Exception exception)
        {
            context.Logger.LogLine($"Unexpected mini game pipeline failure: {exception}");
            return JsonResponse(HttpStatusCode.BadGateway, new { message = "Mini game result submission failed." });
        }
    }

    private static IMiniGameService CreateService()
    {
        var dynamoDb = new AmazonDynamoDBClient();
        var childProfilesTableName = Environment.GetEnvironmentVariable("CHILD_PROFILES_TABLE_NAME")
            ?? Environment.GetEnvironmentVariable("DYNAMODB_CHILD_PROFILES_TABLE")
            ?? "GreenLens-ChildProfiles";

        return new MiniGameService(
            new DynamoDbMiniGameRepository(
                dynamoDb,
                new MiniGameDynamoDbOptions
                {
                    ResultsTableName = Environment.GetEnvironmentVariable("MINI_GAME_RESULTS_TABLE_NAME")
                        ?? "GreenLens-MiniGameResults",
                    ItemsTableName = Environment.GetEnvironmentVariable("MINI_GAME_ITEMS_TABLE_NAME")
                        ?? "GreenLens-MiniGameItems",
                    AssetBaseUrl = ResolveAssetBaseUrl()
                }),
            new DynamoDbChildProgressService(dynamoDb, childProfilesTableName),
            ResolveAssetBaseUrl());
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

    private static string ResolveAssetBaseUrl()
    {
        var configuredBaseUrl = Environment.GetEnvironmentVariable("MINI_GAME_ASSET_BASE_URL");
        if (!string.IsNullOrWhiteSpace(configuredBaseUrl))
        {
            return configuredBaseUrl.TrimEnd('/');
        }

        var bucketName = Environment.GetEnvironmentVariable("MINI_GAME_ASSET_BUCKET_NAME");
        if (string.IsNullOrWhiteSpace(bucketName))
        {
            bucketName = Environment.GetEnvironmentVariable("AI_CAMERA_BUCKET_NAME");
        }
        if (string.IsNullOrWhiteSpace(bucketName))
        {
            return string.Empty;
        }

        var region = Environment.GetEnvironmentVariable("AWS_REGION")
            ?? Environment.GetEnvironmentVariable("AWS_DEFAULT_REGION")
            ?? "ap-southeast-1";

        return $"https://{bucketName}.s3.{region}.amazonaws.com";
    }
}
