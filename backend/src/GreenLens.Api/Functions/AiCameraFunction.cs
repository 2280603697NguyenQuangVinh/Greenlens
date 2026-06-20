using System.Net;
using System.Text;
using System.Text.Json;
using Amazon.BedrockRuntime;
using Amazon.DynamoDBv2;
using Amazon.Lambda.APIGatewayEvents;
using Amazon.Lambda.Core;
using Amazon.Rekognition;
using Amazon.S3;
using GreenLens.Application.Modules.AiCamera.DTOs;
using GreenLens.Application.Modules.AiCamera.Interfaces;
using GreenLens.Application.Modules.AiCamera.Services;
using GreenLens.Application.Modules.AiCamera.WasteMapping;
using GreenLens.Application.Modules.ChildProfiles.Interfaces;
using GreenLens.Infrastructure.AWS.Bedrock;
using GreenLens.Infrastructure.AWS.DynamoDB;
using GreenLens.Infrastructure.AWS.Rekognition;
using GreenLens.Infrastructure.AWS.S3;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Net.Http.Headers;

namespace GreenLens.Api.Functions;

public sealed class AiCameraFunction
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly IAiCameraService _aiCameraService;

    public AiCameraFunction()
        : this(CreateService())
    {
    }

    public AiCameraFunction(IAiCameraService aiCameraService)
    {
        _aiCameraService = aiCameraService;
    }

    public async Task<APIGatewayProxyResponse> AnalyzeAsync(
        APIGatewayProxyRequest request,
        ILambdaContext context)
    {
        try
        {
            var analyzeRequest = await ParseMultipartRequestAsync(request);
            analyzeRequest = analyzeRequest with { CognitoSub = GetCognitoSub(request) };
            await using (analyzeRequest.ImageStream)
            {
                context.Logger.LogLine($"AI camera analyze started for childId={analyzeRequest.ChildId}.");

                var response = await _aiCameraService.AnalyzeAsync(analyzeRequest);

                context.Logger.LogLine(
                    $"AI camera analyze completed. childId={response.ChildId}, label={response.Label}, category={response.Category}, s3Key={response.S3ImageKey}");

                return JsonResponse(HttpStatusCode.OK, response);
            }
        }
        catch (ArgumentException exception)
        {
            context.Logger.LogLine($"Invalid AI camera request: {exception.Message}");
            return JsonResponse(HttpStatusCode.BadRequest, new { message = exception.Message });
        }
        catch (AiCameraQuotaExceededException exception)
        {
            context.Logger.LogLine($"AI camera quota exceeded: {exception.Message}");
            return JsonResponse(HttpStatusCode.TooManyRequests, new { message = exception.Message });
        }
        catch (InvalidOperationException exception)
        {
            context.Logger.LogLine($"AI camera pipeline failed: {exception}");
            return JsonResponse(HttpStatusCode.BadGateway, new { message = exception.Message });
        }
        catch (Exception exception)
        {
            context.Logger.LogLine($"Unexpected AI camera pipeline failure: {exception}");
            return JsonResponse(HttpStatusCode.BadGateway, new { message = "AI camera analysis failed." });
        }
    }

    private static async Task<AiCameraAnalyzeRequest> ParseMultipartRequestAsync(APIGatewayProxyRequest request)
    {
        var contentType = GetHeaderValue(request.Headers, "content-type");
        if (string.IsNullOrWhiteSpace(contentType))
        {
            throw new ArgumentException("Content-Type header is required.");
        }

        MediaTypeHeaderValue mediaType;
        try
        {
            mediaType = MediaTypeHeaderValue.Parse(contentType);
        }
        catch (FormatException exception)
        {
            throw new ArgumentException("Content-Type header is invalid.", exception);
        }

        var boundary = HeaderUtilities.RemoveQuotes(mediaType.Boundary).Value;
        if (string.IsNullOrWhiteSpace(boundary))
        {
            throw new ArgumentException("Multipart boundary is required.");
        }

        byte[] bodyBytes;
        try
        {
            bodyBytes = request.IsBase64Encoded
                ? Convert.FromBase64String(request.Body ?? string.Empty)
                : Encoding.UTF8.GetBytes(request.Body ?? string.Empty);
        }
        catch (FormatException exception)
        {
            throw new ArgumentException("Request body is not valid base64.", exception);
        }

        await using var bodyStream = new MemoryStream(bodyBytes);
        var reader = new MultipartReader(boundary, bodyStream);

        string? childId = null;
        MemoryStream? imageStream = null;
        string? fileName = null;
        string? imageContentType = null;

        MultipartSection? section;
        while ((section = await reader.ReadNextSectionAsync()) is not null)
        {
            if (!ContentDispositionHeaderValue.TryParse(section.ContentDisposition, out var contentDisposition))
            {
                continue;
            }

            var name = HeaderUtilities.RemoveQuotes(contentDisposition.Name).Value;
            if (string.Equals(name, "childId", StringComparison.OrdinalIgnoreCase))
            {
                using var streamReader = new StreamReader(section.Body, Encoding.UTF8, leaveOpen: false);
                childId = await streamReader.ReadToEndAsync();
                continue;
            }

            if (string.Equals(name, "image", StringComparison.OrdinalIgnoreCase))
            {
                imageStream = new MemoryStream();
                await section.Body.CopyToAsync(imageStream);
                imageStream.Position = 0;
                fileName = HeaderUtilities.RemoveQuotes(contentDisposition.FileName).Value
                    ?? HeaderUtilities.RemoveQuotes(contentDisposition.FileNameStar).Value
                    ?? "image.jpg";
                imageContentType = section.ContentType ?? "image/jpeg";
            }
        }

        if (string.IsNullOrWhiteSpace(childId))
        {
            throw new ArgumentException("childId is required.");
        }

        if (imageStream is null || imageStream.Length == 0)
        {
            throw new ArgumentException("image is required.");
        }

        return new AiCameraAnalyzeRequest(childId.Trim(), imageStream, fileName ?? "image.jpg", imageContentType ?? "image/jpeg");
    }

    private static string? GetHeaderValue(IDictionary<string, string>? headers, string headerName)
    {
        if (headers is null)
        {
            return null;
        }

        foreach (var header in headers)
        {
            if (string.Equals(header.Key, headerName, StringComparison.OrdinalIgnoreCase))
            {
                return header.Value;
            }
        }

        return null;
    }

    private static string? GetCognitoSub(APIGatewayProxyRequest request)
    {
        if (request.RequestContext?.Authorizer?.Claims is null)
        {
            return null;
        }

        return request.RequestContext.Authorizer.Claims.TryGetValue("sub", out var sub)
            ? sub
            : null;
    }

    private static IAiCameraService CreateService()
    {
        var region = Environment.GetEnvironmentVariable("AWS_REGION")
            ?? Environment.GetEnvironmentVariable("AWS_DEFAULT_REGION")
            ?? "ap-southeast-1";

        var s3Options = new S3BucketOptions
        {
            BucketName = Environment.GetEnvironmentVariable("AI_CAMERA_BUCKET_NAME") ?? string.Empty,
            Region = region
        };

        var bedrockOptions = new BedrockOptions
        {
            ModelId = Environment.GetEnvironmentVariable("BEDROCK_MODEL_ID") ?? "amazon.nova-lite-v1:0",
            EnableFallbackGuidance = string.Equals(
                Environment.GetEnvironmentVariable("AI_CAMERA_GUIDANCE_FALLBACK_ENABLED"),
                "true",
                StringComparison.OrdinalIgnoreCase),
            SkipBedrockWhenFallbackEnabled = string.Equals(
                Environment.GetEnvironmentVariable("AI_CAMERA_SKIP_BEDROCK_WHEN_FALLBACK_ENABLED"),
                "true",
                StringComparison.OrdinalIgnoreCase),
            MaxTokens = int.TryParse(Environment.GetEnvironmentVariable("BEDROCK_MAX_TOKENS"), out var maxTokens)
                ? maxTokens
                : 180
        };

        var imageStorage = new S3StorageService(new AmazonS3Client(), s3Options, new S3KeyBuilder());
        var rekognition = new RekognitionService(new AmazonRekognitionClient(), new RekognitionOptions());
        var wasteMapping = new WasteMappingService();
        var bedrock = new BedrockGuidanceService(new AmazonBedrockRuntimeClient(), bedrockOptions);
        var childProfilesTableName = Environment.GetEnvironmentVariable("CHILD_PROFILES_TABLE_NAME")
            ?? Environment.GetEnvironmentVariable("DYNAMODB_CHILD_PROFILES_TABLE")
            ?? "GreenLens-ChildProfiles";
        IChildProgressService childProgress = new DynamoDbChildProgressService(
            new AmazonDynamoDBClient(),
            childProfilesTableName);
        IAiCameraUsageLimiter usageLimiter;
        if (string.Equals(
                Environment.GetEnvironmentVariable("AI_CAMERA_USAGE_LIMITER_ENABLED"),
                "false",
                StringComparison.OrdinalIgnoreCase))
        {
            usageLimiter = new NoopAiCameraUsageLimiter();
        }
        else
        {
            usageLimiter = new DynamoDbAiCameraUsageLimiter(
                new AmazonDynamoDBClient(),
                new AiCameraUsageLimiterOptions
                {
                    TableName = Environment.GetEnvironmentVariable("AI_CAMERA_USAGE_TABLE_NAME") ?? "GreenLens-AiUsage",
                    PerMinuteLimit = int.TryParse(Environment.GetEnvironmentVariable("AI_CAMERA_PER_MINUTE_LIMIT"), out var perMinuteLimit)
                        ? perMinuteLimit
                        : 3,
                    PerDayLimit = int.TryParse(Environment.GetEnvironmentVariable("AI_CAMERA_DAILY_LIMIT"), out var perDayLimit)
                        ? perDayLimit
                        : 20
                });
        }

        return new AiCameraService(imageStorage, rekognition, wasteMapping, bedrock, usageLimiter, childProgress);
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
