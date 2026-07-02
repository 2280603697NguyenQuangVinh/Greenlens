using System.Net;
using System.Text.Json;
using Amazon.BedrockRuntime;
using Amazon.DynamoDBv2;
using Amazon.Lambda;
using Amazon.Lambda.APIGatewayEvents;
using Amazon.Lambda.Core;
using GreenLens.Api.Auth;
using GreenLens.Api.Services;
using GreenLens.Application.Modules.Quiz.DTOs;
using GreenLens.Application.Modules.Quiz.Interfaces;
using GreenLens.Application.Modules.Quiz.Services;
using GreenLens.Infrastructure.AWS.Bedrock;
using GreenLens.Infrastructure.AWS.DynamoDB;

namespace GreenLens.Api.Functions;

public sealed class QuizFunction
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly IQuizService _quizService;
    private readonly CognitoSubExtractor _cognitoSubExtractor;

    public QuizFunction()
        : this(CreateService(), new CognitoSubExtractor())
    {
    }

    public QuizFunction(
        IQuizService quizService,
        CognitoSubExtractor cognitoSubExtractor)
    {
        _quizService = quizService;
        _cognitoSubExtractor = cognitoSubExtractor;
    }

    public async Task<APIGatewayProxyResponse> GenerateAsync(
        APIGatewayProxyRequest request,
        ILambdaContext context)
    {
        GenerateQuizRequest? body;
        try
        {
            body = JsonSerializer.Deserialize<GenerateQuizRequest>(request.Body ?? string.Empty, JsonOptions);
        }
        catch (JsonException)
        {
            return JsonResponse(HttpStatusCode.BadRequest, new { message = "Invalid request body." });
        }

        return await HandleAsync(
            request,
            context,
            async (cognitoSub) =>
            {
                var response = await _quizService.GenerateAsync(body!, cognitoSub);
                return JsonResponse(HttpStatusCode.OK, response);
            });
    }

    public Task<APIGatewayProxyResponse> GetSessionAsync(
        APIGatewayProxyRequest request,
        ILambdaContext context)
    {
        return HandleAsync(
            request,
            context,
            async (cognitoSub) =>
            {
                var sessionId = request.PathParameters is not null &&
                    request.PathParameters.TryGetValue("sessionId", out var value)
                        ? value
                        : string.Empty;

                var response = await _quizService.GetSessionAsync(sessionId, cognitoSub);
                return JsonResponse(HttpStatusCode.OK, response);
            });
    }

    public async Task<APIGatewayProxyResponse> CompleteAsync(
        APIGatewayProxyRequest request,
        ILambdaContext context)
    {
        CompleteQuizRequest? body;
        try
        {
            body = JsonSerializer.Deserialize<CompleteQuizRequest>(request.Body ?? string.Empty, JsonOptions);
        }
        catch (JsonException)
        {
            return JsonResponse(HttpStatusCode.BadRequest, new { message = "Invalid request body." });
        }

        return await HandleAsync(
            request,
            context,
            async (cognitoSub) =>
            {
                var response = await _quizService.CompleteAsync(body!, cognitoSub);
                return JsonResponse(HttpStatusCode.OK, response);
            });
    }

    public async Task RefillAsync(
        QuizPoolRefillRequest request,
        ILambdaContext context)
    {
        try
        {
            await CreateRefillService().RefillAsync(request);
        }
        catch (Exception exception)
        {
            context.Logger.LogLine($"Quiz pool refill failed: {exception}");
        }
    }

    private async Task<APIGatewayProxyResponse> HandleAsync(
        APIGatewayProxyRequest request,
        ILambdaContext context,
        Func<string, Task<APIGatewayProxyResponse>> handler)
    {
        try
        {
            var cognitoSub = _cognitoSubExtractor.Extract(request);
            if (string.IsNullOrWhiteSpace(cognitoSub))
            {
                return JsonResponse(HttpStatusCode.Unauthorized, new { message = "Authorization Bearer token is required." });
            }

            return await handler(cognitoSub);
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
            context.Logger.LogLine($"Quiz pipeline failed: {exception}");
            return JsonResponse(HttpStatusCode.BadGateway, new { message = exception.Message });
        }
        catch (Exception exception)
        {
            context.Logger.LogLine($"Unexpected quiz pipeline failure: {exception}");
            return JsonResponse(HttpStatusCode.BadGateway, new { message = "Quiz request failed." });
        }
    }

    private static IQuizService CreateService()
    {
        var dynamoDb = new AmazonDynamoDBClient();
        var options = BuildQuizDynamoDbOptions();
        var repository = new DynamoDbQuizRepository(dynamoDb, options);

        return new QuizService(
            new DynamoDbChildQuizContextReader(dynamoDb, options),
            repository,
            repository,
            new LambdaQuizPoolRefillQueue(
                new AmazonLambdaClient(),
                Environment.GetEnvironmentVariable("QUIZ_POOL_REFILL_FUNCTION_NAME") ?? string.Empty),
            new DynamoDbChildProgressService(dynamoDb, options.ChildProfilesTableName),
            options.PoolRefillThreshold);
    }

    private static IQuizPoolRefillService CreateRefillService()
    {
        var dynamoDb = new AmazonDynamoDBClient();
        var options = BuildQuizDynamoDbOptions();
        var repository = new DynamoDbQuizRepository(dynamoDb, options);

        return new QuizPoolRefillService(
            BuildQuizGenerator(),
            repository,
            options.PoolTargetReadyCount,
            options.PoolItemTtlDays);
    }

    private static BedrockQuizGenerator BuildQuizGenerator()
    {
        return new BedrockQuizGenerator(
            new AmazonBedrockRuntimeClient(),
            new BedrockQuizOptions
            {
                ModelId = Environment.GetEnvironmentVariable("QUIZ_BEDROCK_MODEL_ID") ??
                    Environment.GetEnvironmentVariable("BEDROCK_MODEL_ID") ??
                    "apac.amazon.nova-micro-v1:0",
                MaxTokens = int.TryParse(Environment.GetEnvironmentVariable("QUIZ_BEDROCK_MAX_TOKENS"), out var maxTokens)
                    ? maxTokens
                    : 520,
                TimeoutSeconds = int.TryParse(Environment.GetEnvironmentVariable("QUIZ_BEDROCK_TIMEOUT_SECONDS"), out var timeoutSeconds)
                    ? timeoutSeconds
                    : 10
            });
    }

    private static QuizDynamoDbOptions BuildQuizDynamoDbOptions()
    {
        return new QuizDynamoDbOptions
        {
            ChildProfilesTableName = Environment.GetEnvironmentVariable("CHILD_PROFILES_TABLE_NAME") ??
                Environment.GetEnvironmentVariable("DYNAMODB_CHILD_PROFILES_TABLE") ??
                "GreenLens-ChildProfiles",
            QuizSessionsTableName = Environment.GetEnvironmentVariable("QUIZ_SESSIONS_TABLE_NAME") ?? "GreenLens-QuizSessions",
            QuizFallbackTableName = Environment.GetEnvironmentVariable("QUIZ_FALLBACK_TABLE_NAME") ?? "GreenLens-QuizFallbacks",
            QuizPoolTableName = Environment.GetEnvironmentVariable("QUIZ_POOL_TABLE_NAME") ?? "GreenLens-QuizPool",
            DefaultAge = int.TryParse(Environment.GetEnvironmentVariable("QUIZ_DEFAULT_AGE"), out var defaultAge)
                ? defaultAge
                : 8,
            PoolTargetReadyCount = int.TryParse(Environment.GetEnvironmentVariable("QUIZ_POOL_TARGET_READY_COUNT"), out var poolTarget)
                ? poolTarget
                : 5,
            PoolRefillThreshold = int.TryParse(Environment.GetEnvironmentVariable("QUIZ_POOL_REFILL_THRESHOLD"), out var refillThreshold)
                ? refillThreshold
                : 2,
            PoolItemTtlDays = int.TryParse(Environment.GetEnvironmentVariable("QUIZ_POOL_ITEM_TTL_DAYS"), out var ttlDays)
                ? ttlDays
                : 14
        };
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
