using Amazon;
using Amazon.DynamoDBv2;
using Amazon.Extensions.NETCore.Setup;
using Amazon.Runtime;
using DotNetEnv;
using GreenLens.Application.Interfaces;
using GreenLens.Application.Services;
using GreenLens.Domain.Interfaces;
using GreenLens.Infrastructure.Repositories;
using Microsoft.AspNetCore.Diagnostics;

var builder = WebApplication.CreateBuilder(args);

var dotEnvPath = Path.GetFullPath(Path.Combine(builder.Environment.ContentRootPath, "..", "..", ".env"));
if (File.Exists(dotEnvPath))
{
    Env.Load(dotEnvPath);
}

static string? GetConfigValue(IConfiguration configuration, params string[] keys)
{
    foreach (var key in keys)
    {
        var value = configuration[key] ?? Environment.GetEnvironmentVariable(key);
        if (!string.IsNullOrWhiteSpace(value))
        {
            return value;
        }
    }

    return null;
}

builder.Logging.ClearProviders();
builder.Logging.AddConsole();

builder.Services.AddControllers();

var awsOptions = builder.Configuration.GetAWSOptions();

var region = GetConfigValue(builder.Configuration, "AWS:Region", "AWS_REGION", "AWS_DEFAULT_REGION");

if (!string.IsNullOrWhiteSpace(region))
{
    awsOptions.Region = RegionEndpoint.GetBySystemName(region);
}

var accessKey = GetConfigValue(builder.Configuration, "AWS:AccessKey", "AWS_ACCESS_KEY_ID");
var secretKey = GetConfigValue(builder.Configuration, "AWS:SecretKey", "AWS_SECRET_ACCESS_KEY");

if (!string.IsNullOrWhiteSpace(accessKey) && !string.IsNullOrWhiteSpace(secretKey))
{
    awsOptions.Credentials = new BasicAWSCredentials(accessKey, secretKey);
}

var serviceUrl = GetConfigValue(builder.Configuration, "AWS:ServiceURL", "AWS_SERVICE_URL", "DYNAMODB_SERVICE_URL");

if (!string.IsNullOrWhiteSpace(serviceUrl))
{
    awsOptions.DefaultClientConfig.ServiceURL = serviceUrl;
}

if (string.IsNullOrWhiteSpace(region) && string.IsNullOrWhiteSpace(serviceUrl))
{
    throw new InvalidOperationException(
        "AWS DynamoDB is not configured. Set AWS_REGION or AWS_SERVICE_URL in environment variables or app settings.");
}

builder.Services.AddDefaultAWSOptions(awsOptions);
builder.Services.AddAWSService<IAmazonDynamoDB>();

builder.Services.AddScoped<IMiniGameService, CloudGameService>();
builder.Services.AddScoped<IMiniGameChildProfileRepository, MiniGameChildProfileRepository>();
builder.Services.AddScoped<IMiniGameActivityHistoryRepository, MiniGameActivityHistoryRepository>();
builder.Services.AddScoped<IMiniGameDailyActivitiesRepository, MiniGameDailyActivitiesRepository>();
builder.Services.AddScoped<IChildProfileService, CloudUserProfileService>();
builder.Services.AddScoped<IChildProfileRepository, ChildProfileRepository>();

var app = builder.Build();

app.UseExceptionHandler(exceptionApp =>
{
    exceptionApp.Run(async context =>
    {
        context.Response.ContentType = "application/json";

        var exceptionFeature = context.Features.Get<IExceptionHandlerPathFeature>();
        if (exceptionFeature?.Error != null)
        {
            var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();
            logger.LogError(exceptionFeature.Error, "Unhandled exception on {Path}", context.Request.Path);

            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            await context.Response.WriteAsJsonAsync(new
            {
                error = "An unexpected server error occurred.",
                detail = exceptionFeature.Error.Message
            });
        }
    });
});

app.MapControllers();

app.Run();
