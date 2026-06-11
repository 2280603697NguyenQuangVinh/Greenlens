using Amazon.DynamoDBv2;
using Amazon.CognitoIdentityProvider;
using GreenLens.Api.Repositories;
using GreenLens.Application.Modules.ChildProfiles.DTOs;
using GreenLens.Application.Modules.ChildProfiles.Interfaces;
using GreenLens.Application.Modules.ChildProfiles.Services;
using GreenLens.Application.Modules.ChildProfiles.Validators;
using GreenLens.Domain.Common.Interfaces;
using GreenLens.Infrastructure.AWS.Cognito;
using GreenLens.Infrastructure.Repositories;

var builder = WebApplication.CreateBuilder(args);

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

    return new ChildProfileRepository(dynamoDb);
});
builder.Services.AddSingleton<IChildIdentityService>(serviceProvider =>
{
    var useInMemory = builder.Configuration.GetValue<bool>("USE_IN_MEMORY_CHILD_PROFILES");
    if (useInMemory)
    {
        return new InMemoryChildIdentityService();
    }

    return new CognitoChildIdentityService(new AmazonCognitoIdentityProviderClient());
});
builder.Services.AddSingleton<IChildProfileService, ChildProfileService>();

var app = builder.Build();

app.MapPost("/child-profiles", async (
    HttpRequest httpRequest,
    CreateChildProfileRequest request,
    IChildProfileService childProfileService) =>
{
    try
    {
        var profile = await childProfileService.CreateAsync(request, httpRequest.HttpContext.RequestAborted);
        return Results.Created($"/child-profiles/{profile.ChildId}", profile);
    }
    catch (ArgumentException exception)
    {
        return Results.BadRequest(new { message = exception.Message });
    }
});

app.Run();
