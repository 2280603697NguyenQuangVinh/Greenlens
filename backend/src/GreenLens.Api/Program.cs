using Amazon.DynamoDBv2;
using Amazon.CognitoIdentityProvider;
using Amazon.BedrockRuntime;
using Amazon.Rekognition;
using Amazon.S3;
using GreenLens.Api.Auth;
using GreenLens.Api.Repositories;
using GreenLens.Application.Modules.AiCamera.DTOs;
using GreenLens.Application.Modules.AiCamera.Interfaces;
using GreenLens.Application.Modules.AiCamera.Services;
using GreenLens.Application.Modules.AiCamera.WasteMapping;
using GreenLens.Application.Modules.Auth.DTOs;
using GreenLens.Application.Modules.Auth.Interfaces;
using GreenLens.Application.Modules.ChildProfiles.DTOs;
using GreenLens.Application.Modules.ChildProfiles.Interfaces;
using GreenLens.Application.Modules.ChildProfiles.Services;
using GreenLens.Application.Modules.ChildProfiles.Validators;
using GreenLens.Domain.Common.Interfaces;
using GreenLens.Infrastructure.AWS.Bedrock;
using GreenLens.Infrastructure.AWS.Cognito;
using GreenLens.Infrastructure.AWS.DynamoDB;
using GreenLens.Infrastructure.AWS.Rekognition;
using GreenLens.Infrastructure.AWS.S3;
using GreenLens.Infrastructure.Repositories;
using Microsoft.AspNetCore.Mvc;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSingleton<CognitoSubExtractor>();
builder.Services.AddSingleton<IAmazonS3>(_ => new AmazonS3Client());
builder.Services.AddSingleton<IAmazonRekognition>(_ => new AmazonRekognitionClient());
builder.Services.AddSingleton<IAmazonBedrockRuntime>(_ => new AmazonBedrockRuntimeClient());
builder.Services.AddSingleton<IAmazonCognitoIdentityProvider>(_ => new AmazonCognitoIdentityProviderClient());
builder.Services.AddSingleton(new S3BucketOptions
{
    BucketName = builder.Configuration["AI_CAMERA_BUCKET_NAME"] ?? string.Empty,
    Region = builder.Configuration["AWS_REGION"]
        ?? builder.Configuration["AWS_DEFAULT_REGION"]
        ?? "ap-southeast-1"
});
builder.Services.AddSingleton(new RekognitionOptions());
builder.Services.AddSingleton(new BedrockOptions
{
    ModelId = builder.Configuration["BEDROCK_MODEL_ID"] ?? "amazon.nova-lite-v1:0",
    EnableFallbackGuidance = builder.Configuration.GetValue<bool>("AI_CAMERA_GUIDANCE_FALLBACK_ENABLED"),
    SkipBedrockWhenFallbackEnabled = builder.Configuration.GetValue<bool>("AI_CAMERA_SKIP_BEDROCK_WHEN_FALLBACK_ENABLED"),
    MaxTokens = builder.Configuration.GetValue<int?>("BEDROCK_MAX_TOKENS") ?? 180
});
builder.Services.AddSingleton(new AiCameraUsageLimiterOptions
{
    TableName = builder.Configuration["AI_CAMERA_USAGE_TABLE_NAME"] ?? "GreenLens-AiUsage",
    PerMinuteLimit = builder.Configuration.GetValue<int?>("AI_CAMERA_PER_MINUTE_LIMIT") ?? 3,
    PerDayLimit = builder.Configuration.GetValue<int?>("AI_CAMERA_DAILY_LIMIT") ?? 20
});
builder.Services.AddSingleton(new CognitoAuthOptions
{
    UserPoolId = builder.Configuration["COGNITO_USER_POOL_ID"] ?? string.Empty,
    AppClientId = builder.Configuration["COGNITO_APP_CLIENT_ID"] ?? string.Empty,
    AppClientSecret = builder.Configuration["COGNITO_APP_CLIENT_SECRET"]
});
builder.Services.AddSingleton<S3KeyBuilder>();
builder.Services.AddSingleton<IImageStorageService, S3StorageService>();
builder.Services.AddSingleton<IRekognitionService, RekognitionService>();
builder.Services.AddSingleton<IWasteMappingService, WasteMappingService>();
builder.Services.AddSingleton<IBedrockGuidanceService, BedrockGuidanceService>();
builder.Services.AddSingleton<IAiCameraUsageLimiter>(serviceProvider =>
{
    if (!builder.Configuration.GetValue("AI_CAMERA_USAGE_LIMITER_ENABLED", true))
    {
        return new NoopAiCameraUsageLimiter();
    }

    var serviceUrl = builder.Configuration["DYNAMODB_SERVICE_URL"];
    var dynamoDb = string.IsNullOrWhiteSpace(serviceUrl)
        ? new AmazonDynamoDBClient()
        : new AmazonDynamoDBClient(new AmazonDynamoDBConfig { ServiceURL = serviceUrl });

    return new DynamoDbAiCameraUsageLimiter(
        dynamoDb,
        serviceProvider.GetRequiredService<AiCameraUsageLimiterOptions>());
});
builder.Services.AddSingleton<IAiCameraService, AiCameraService>();
builder.Services.AddSingleton<IAuthService>(serviceProvider =>
{
    var useInMemoryAuth = builder.Configuration.GetValue<bool?>("USE_IN_MEMORY_AUTH");
    var cognitoOptions = serviceProvider.GetRequiredService<CognitoAuthOptions>();
    if (useInMemoryAuth is true ||
        (useInMemoryAuth is null &&
            (string.IsNullOrWhiteSpace(cognitoOptions.UserPoolId) ||
             string.IsNullOrWhiteSpace(cognitoOptions.AppClientId))))
    {
        return new InMemoryAuthService();
    }

    return new CognitoAuthService(
        serviceProvider.GetRequiredService<IAmazonCognitoIdentityProvider>(),
        cognitoOptions);
});
builder.Services.AddSingleton<CreateChildProfileValidator>();
builder.Services.AddSingleton<IChildProfileRepository>(serviceProvider =>
{
    var useInMemory = builder.Configuration.GetValue<bool>("USE_IN_MEMORY_CHILD_PROFILES");
    if (useInMemory)
    {
        return new InMemoryChildProfileRepository();
    }

    var serviceUrl = builder.Configuration["DYNAMODB_SERVICE_URL"];
    var dynamoDb = string.IsNullOrWhiteSpace(serviceUrl)
        ? new AmazonDynamoDBClient()
        : new AmazonDynamoDBClient(new AmazonDynamoDBConfig { ServiceURL = serviceUrl });

    return new ChildProfileRepository(
        dynamoDb,
        builder.Configuration["CHILD_PROFILES_TABLE_NAME"] ??
            builder.Configuration["DYNAMODB_CHILD_PROFILES_TABLE"]);
});
builder.Services.AddSingleton<IChildIdentityService>(serviceProvider =>
{
    var useInMemoryIdentity = builder.Configuration.GetValue<bool?>("USE_IN_MEMORY_CHILD_IDENTITIES");
    if (useInMemoryIdentity is true ||
        (useInMemoryIdentity is null &&
            string.IsNullOrWhiteSpace(builder.Configuration["COGNITO_USER_POOL_ID"])))
    {
        return new InMemoryChildIdentityService();
    }

    return new CognitoChildIdentityService(new AmazonCognitoIdentityProviderClient());
});
builder.Services.AddSingleton<IChildProfileService, ChildProfileService>();

var app = builder.Build();

app.Use(async (context, next) =>
{
    if (HttpMethods.IsOptions(context.Request.Method) || IsPublicAuthPath(context.Request.Path))
    {
        await next();
        return;
    }

    var authorizationHeader = context.Request.Headers.Authorization.FirstOrDefault();
    var sub = context.RequestServices
        .GetRequiredService<CognitoSubExtractor>()
        .ExtractFromAuthorizationHeader(authorizationHeader);

    if (string.IsNullOrWhiteSpace(sub))
    {
        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
        context.Response.Headers.WWWAuthenticate = "Bearer";
        await context.Response.WriteAsJsonAsync(new { message = "Authorization Bearer token is required." });
        return;
    }

    context.Items["cognitoSub"] = sub;
    await next();
});

app.MapPost("/auth/register-child", async (
    RegisterChildRequest request,
    IAuthService authService,
    IChildProfileService childProfileService,
    CognitoSubExtractor cognitoSubExtractor,
    HttpContext httpContext) =>
{
    try
    {
        var auth = await authService.RegisterAsync(
            new AuthRegisterRequest(
                request.Username,
                null,
                request.DisplayName ?? request.CharacterName,
                request.Email),
            httpContext.RequestAborted);

        var cognitoSub = cognitoSubExtractor.ExtractFromAuthorizationHeader($"Bearer {auth.BearerToken}");
        if (string.IsNullOrWhiteSpace(cognitoSub))
        {
            return Results.Problem("Could not read Cognito sub from issued token.", statusCode: StatusCodes.Status502BadGateway);
        }

        var profile = await childProfileService.CreateAsync(
            new CreateChildProfileRequest(
                request.CharacterName,
                request.Gender,
                request.Hair,
                request.Eyes,
                request.Outfit,
                request.AvatarPreview),
            cognitoSub,
            httpContext.RequestAborted);

        return Results.Ok(new RegisterChildResponse(auth, profile));
    }
    catch (ArgumentException exception)
    {
        return Results.BadRequest(new { message = exception.Message });
    }
    catch (UnauthorizedAccessException)
    {
        return Results.Unauthorized();
    }
    catch (InvalidOperationException exception)
    {
        return Results.Problem(exception.Message, statusCode: StatusCodes.Status502BadGateway);
    }
});

app.MapPost("/auth/register", async (
    AuthRegisterRequest request,
    IAuthService authService,
    HttpContext httpContext) =>
{
    try
    {
        var response = await authService.RegisterAsync(request, httpContext.RequestAborted);
        return Results.Ok(response);
    }
    catch (ArgumentException exception)
    {
        return Results.BadRequest(new { message = exception.Message });
    }
    catch (UnauthorizedAccessException)
    {
        return Results.Unauthorized();
    }
    catch (InvalidOperationException exception)
    {
        return Results.Problem(exception.Message, statusCode: StatusCodes.Status502BadGateway);
    }
});

app.MapPost("/auth/login", async (
    AuthLoginRequest request,
    IAuthService authService,
    HttpContext httpContext) =>
{
    try
    {
        var response = await authService.LoginAsync(request, httpContext.RequestAborted);
        return Results.Ok(response);
    }
    catch (ArgumentException exception)
    {
        return Results.BadRequest(new { message = exception.Message });
    }
    catch (UnauthorizedAccessException)
    {
        return Results.Unauthorized();
    }
    catch (InvalidOperationException exception)
    {
        return Results.Problem(exception.Message, statusCode: StatusCodes.Status502BadGateway);
    }
});

app.MapPost("/auth/refresh", async (
    AuthRefreshRequest request,
    IAuthService authService,
    HttpContext httpContext) =>
{
    try
    {
        var response = await authService.RefreshAsync(request, httpContext.RequestAborted);
        return Results.Ok(response);
    }
    catch (ArgumentException exception)
    {
        return Results.BadRequest(new { message = exception.Message });
    }
    catch (UnauthorizedAccessException)
    {
        return Results.Unauthorized();
    }
    catch (InvalidOperationException exception)
    {
        return Results.Problem(exception.Message, statusCode: StatusCodes.Status502BadGateway);
    }
});

app.MapPost("/auth/dev-login", (
    DevLoginRequest request,
    IWebHostEnvironment environment,
    IConfiguration configuration) =>
{
    var allowDevAuth = environment.IsDevelopment() ||
        configuration.GetValue<bool>("ALLOW_DEV_AUTH");

    if (!allowDevAuth)
    {
        return Results.NotFound();
    }

    try
    {
        return Results.Ok(DevBearerTokenFactory.Create(request.CognitoSub ?? string.Empty));
    }
    catch (ArgumentException exception)
    {
        return Results.BadRequest(new { message = exception.Message });
    }
});

app.MapPost("/child-profiles", async (
    HttpRequest httpRequest,
    CreateChildProfileRequest request,
    IChildProfileService childProfileService) =>
{
    try
    {
        var cognitoSub = httpRequest.HttpContext.Items["cognitoSub"] as string;
        var profile = await childProfileService.CreateAsync(
            request,
            cognitoSub,
            httpRequest.HttpContext.RequestAborted);
        return Results.Created($"/child-profiles/{profile.ChildId}", profile);
    }
    catch (ArgumentException exception)
    {
        return Results.BadRequest(new { message = exception.Message });
    }
});

app.MapPost("/ai-camera/analyze", async (
    HttpRequest httpRequest,
    IAiCameraService aiCameraService,
    IWebHostEnvironment environment,
    ILoggerFactory loggerFactory) =>
{
    var logger = loggerFactory.CreateLogger("AiCameraAnalyze");
    try
    {
        if (!httpRequest.HasFormContentType)
        {
            return Results.BadRequest(new { message = "multipart/form-data body is required." });
        }

        var form = await httpRequest.ReadFormAsync(httpRequest.HttpContext.RequestAborted);
        var childId = form["childId"].ToString();
        var image = form.Files.GetFile("image");

        if (image is null || image.Length == 0)
        {
            return Results.BadRequest(new { message = "image file field is required. Use form-data key 'image' with type File." });
        }

        await using var imageStream = image.OpenReadStream();
        var cognitoSub = httpRequest.HttpContext.Items["cognitoSub"] as string;
        var response = await aiCameraService.AnalyzeAsync(
            new AiCameraAnalyzeRequest(
                childId,
                imageStream,
                image.FileName,
                image.ContentType,
                cognitoSub),
            httpRequest.HttpContext.RequestAborted);

        return Results.Ok(response);
    }
    catch (ArgumentException exception)
    {
        return Results.BadRequest(new { message = exception.Message });
    }
    catch (AiCameraQuotaExceededException exception)
    {
        return Results.Problem(exception.Message, statusCode: StatusCodes.Status429TooManyRequests);
    }
    catch (InvalidOperationException exception)
    {
        logger.LogError(exception, "AI camera analysis failed with a known pipeline error.");
        return Results.Problem(exception.Message, statusCode: StatusCodes.Status502BadGateway);
    }
    catch (Exception exception)
    {
        logger.LogError(exception, "AI camera analysis failed with an unexpected error.");
        var message = environment.IsDevelopment()
            ? exception.Message
            : "AI camera analysis failed.";
        return Results.Problem(message, statusCode: StatusCodes.Status502BadGateway);
    }
}).DisableAntiforgery();

app.Run();

static bool IsPublicAuthPath(PathString path)
{
    return path.StartsWithSegments("/auth/register", StringComparison.OrdinalIgnoreCase) ||
        path.StartsWithSegments("/auth/register-child", StringComparison.OrdinalIgnoreCase) ||
        path.StartsWithSegments("/auth/login", StringComparison.OrdinalIgnoreCase) ||
        path.StartsWithSegments("/auth/refresh", StringComparison.OrdinalIgnoreCase) ||
        path.StartsWithSegments("/auth/dev-login", StringComparison.OrdinalIgnoreCase);
}
