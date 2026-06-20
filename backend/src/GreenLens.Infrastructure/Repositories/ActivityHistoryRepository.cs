using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using GreenLens.Domain.Common.Interfaces;
using GreenLens.Domain.Modules.Activities.Entities;
using GreenLens.Domain.Modules.Activities.Enums;
using GreenLens.Infrastructure.Persistence;

namespace GreenLens.Infrastructure.Repositories;

public sealed class ActivityHistoryRepository : IActivityHistoryRepository
{
    private readonly IAmazonDynamoDB _dynamoDb;
    private readonly string _tableName;

    public ActivityHistoryRepository(IAmazonDynamoDB dynamoDb, string? tableName = null)
    {
        _dynamoDb = dynamoDb;
        _tableName = string.IsNullOrWhiteSpace(tableName)
            ? Environment.GetEnvironmentVariable("ACTIVITY_HISTORY_TABLE_NAME") ?? TableNames.ActivityHistory
            : tableName;
    }

    public Task SaveAsync(ActivityHistory history, CancellationToken cancellationToken = default)
    {
        var request = new PutItemRequest
        {
            TableName = _tableName,
            Item = new Dictionary<string, AttributeValue>
            {
                ["historyId"] = new() { S = history.HistoryId },
                ["childId"] = new() { S = history.ChildId },
                ["activityType"] = new() { S = ToActivityTypeValue(history.ActivityType) },
                ["score"] = new() { N = history.Score.ToString() },
                ["correctAnswers"] = new() { N = history.CorrectAnswers.ToString() },
                ["wrongAnswers"] = new() { N = history.WrongAnswers.ToString() },
                ["durationSeconds"] = new() { N = history.DurationSeconds.ToString() },
                ["xpEarned"] = new() { N = history.XpEarned.ToString() },
                ["completedAt"] = new() { S = history.CompletedAt.ToString("O") }
            }
        };

        return _dynamoDb.PutItemAsync(request, cancellationToken);
    }

    private static string ToActivityTypeValue(ActivityType activityType) =>
        activityType switch
        {
            ActivityType.MiniGame => "mini_game",
            _ => activityType.ToString().ToLowerInvariant()
        };
}
