using System.Net;
using System.Text.Json;
using Amazon.CognitoIdentityProvider;
using Amazon.DynamoDBv2;
using Amazon.Lambda.APIGatewayEvents;
using Amazon.Lambda.Core;
using GreenLens.Api.Auth;
using GreenLens.Application.Modules.ChildProfiles.DTOs;
using GreenLens.Application.Modules.ChildProfiles.Interfaces;
using GreenLens.Application.Modules.ChildProfiles.Services;
using GreenLens.Application.Modules.ChildProfiles.Validators;
using GreenLens.Infrastructure.AWS.Cognito;
using GreenLens.Infrastructure.Repositories;

[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace GreenLens.Api.Functions;

public sealed class ChildProfileFunction
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly IChildProfileService _childProfileService;
    private readonly CognitoSubExtractor _cognitoSubExtractor;

    public ChildProfileFunction()
        : this(CreateService(), new CognitoSubExtractor())
    {
    }

    public ChildProfileFunction(
        IChildProfileService childProfileService,
        CognitoSubExtractor cognitoSubExtractor)
    {
        _childProfileService = childProfileService;
        _cognitoSubExtractor = cognitoSubExtractor;
    }

    public async Task<APIGatewayProxyResponse> CreateAsync(
        APIGatewayProxyRequest request,
        ILambdaContext context)
    {
        CreateChildProfileRequest? body;
        try
        {
            body = JsonSerializer.Deserialize<CreateChildProfileRequest>(request.Body ?? string.Empty, JsonOptions);
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

            var profile = await _childProfileService.CreateAsync(body!, cognitoSub);
            return JsonResponse(HttpStatusCode.Created, profile);
        }
        catch (ArgumentException exception)
        {
            return JsonResponse(HttpStatusCode.BadRequest, new { message = exception.Message });
        }
    }

    private static IChildProfileService CreateService()
    {
        var dynamoDb = new AmazonDynamoDBClient();
        var repository = new ChildProfileRepository(dynamoDb);
        var cognito = new AmazonCognitoIdentityProviderClient();
        var identityService = new CognitoChildIdentityService(cognito);
        return new ChildProfileService(repository, identityService, new CreateChildProfileValidator());
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
