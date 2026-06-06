using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using GreenLens.Application.Interfaces;

namespace GreenLens.Infrastructure.Repositories;

public sealed class MiniGameDailyActivitiesRepository(IAmazonDynamoDB dynamoDbClient) : IMiniGameDailyActivitiesRepository
{
    private const string TableName = "GreenLens-DailyActivities";

    public async Task UpsertGameCompletedAsync(
        string childId,
        DateOnly date,
        bool gameCompleted,
        CancellationToken cancellationToken = default)
    {
        var request = new UpdateItemRequest
        {
            TableName = TableName,
            Key = new Dictionary<string, AttributeValue>
            {
                ["childId"] = new AttributeValue { S = childId },
                ["date"] = new AttributeValue { S = date.ToString("yyyy-MM-dd") }
            },
            UpdateExpression = "SET gameCompleted = :gameCompleted, updatedAt = :updatedAt",
            ExpressionAttributeValues = new Dictionary<string, AttributeValue>
            {
                [":gameCompleted"] = new AttributeValue { BOOL = gameCompleted },
                [":updatedAt"] = new AttributeValue { S = DateTime.UtcNow.ToString("O") }
            }
        };

        await dynamoDbClient.UpdateItemAsync(request, cancellationToken);
    }
}
