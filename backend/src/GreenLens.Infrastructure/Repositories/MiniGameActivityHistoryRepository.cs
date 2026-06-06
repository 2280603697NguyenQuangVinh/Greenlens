using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using GreenLens.Application.Interfaces;

namespace GreenLens.Infrastructure.Repositories;

public sealed class MiniGameActivityHistoryRepository(IAmazonDynamoDB dynamoDbClient) : IMiniGameActivityHistoryRepository
{
    private const string TableName = "GreenLens-ActivityHistory";

    public async Task InsertMiniGameCompletionAsync(
        string childId,
        int xpEarned,
        DateTime completedAtUtc,
        CancellationToken cancellationToken = default)
    {
        var request = new PutItemRequest
        {
            TableName = TableName,
            Item = new Dictionary<string, AttributeValue>
            {
                ["childId"] = new AttributeValue { S = childId },
                ["activityId"] = new AttributeValue { S = Guid.NewGuid().ToString("N") },
                ["activity_type"] = new AttributeValue { S = "mini_game" },
                ["xp_earned"] = new AttributeValue { N = xpEarned.ToString() },
                ["completed_at"] = new AttributeValue { S = completedAtUtc.ToString("O") }
            }
        };

        await dynamoDbClient.PutItemAsync(request, cancellationToken);
    }
}
