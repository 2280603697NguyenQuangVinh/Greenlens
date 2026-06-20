using Amazon;
using Amazon.DynamoDBv2;
using Amazon.Runtime;
using Microsoft.Extensions.Configuration;

namespace GreenLens.Infrastructure.AWS.DynamoDB;

public static class DynamoDbClientFactory
{
    public static IAmazonDynamoDB Create(IConfiguration configuration)
    {
        var serviceUrl = configuration["DYNAMODB_SERVICE_URL"];
        if (!string.IsNullOrWhiteSpace(serviceUrl))
        {
            return new AmazonDynamoDBClient(new AmazonDynamoDBConfig { ServiceURL = serviceUrl });
        }

        var regionName = configuration["AWS_REGION"]
            ?? configuration["AWS_DEFAULT_REGION"]
            ?? "ap-southeast-2";

        var config = new AmazonDynamoDBConfig
        {
            RegionEndpoint = RegionEndpoint.GetBySystemName(regionName)
        };

        var accessKey = configuration["AWS_ACCESS_KEY_ID"];
        var secretKey = configuration["AWS_SECRET_ACCESS_KEY"];
        if (!string.IsNullOrWhiteSpace(accessKey) && !string.IsNullOrWhiteSpace(secretKey))
        {
            return new AmazonDynamoDBClient(new BasicAWSCredentials(accessKey, secretKey), config);
        }

        return new AmazonDynamoDBClient(config);
    }
}
