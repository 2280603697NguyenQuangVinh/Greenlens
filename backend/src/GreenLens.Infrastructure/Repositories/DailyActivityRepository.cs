using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using GreenLens.Domain.Common.Interfaces;
using GreenLens.Domain.Modules.Activities.Entities;
using GreenLens.Infrastructure.Persistence;

namespace GreenLens.Infrastructure.Repositories;

public sealed class DailyActivityRepository : IDailyActivityRepository
{
    private readonly IAmazonDynamoDB _dynamoDb;
    private readonly string _tableName;

    public DailyActivityRepository(IAmazonDynamoDB dynamoDb, string? tableName = null)
    {
        _dynamoDb = dynamoDb;
        _tableName = string.IsNullOrWhiteSpace(tableName)
            ? Environment.GetEnvironmentVariable("DAILY_ACTIVITIES_TABLE_NAME") ?? TableNames.DailyActivities
            : tableName;
    }

    public async Task<DailyActivity?> GetAsync(
        string childId,
        string date,
        CancellationToken cancellationToken = default)
    {
        var response = await _dynamoDb.GetItemAsync(new GetItemRequest
        {
            TableName = _tableName,
            Key = new Dictionary<string, AttributeValue>
            {
                ["childId"] = new() { S = childId },
                ["date"] = new() { S = date }
            }
        }, cancellationToken);

        return response.Item is null || response.Item.Count == 0
            ? null
            : FromItem(response.Item);
    }

    public Task SaveAsync(DailyActivity activity, CancellationToken cancellationToken = default)
    {
        var request = new PutItemRequest
        {
            TableName = _tableName,
            Item = new Dictionary<string, AttributeValue>
            {
                ["childId"] = new() { S = activity.ChildId },
                ["date"] = new() { S = activity.Date },
                ["gameCompleted"] = new() { BOOL = activity.GameCompleted },
                ["streak"] = new() { N = activity.Streak.ToString() },
                ["updatedAt"] = new() { S = activity.UpdatedAt.ToString("O") }
            }
        };

        return _dynamoDb.PutItemAsync(request, cancellationToken);
    }

    private static DailyActivity FromItem(Dictionary<string, AttributeValue> item)
    {
        return new DailyActivity
        {
            ChildId = item["childId"].S,
            Date = item["date"].S,
            GameCompleted = item.TryGetValue("gameCompleted", out var gameCompleted) && gameCompleted.BOOL,
            Streak = item.TryGetValue("streak", out var streak) ? int.Parse(streak.N) : 0,
            UpdatedAt = item.TryGetValue("updatedAt", out var updatedAt)
                ? DateTime.Parse(updatedAt.S, null, System.Globalization.DateTimeStyles.RoundtripKind)
                : DateTime.UtcNow
        };
    }
}
