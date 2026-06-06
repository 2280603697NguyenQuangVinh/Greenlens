using Amazon.DynamoDBv2;
using Amazon.Extensions.NETCore.Setup;
using Amazon.Runtime;
using GreenLens.Application.Interfaces;
using GreenLens.Application.Services;
using GreenLens.Domain.Interfaces;
using GreenLens.Infrastructure.Repositories;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

var awsOptions = builder.Configuration.GetAWSOptions();
var accessKey = builder.Configuration["AWS:AccessKey"];
var secretKey = builder.Configuration["AWS:SecretKey"];

if (!string.IsNullOrWhiteSpace(accessKey) && !string.IsNullOrWhiteSpace(secretKey))
{
    awsOptions.Credentials = new BasicAWSCredentials(accessKey, secretKey);
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

app.MapControllers();

app.Run();
