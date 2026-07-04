using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using Amazon.Lambda;
using Amazon.CognitoIdentityProvider;
using Amazon.BedrockRuntime;
using Amazon.Rekognition;
using Amazon.S3;
using GreenLens.Api.Auth;
using GreenLens.Api.Admin;
using GreenLens.Api.Repositories;
using GreenLens.Api.Services;
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
using GreenLens.Application.Modules.MiniGames.DTOs;
using GreenLens.Application.Modules.MiniGames.Interfaces;
using GreenLens.Application.Modules.MiniGames.Services;
using GreenLens.Application.Modules.Quiz.DTOs;
using GreenLens.Application.Modules.Quiz.Interfaces;
using GreenLens.Application.Modules.Quiz.Services;
using GreenLens.Domain.Common.Interfaces;
using GreenLens.Infrastructure.AWS.Bedrock;
using GreenLens.Infrastructure.AWS.Cognito;
using GreenLens.Infrastructure.AWS.DynamoDB;
using GreenLens.Infrastructure.AWS.Rekognition;
using GreenLens.Infrastructure.AWS.S3;
using GreenLens.Infrastructure.Repositories;
using GreenLens.Api.Swagger;
using Microsoft.AspNetCore.Mvc;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc(
        "v1",
        new OpenApiInfo
        {
            Title = "GreenLens Kids API",
            Version = "v1",
            Description = "Backend APIs for GreenLens Kids auth, child profiles, AI Camera, and quiz flows."
        });

    options.AddSecurityDefinition(
        "Bearer",
        new OpenApiSecurityScheme
        {
            Name = "Authorization",
            Type = SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT",
            In = ParameterLocation.Header,
            Description = "Paste only the access token. Swagger will send it as: Bearer {token}"
        });

    options.AddSecurityRequirement(
        new OpenApiSecurityRequirement
        {
            {
                new OpenApiSecurityScheme
                {
                    Reference = new OpenApiReference
                    {
                        Type = ReferenceType.SecurityScheme,
                        Id = "Bearer"
                    }
                },
                []
            }
        });

    options.OperationFilter<AiCameraAnalyzeOperationFilter>();
});

builder.Services.AddSingleton(new DevAuthOptions
{
    DefaultAdminUsername = builder.Configuration["DEV_ADMIN_USERNAME"] ?? "admin",
    DefaultAdminPassword = builder.Configuration["DEV_ADMIN_PASSWORD"] ?? "Admin@123",
    EnableDefaultAdmin = builder.Configuration.GetValue<bool?>("ENABLE_DEV_ADMIN_SEED") ?? true
});
builder.Services.AddSingleton<CognitoSubExtractor>();
builder.Services.AddSingleton<IAmazonDynamoDB>(serviceProvider =>
{
    var configuration = serviceProvider.GetRequiredService<IConfiguration>();
    var serviceUrl = configuration["DYNAMODB_SERVICE_URL"];
    return string.IsNullOrWhiteSpace(serviceUrl)
        ? new AmazonDynamoDBClient()
        : new AmazonDynamoDBClient(new AmazonDynamoDBConfig { ServiceURL = serviceUrl });
});
builder.Services.AddSingleton<IAmazonS3>(_ => new AmazonS3Client());
builder.Services.AddSingleton<IAmazonRekognition>(_ => new AmazonRekognitionClient());
builder.Services.AddSingleton<IAmazonBedrockRuntime>(_ => new AmazonBedrockRuntimeClient());
builder.Services.AddSingleton<IAmazonLambda>(_ => new AmazonLambdaClient());
builder.Services.AddSingleton<IAmazonCognitoIdentityProvider>(_ => new AmazonCognitoIdentityProviderClient());
builder.Services.AddSingleton(new S3BucketOptions
{
    BucketName = builder.Configuration["AI_CAMERA_BUCKET_NAME"] ?? string.Empty,
    Region = builder.Configuration["AWS_REGION"]
        ?? builder.Configuration["AWS_DEFAULT_REGION"]
        ?? "ap-southeast-1"
});
builder.Services.AddSingleton(new RekognitionOptions
{
    TimeoutSeconds = builder.Configuration.GetValue<int?>("REKOGNITION_TIMEOUT_SECONDS") ?? 5,
    CircuitFailureThreshold = builder.Configuration.GetValue<int?>("REKOGNITION_CIRCUIT_FAILURE_THRESHOLD") ?? 3,
    CircuitBreakSeconds = builder.Configuration.GetValue<int?>("REKOGNITION_CIRCUIT_BREAK_SECONDS") ?? 60
});
builder.Services.AddSingleton(new BedrockOptions
{
    ModelId = builder.Configuration["BEDROCK_MODEL_ID"] ?? "amazon.nova-lite-v1:0",
    EnableFallbackGuidance = builder.Configuration.GetValue<bool>("AI_CAMERA_GUIDANCE_FALLBACK_ENABLED"),
    SkipBedrockWhenFallbackEnabled = builder.Configuration.GetValue<bool>("AI_CAMERA_SKIP_BEDROCK_WHEN_FALLBACK_ENABLED"),
    MaxTokens = builder.Configuration.GetValue<int?>("BEDROCK_MAX_TOKENS") ?? 180,
    TimeoutSeconds = builder.Configuration.GetValue<int?>("BEDROCK_TIMEOUT_SECONDS") ?? 12
});
builder.Services.AddSingleton(new AiCameraUsageLimiterOptions
{
    TableName = builder.Configuration["AI_CAMERA_USAGE_TABLE_NAME"] ?? "GreenLens-AiUsage",
    PerMinuteLimit = builder.Configuration.GetValue<int?>("AI_CAMERA_PER_MINUTE_LIMIT") ?? 3,
    PerDayLimit = builder.Configuration.GetValue<int?>("AI_CAMERA_DAILY_LIMIT") ?? 20
});
builder.Services.AddSingleton(new BedrockQuizOptions
{
    ModelId = builder.Configuration["QUIZ_BEDROCK_MODEL_ID"] ??
        builder.Configuration["BEDROCK_MODEL_ID"] ??
        "apac.amazon.nova-micro-v1:0",
    MaxTokens = builder.Configuration.GetValue<int?>("QUIZ_BEDROCK_MAX_TOKENS") ?? 520,
    TimeoutSeconds = builder.Configuration.GetValue<int?>("QUIZ_BEDROCK_TIMEOUT_SECONDS") ?? 10
});
builder.Services.AddSingleton(new QuizDynamoDbOptions
{
    ChildProfilesTableName = builder.Configuration["CHILD_PROFILES_TABLE_NAME"] ??
        builder.Configuration["DYNAMODB_CHILD_PROFILES_TABLE"] ??
        "GreenLens-ChildProfiles",
    QuizSessionsTableName = builder.Configuration["QUIZ_SESSIONS_TABLE_NAME"] ?? "GreenLens-QuizSessions",
    QuizFallbackTableName = builder.Configuration["QUIZ_FALLBACK_TABLE_NAME"] ?? "GreenLens-QuizFallbacks",
    QuizPoolTableName = builder.Configuration["QUIZ_POOL_TABLE_NAME"] ?? "GreenLens-QuizPool",
    DefaultAge = builder.Configuration.GetValue<int?>("QUIZ_DEFAULT_AGE") ?? 8,
    PoolTargetReadyCount = builder.Configuration.GetValue<int?>("QUIZ_POOL_TARGET_READY_COUNT") ?? 5,
    PoolRefillThreshold = builder.Configuration.GetValue<int?>("QUIZ_POOL_REFILL_THRESHOLD") ?? 2,
    PoolItemTtlDays = builder.Configuration.GetValue<int?>("QUIZ_POOL_ITEM_TTL_DAYS") ?? 14
});
builder.Services.AddSingleton(new MiniGameDynamoDbOptions
{
    ResultsTableName = builder.Configuration["MINI_GAME_RESULTS_TABLE_NAME"] ?? "GreenLens-MiniGameResults",
    ItemsTableName = builder.Configuration["MINI_GAME_ITEMS_TABLE_NAME"] ?? "GreenLens-MiniGameItems",
    AssetBaseUrl = ResolveMiniGameAssetBaseUrl(builder.Configuration)
});
builder.Services.AddSingleton(new CognitoAuthOptions
{
    UserPoolId = builder.Configuration["COGNITO_USER_POOL_ID"] ?? string.Empty,
    AppClientId = builder.Configuration["COGNITO_APP_CLIENT_ID"] ?? string.Empty,
    AppClientSecret = builder.Configuration["COGNITO_APP_CLIENT_SECRET"]
});
builder.Services.AddSingleton<S3KeyBuilder>();
builder.Services.AddSingleton<IImageStorageService, S3StorageService>();
builder.Services.AddSingleton<AiCameraDependencyCircuitBreaker>();
builder.Services.AddSingleton<IRekognitionService, RekognitionService>();
builder.Services.AddSingleton<IWasteImageValidator, WasteImageValidator>();
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
builder.Services.AddSingleton<IChildProgressService>(serviceProvider =>
{
    if (builder.Configuration.GetValue<bool>("USE_IN_MEMORY_CHILD_PROFILES"))
    {
        return new NoopChildProgressService();
    }

    var serviceUrl = builder.Configuration["DYNAMODB_SERVICE_URL"];
    var dynamoDb = string.IsNullOrWhiteSpace(serviceUrl)
        ? new AmazonDynamoDBClient()
        : new AmazonDynamoDBClient(new AmazonDynamoDBConfig { ServiceURL = serviceUrl });

    var tableName = builder.Configuration["CHILD_PROFILES_TABLE_NAME"] ??
        builder.Configuration["DYNAMODB_CHILD_PROFILES_TABLE"] ??
        "GreenLens-ChildProfiles";

    return new DynamoDbChildProgressService(dynamoDb, tableName);
});
builder.Services.AddSingleton<IAiCameraService, AiCameraService>();
builder.Services.AddSingleton<IQuizGenerator, BedrockQuizGenerator>();
builder.Services.AddSingleton<IChildQuizContextReader>(serviceProvider =>
{
    var serviceUrl = builder.Configuration["DYNAMODB_SERVICE_URL"];
    var dynamoDb = string.IsNullOrWhiteSpace(serviceUrl)
        ? new AmazonDynamoDBClient()
        : new AmazonDynamoDBClient(new AmazonDynamoDBConfig { ServiceURL = serviceUrl });

    return new DynamoDbChildQuizContextReader(
        dynamoDb,
        serviceProvider.GetRequiredService<QuizDynamoDbOptions>());
});
builder.Services.AddSingleton<IQuizRepository>(serviceProvider =>
{
    var serviceUrl = builder.Configuration["DYNAMODB_SERVICE_URL"];
    var dynamoDb = string.IsNullOrWhiteSpace(serviceUrl)
        ? new AmazonDynamoDBClient()
        : new AmazonDynamoDBClient(new AmazonDynamoDBConfig { ServiceURL = serviceUrl });

    return new DynamoDbQuizRepository(
        dynamoDb,
        serviceProvider.GetRequiredService<QuizDynamoDbOptions>());
});
builder.Services.AddSingleton<IQuizPoolRepository>(serviceProvider =>
{
    var serviceUrl = builder.Configuration["DYNAMODB_SERVICE_URL"];
    var dynamoDb = string.IsNullOrWhiteSpace(serviceUrl)
        ? new AmazonDynamoDBClient()
        : new AmazonDynamoDBClient(new AmazonDynamoDBConfig { ServiceURL = serviceUrl });

    return new DynamoDbQuizRepository(
        dynamoDb,
        serviceProvider.GetRequiredService<QuizDynamoDbOptions>());
});
builder.Services.AddSingleton<IQuizPoolRefillService>(serviceProvider =>
{
    var options = serviceProvider.GetRequiredService<QuizDynamoDbOptions>();
    return new QuizPoolRefillService(
        serviceProvider.GetRequiredService<IQuizGenerator>(),
        serviceProvider.GetRequiredService<IQuizPoolRepository>(),
        options.PoolTargetReadyCount,
        options.PoolItemTtlDays);
});
var quizPoolRefillFunctionName = builder.Configuration["QUIZ_POOL_REFILL_FUNCTION_NAME"];
if (string.IsNullOrWhiteSpace(quizPoolRefillFunctionName))
{
    builder.Services.AddSingleton<LocalQuizPoolRefillQueue>();
    builder.Services.AddSingleton<IQuizPoolRefillQueue>(serviceProvider =>
        serviceProvider.GetRequiredService<LocalQuizPoolRefillQueue>());
    builder.Services.AddHostedService<QuizPoolRefillBackgroundService>();
}
else
{
    builder.Services.AddSingleton<IQuizPoolRefillQueue>(serviceProvider =>
        new LambdaQuizPoolRefillQueue(
            serviceProvider.GetRequiredService<IAmazonLambda>(),
            quizPoolRefillFunctionName));
}
builder.Services.AddSingleton<IQuizService>(serviceProvider =>
{
    var options = serviceProvider.GetRequiredService<QuizDynamoDbOptions>();
    return new QuizService(
        serviceProvider.GetRequiredService<IChildQuizContextReader>(),
        serviceProvider.GetRequiredService<IQuizRepository>(),
        serviceProvider.GetRequiredService<IQuizPoolRepository>(),
        serviceProvider.GetRequiredService<IQuizPoolRefillQueue>(),
        serviceProvider.GetRequiredService<IChildProgressService>(),
        options.PoolRefillThreshold);
});
builder.Services.AddSingleton<IMiniGameRepository>(serviceProvider =>
{
    var serviceUrl = builder.Configuration["DYNAMODB_SERVICE_URL"];
    var dynamoDb = string.IsNullOrWhiteSpace(serviceUrl)
        ? new AmazonDynamoDBClient()
        : new AmazonDynamoDBClient(new AmazonDynamoDBConfig { ServiceURL = serviceUrl });

    return new DynamoDbMiniGameRepository(
        dynamoDb,
        serviceProvider.GetRequiredService<MiniGameDynamoDbOptions>());
});
builder.Services.AddSingleton<IMiniGameService>(serviceProvider =>
{
    return new MiniGameService(
        serviceProvider.GetRequiredService<IMiniGameRepository>(),
        serviceProvider.GetRequiredService<IChildProgressService>(),
        serviceProvider.GetRequiredService<MiniGameDynamoDbOptions>().AssetBaseUrl);
});
builder.Services.AddSingleton<IAuthService>(serviceProvider =>
{
    var useInMemoryAuth = builder.Configuration.GetValue<bool?>("USE_IN_MEMORY_AUTH");
    var cognitoOptions = serviceProvider.GetRequiredService<CognitoAuthOptions>();
    if (useInMemoryAuth is true ||
        (useInMemoryAuth is null &&
            (string.IsNullOrWhiteSpace(cognitoOptions.UserPoolId) ||
             string.IsNullOrWhiteSpace(cognitoOptions.AppClientId))))
    {
        return new InMemoryAuthService(serviceProvider.GetRequiredService<DevAuthOptions>());
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
builder.Services.AddSingleton<IAdminService, AdminService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "GreenLens Kids API v1");
        options.RoutePrefix = "swagger";
        options.DocumentTitle = "GreenLens Kids API";
    });
}

app.Use(async (context, next) =>
{
    if (HttpMethods.IsOptions(context.Request.Method) ||
        IsPublicAuthPath(context.Request.Path) ||
        IsSwaggerPath(context.Request.Path))
    {
        await next();
        return;
    }

    var authorizationHeader = context.Request.Headers.Authorization.FirstOrDefault();
    var principal = context.RequestServices
        .GetRequiredService<CognitoSubExtractor>()
        .ExtractPrincipalFromAuthorizationHeader(authorizationHeader);
    var sub = principal.Subject;

    if (string.IsNullOrWhiteSpace(sub))
    {
        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
        context.Response.Headers.WWWAuthenticate = "Bearer";
        await context.Response.WriteAsJsonAsync(new { message = "Authorization Bearer token is required." });
        return;
    }

    context.Items["cognitoSub"] = sub;
    context.Items["cognitoGroups"] = principal.Groups;

    if (context.Request.Path.StartsWithSegments("/admin", StringComparison.OrdinalIgnoreCase) &&
        !principal.IsAdmin)
    {
        context.Response.StatusCode = StatusCodes.Status403Forbidden;
        await context.Response.WriteAsJsonAsync(new { message = "Admin access is required." });
        return;
    }

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

app.MapGet("/child-profiles/leaderboard", async (
    HttpRequest httpRequest,
    IChildProfileService childProfileService,
    [FromQuery] string? currentChildId,
    [FromQuery] int? limit) =>
{
    var leaderboard = await childProfileService.GetLeaderboardAsync(
        currentChildId,
        limit ?? 10,
        httpRequest.HttpContext.RequestAborted);

    return Results.Ok(leaderboard);
});

app.MapGet("/child-profiles/{childId}", async (
    HttpRequest httpRequest,
    string childId,
    IChildProfileService childProfileService) =>
{
    try
    {
        var cognitoSub = httpRequest.HttpContext.Items["cognitoSub"] as string;
        var profile = await childProfileService.GetAsync(
            childId,
            cognitoSub ?? string.Empty,
            httpRequest.HttpContext.RequestAborted);
        return Results.Ok(profile);
    }
    catch (ArgumentException exception)
    {
        return Results.BadRequest(new { message = exception.Message });
    }
    catch (UnauthorizedAccessException exception)
    {
        return Results.Problem(exception.Message, statusCode: StatusCodes.Status403Forbidden);
    }
    catch (ConditionalCheckFailedException)
    {
        return Results.Problem(
            "Child profile does not exist or does not belong to this user.",
            statusCode: StatusCodes.Status403Forbidden);
    }
    catch (InvalidOperationException exception)
    {
        return Results.NotFound(new { message = exception.Message });
    }
});

app.MapGet("/child-profiles/{childId}/streak", async (
    HttpRequest httpRequest,
    string childId,
    IChildProfileService childProfileService) =>
{
    try
    {
        var cognitoSub = httpRequest.HttpContext.Items["cognitoSub"] as string;
        var streak = await childProfileService.GetStreakAsync(
            childId,
            cognitoSub ?? string.Empty,
            httpRequest.HttpContext.RequestAborted);
        return Results.Ok(streak);
    }
    catch (ArgumentException exception)
    {
        return Results.BadRequest(new { message = exception.Message });
    }
    catch (UnauthorizedAccessException exception)
    {
        return Results.Problem(exception.Message, statusCode: StatusCodes.Status403Forbidden);
    }
    catch (InvalidOperationException exception)
    {
        return Results.NotFound(new { message = exception.Message });
    }
});

app.MapPost("/child-profiles/{childId}/streak/check-in", async (
    HttpRequest httpRequest,
    string childId,
    IChildProfileService childProfileService) =>
{
    try
    {
        var cognitoSub = httpRequest.HttpContext.Items["cognitoSub"] as string;
        var streak = await childProfileService.CheckInStreakAsync(
            childId,
            cognitoSub ?? string.Empty,
            httpRequest.HttpContext.RequestAborted);
        return Results.Ok(streak);
    }
    catch (ArgumentException exception)
    {
        return Results.BadRequest(new { message = exception.Message });
    }
    catch (UnauthorizedAccessException exception)
    {
        return Results.Problem(exception.Message, statusCode: StatusCodes.Status403Forbidden);
    }
    catch (InvalidOperationException exception)
    {
        return Results.NotFound(new { message = exception.Message });
    }
});

app.MapGet("/admin/overview", async (
    HttpRequest httpRequest,
    IAdminService adminService) =>
{
    var response = await adminService.GetOverviewAsync(httpRequest.HttpContext.RequestAborted);
    return Results.Ok(response);
});

app.MapGet("/admin/children", async (
    HttpRequest httpRequest,
    IAdminService adminService,
    [FromQuery] string? search,
    [FromQuery] string? status) =>
{
    var response = await adminService.GetChildrenAsync(search, status, httpRequest.HttpContext.RequestAborted);
    return Results.Ok(response);
});

app.MapGet("/admin/children/{childId}", async (
    HttpRequest httpRequest,
    string childId,
    IAdminService adminService) =>
{
    try
    {
        return Results.Ok(await adminService.GetChildAsync(childId, httpRequest.HttpContext.RequestAborted));
    }
    catch (InvalidOperationException exception)
    {
        return Results.NotFound(new { message = exception.Message });
    }
});

app.MapPost("/admin/children/{childId}/archive", async (
    HttpRequest httpRequest,
    string childId,
    IAdminService adminService) =>
{
    var adminSub = httpRequest.HttpContext.Items["cognitoSub"] as string ?? string.Empty;
    await adminService.ArchiveChildAsync(childId, adminSub, httpRequest.HttpContext.RequestAborted);
    return Results.Ok();
});

app.MapPost("/admin/children/{childId}/lock", async (
    HttpRequest httpRequest,
    string childId,
    IAdminService adminService) =>
{
    var adminSub = httpRequest.HttpContext.Items["cognitoSub"] as string ?? string.Empty;
    await adminService.LockChildAsync(childId, adminSub, httpRequest.HttpContext.RequestAborted);
    return Results.Ok();
});

app.MapPost("/admin/children/{childId}/unlock", async (
    HttpRequest httpRequest,
    string childId,
    IAdminService adminService) =>
{
    var adminSub = httpRequest.HttpContext.Items["cognitoSub"] as string ?? string.Empty;
    await adminService.UnlockChildAsync(childId, adminSub, httpRequest.HttpContext.RequestAborted);
    return Results.Ok();
});

app.MapPost("/admin/children/{childId}/streak/reset", async (
    HttpRequest httpRequest,
    string childId,
    IAdminService adminService) =>
{
    var adminSub = httpRequest.HttpContext.Items["cognitoSub"] as string ?? string.Empty;
    await adminService.ResetChildStreakAsync(childId, adminSub, httpRequest.HttpContext.RequestAborted);
    return Results.Ok();
});

app.MapPost("/admin/children/{childId}/xp-adjust", async (
    HttpRequest httpRequest,
    string childId,
    AdminAdjustXpRequest request,
    IAdminService adminService) =>
{
    var adminSub = httpRequest.HttpContext.Items["cognitoSub"] as string ?? string.Empty;
    await adminService.AdjustChildXpAsync(childId, adminSub, request.Xp, httpRequest.HttpContext.RequestAborted);
    return Results.Ok();
});

app.MapGet("/admin/quiz/fallbacks", async (
    HttpRequest httpRequest,
    IAdminService adminService) =>
{
    return Results.Ok(await adminService.GetQuizFallbacksAsync(httpRequest.HttpContext.RequestAborted));
});

app.MapPost("/admin/quiz/fallbacks", async (
    HttpRequest httpRequest,
    AdminSaveQuizFallbackRequest request,
    IAdminService adminService) =>
{
    try
    {
        var adminSub = httpRequest.HttpContext.Items["cognitoSub"] as string ?? string.Empty;
        return Results.Ok(await adminService.SaveQuizFallbackAsync(request, adminSub, httpRequest.HttpContext.RequestAborted));
    }
    catch (ArgumentException exception)
    {
        return Results.BadRequest(new { message = exception.Message });
    }
});

app.MapPut("/admin/quiz/fallbacks/{fallbackKey}", async (
    HttpRequest httpRequest,
    string fallbackKey,
    AdminSaveQuizFallbackRequest request,
    IAdminService adminService) =>
{
    try
    {
        var adminSub = httpRequest.HttpContext.Items["cognitoSub"] as string ?? string.Empty;
        var normalizedRequest = request with { FallbackKey = fallbackKey };
        return Results.Ok(await adminService.SaveQuizFallbackAsync(normalizedRequest, adminSub, httpRequest.HttpContext.RequestAborted));
    }
    catch (ArgumentException exception)
    {
        return Results.BadRequest(new { message = exception.Message });
    }
});

app.MapPost("/admin/quiz/fallbacks/{fallbackKey}/archive", async (
    HttpRequest httpRequest,
    string fallbackKey,
    IAdminService adminService) =>
{
    var adminSub = httpRequest.HttpContext.Items["cognitoSub"] as string ?? string.Empty;
    await adminService.ArchiveQuizFallbackAsync(fallbackKey, adminSub, httpRequest.HttpContext.RequestAborted);
    return Results.Ok();
});

app.MapGet("/admin/quiz/pool", async (
    HttpRequest httpRequest,
    IAdminService adminService) =>
{
    return Results.Ok(await adminService.GetQuizPoolAsync(httpRequest.HttpContext.RequestAborted));
});

app.MapPost("/admin/quiz/pool/refill", async (
    HttpRequest httpRequest,
    IAdminService adminService) =>
{
    var adminSub = httpRequest.HttpContext.Items["cognitoSub"] as string ?? string.Empty;
    await adminService.TriggerQuizPoolRefillAsync(adminSub, httpRequest.HttpContext.RequestAborted);
    return Results.Accepted();
});

app.MapGet("/admin/ai-camera/classifications", async (
    HttpRequest httpRequest,
    IAdminService adminService) =>
{
    return Results.Ok(await adminService.GetAiCameraClassificationsAsync(httpRequest.HttpContext.RequestAborted));
});

app.MapGet("/admin/mini-games/items", async (
    HttpRequest httpRequest,
    IAdminService adminService) =>
{
    return Results.Ok(await adminService.GetMiniGameItemsAsync(httpRequest.HttpContext.RequestAborted));
});

app.MapPost("/admin/mini-games/items", async (
    HttpRequest httpRequest,
    AdminSaveMiniGameItemRequest request,
    IAdminService adminService) =>
{
    try
    {
        var adminSub = httpRequest.HttpContext.Items["cognitoSub"] as string ?? string.Empty;
        return Results.Ok(await adminService.SaveMiniGameItemAsync(request, adminSub, httpRequest.HttpContext.RequestAborted));
    }
    catch (ArgumentException exception)
    {
        return Results.BadRequest(new { message = exception.Message });
    }
});

app.MapPut("/admin/mini-games/items/{itemId}", async (
    HttpRequest httpRequest,
    string itemId,
    AdminSaveMiniGameItemRequest request,
    IAdminService adminService) =>
{
    try
    {
        var adminSub = httpRequest.HttpContext.Items["cognitoSub"] as string ?? string.Empty;
        var normalizedRequest = request with { ItemId = itemId };
        return Results.Ok(await adminService.SaveMiniGameItemAsync(normalizedRequest, adminSub, httpRequest.HttpContext.RequestAborted));
    }
    catch (ArgumentException exception)
    {
        return Results.BadRequest(new { message = exception.Message });
    }
});

app.MapPost("/admin/mini-games/items/{itemId}/archive", async (
    HttpRequest httpRequest,
    string itemId,
    IAdminService adminService) =>
{
    var adminSub = httpRequest.HttpContext.Items["cognitoSub"] as string ?? string.Empty;
    await adminService.ArchiveMiniGameItemAsync(itemId, adminSub, httpRequest.HttpContext.RequestAborted);
    return Results.Ok();
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
    catch (AiCameraDependencyUnavailableException exception)
    {
        logger.LogWarning(
            exception,
            "AI camera dependency unavailable. reason={Reason}, retry_after={RetryAfterSeconds}",
            exception.Reason,
            exception.RetryAfterSeconds);

        httpRequest.HttpContext.Response.Headers.RetryAfter = exception.RetryAfterSeconds.ToString();
        return Results.Json(
            new
            {
                message = exception.Message,
                reason = exception.Reason,
                retryAfterSeconds = exception.RetryAfterSeconds
            },
            statusCode: StatusCodes.Status503ServiceUnavailable);
    }
    catch (AiCameraInvalidImageException exception)
    {
        logger.LogInformation(
            exception,
            "invalid_image_blocked_before_s3 reason={Reason}, top_label={DetectedLabel}, top_confidence={Confidence}",
            exception.Reason,
            exception.DetectedLabel,
            exception.Confidence);

        return Results.Json(
            new
            {
                message = exception.Message,
                reason = exception.Reason,
                detectedLabel = exception.DetectedLabel,
                confidence = exception.Confidence.HasValue ? Math.Round(exception.Confidence.Value, 1) : (double?)null
            },
            statusCode: StatusCodes.Status422UnprocessableEntity);
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

app.MapPost("/quiz/generate", async (
    HttpRequest httpRequest,
    GenerateQuizRequest request,
    IQuizService quizService,
    IWebHostEnvironment environment,
    ILoggerFactory loggerFactory) =>
{
    var logger = loggerFactory.CreateLogger("QuizGenerate");
    try
    {
        var cognitoSub = httpRequest.HttpContext.Items["cognitoSub"] as string;
        var response = await quizService.GenerateAsync(
            request,
            cognitoSub ?? string.Empty,
            httpRequest.HttpContext.RequestAborted);

        return Results.Ok(response);
    }
    catch (ArgumentException exception)
    {
        return Results.BadRequest(new { message = exception.Message });
    }
    catch (UnauthorizedAccessException exception)
    {
        return Results.Problem(exception.Message, statusCode: StatusCodes.Status403Forbidden);
    }
    catch (InvalidOperationException exception)
    {
        logger.LogError(exception, "Quiz generation failed with a known pipeline error.");
        return Results.Problem(exception.Message, statusCode: StatusCodes.Status502BadGateway);
    }
    catch (Exception exception)
    {
        logger.LogError(exception, "Quiz generation failed with an unexpected error.");
        var message = environment.IsDevelopment()
            ? exception.Message
            : "Quiz generation failed.";
        return Results.Problem(message, statusCode: StatusCodes.Status502BadGateway);
    }
});

app.MapGet("/quiz/sessions/{sessionId}", async (
    HttpRequest httpRequest,
    string sessionId,
    IQuizService quizService) =>
{
    try
    {
        var cognitoSub = httpRequest.HttpContext.Items["cognitoSub"] as string;
        var response = await quizService.GetSessionAsync(
            sessionId,
            cognitoSub ?? string.Empty,
            httpRequest.HttpContext.RequestAborted);

        return Results.Ok(response);
    }
    catch (ArgumentException exception)
    {
        return Results.BadRequest(new { message = exception.Message });
    }
    catch (UnauthorizedAccessException exception)
    {
        return Results.Problem(exception.Message, statusCode: StatusCodes.Status403Forbidden);
    }
    catch (InvalidOperationException exception)
    {
        return Results.NotFound(new { message = exception.Message });
    }
});

app.MapPost("/quiz/complete", async (
    HttpRequest httpRequest,
    CompleteQuizRequest request,
    IQuizService quizService,
    IWebHostEnvironment environment,
    ILoggerFactory loggerFactory) =>
{
    var logger = loggerFactory.CreateLogger("QuizComplete");
    try
    {
        var cognitoSub = httpRequest.HttpContext.Items["cognitoSub"] as string;
        var response = await quizService.CompleteAsync(
            request,
            cognitoSub ?? string.Empty,
            httpRequest.HttpContext.RequestAborted);

        return Results.Ok(response);
    }
    catch (ArgumentException exception)
    {
        return Results.BadRequest(new { message = exception.Message });
    }
    catch (UnauthorizedAccessException exception)
    {
        return Results.Problem(exception.Message, statusCode: StatusCodes.Status403Forbidden);
    }
    catch (InvalidOperationException exception)
    {
        return Results.NotFound(new { message = exception.Message });
    }
    catch (Exception exception)
    {
        logger.LogError(exception, "Quiz completion failed with an unexpected error.");
        var message = environment.IsDevelopment()
            ? exception.Message
            : "Quiz completion failed.";
        return Results.Problem(message, statusCode: StatusCodes.Status502BadGateway);
    }
});

app.MapGet("/mini-games/trash-sort/items", async (
    HttpRequest httpRequest,
    IMiniGameService miniGameService) =>
{
    try
    {
        var cognitoSub = httpRequest.HttpContext.Items["cognitoSub"] as string;
        var response = await miniGameService.GetTrashSortItemsAsync(
            cognitoSub ?? string.Empty,
            httpRequest.HttpContext.RequestAborted);

        return Results.Ok(response);
    }
    catch (UnauthorizedAccessException exception)
    {
        return Results.Problem(exception.Message, statusCode: StatusCodes.Status403Forbidden);
    }
});

app.MapPost("/mini-games/trash-sort/results", async (
    HttpRequest httpRequest,
    SubmitTrashSortResultRequest request,
    IMiniGameService miniGameService,
    IWebHostEnvironment environment,
    ILoggerFactory loggerFactory) =>
{
    var logger = loggerFactory.CreateLogger("MiniGameTrashSort");
    try
    {
        var cognitoSub = httpRequest.HttpContext.Items["cognitoSub"] as string;
        var response = await miniGameService.SubmitTrashSortResultAsync(
            request,
            cognitoSub ?? string.Empty,
            httpRequest.HttpContext.RequestAborted);

        return Results.Ok(response);
    }
    catch (ArgumentException exception)
    {
        return Results.BadRequest(new { message = exception.Message });
    }
    catch (UnauthorizedAccessException exception)
    {
        return Results.Problem(exception.Message, statusCode: StatusCodes.Status403Forbidden);
    }
    catch (InvalidOperationException exception)
    {
        return Results.NotFound(new { message = exception.Message });
    }
    catch (Exception exception)
    {
        logger.LogError(exception, "Mini game trash sort submission failed.");
        var message = environment.IsDevelopment()
            ? exception.Message
            : "Mini game result submission failed.";
        return Results.Problem(message, statusCode: StatusCodes.Status502BadGateway);
    }
});

app.Run();

static bool IsPublicAuthPath(PathString path)
{
    return path.StartsWithSegments("/auth/register", StringComparison.OrdinalIgnoreCase) ||
        path.StartsWithSegments("/auth/register-child", StringComparison.OrdinalIgnoreCase) ||
        path.StartsWithSegments("/auth/login", StringComparison.OrdinalIgnoreCase) ||
        path.StartsWithSegments("/auth/refresh", StringComparison.OrdinalIgnoreCase) ||
        path.StartsWithSegments("/auth/dev-login", StringComparison.OrdinalIgnoreCase);
}

static bool IsSwaggerPath(PathString path)
{
    return path.StartsWithSegments("/swagger", StringComparison.OrdinalIgnoreCase);
}

static string ResolveMiniGameAssetBaseUrl(IConfiguration configuration)
{
    var configuredBaseUrl = configuration["MINI_GAME_ASSET_BASE_URL"];
    if (!string.IsNullOrWhiteSpace(configuredBaseUrl))
    {
        return configuredBaseUrl.TrimEnd('/');
    }

    var bucketName = configuration["MINI_GAME_ASSET_BUCKET_NAME"];
    if (string.IsNullOrWhiteSpace(bucketName))
    {
        bucketName = configuration["AI_CAMERA_BUCKET_NAME"];
    }
    if (string.IsNullOrWhiteSpace(bucketName))
    {
        return string.Empty;
    }

    var region = configuration["AWS_REGION"] ??
        configuration["AWS_DEFAULT_REGION"] ??
        "ap-southeast-1";

    return $"https://{bucketName}.s3.{region}.amazonaws.com";
}
