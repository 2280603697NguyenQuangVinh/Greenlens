using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using GreenLens.Application.Interfaces;
using GreenLens.Application.Models;

namespace GreenLens.Infrastructure.Repositories;

public sealed class MiniGameChildProfileRepository(IAmazonDynamoDB dynamoDbClient) : IMiniGameChildProfileRepository
{
    private const string TableName = "GreenLens-ChildProfiles";

    public async Task<ChildGameProfile?> GetByChildIdAsync(string childId, CancellationToken cancellationToken = default)
    {
        var request = new GetItemRequest
        {
            TableName = TableName,
            Key = new Dictionary<string, AttributeValue>
            {
                ["childId"] = new AttributeValue { S = childId }
            },
            ConsistentRead = true
        };

        var response = await dynamoDbClient.GetItemAsync(request, cancellationToken);
        if (response.Item is null || response.Item.Count == 0)
        {
            return null;
        }

        return new ChildGameProfile
        {
            ChildId = childId,
            Xp = ParseInt(response.Item, "xp"),
            Level = ParseInt(response.Item, "level", defaultValue: 1),
            Streak = ParseInt(response.Item, "streak")
        };
    }

    public async Task UpdateProgressAsync(
        string childId,
        int xp,
        int level,
        int streak,
        CancellationToken cancellationToken = default)
    {
        var request = new UpdateItemRequest
        {
            TableName = TableName,
            Key = new Dictionary<string, AttributeValue>
            {
                ["childId"] = new AttributeValue { S = childId }
            },
            UpdateExpression = "SET xp = :xp, #lvl = :lvl, streak = :streak, updatedAt = :updatedAt",
            ExpressionAttributeNames = new Dictionary<string, string>
            {
                ["#lvl"] = "level"
            },
            ExpressionAttributeValues = new Dictionary<string, AttributeValue>
            {
                [":xp"] = new AttributeValue { N = xp.ToString() },
                [":lvl"] = new AttributeValue { N = level.ToString() },
                [":streak"] = new AttributeValue { N = streak.ToString() },
                [":updatedAt"] = new AttributeValue { S = DateTime.UtcNow.ToString("O") }
            },
            ConditionExpression = "attribute_exists(childId)"
        };

        await dynamoDbClient.UpdateItemAsync(request, cancellationToken);
    }

    private static int ParseInt(
        IReadOnlyDictionary<string, AttributeValue> item,
        string key,
        int defaultValue = 0)
    {
        if (!item.TryGetValue(key, out var value) || string.IsNullOrWhiteSpace(value.N))
        {
            return defaultValue;
        }

        return int.TryParse(value.N, out var parsed) ? parsed : defaultValue;
    }
}
