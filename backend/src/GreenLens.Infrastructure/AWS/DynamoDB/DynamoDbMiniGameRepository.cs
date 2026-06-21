using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using GreenLens.Application.Modules.MiniGames.DTOs;
using GreenLens.Application.Modules.MiniGames.Interfaces;

namespace GreenLens.Infrastructure.AWS.DynamoDB;

public sealed class DynamoDbMiniGameRepository : IMiniGameRepository
{
    private const string ChildGameIndexName = "GSI-childId-gameType";

    private readonly IAmazonDynamoDB _dynamoDb;
    private readonly MiniGameDynamoDbOptions _options;

    public DynamoDbMiniGameRepository(
        IAmazonDynamoDB dynamoDb,
        MiniGameDynamoDbOptions options)
    {
        _dynamoDb = dynamoDb;
        _options = options;
    }

    public async Task<IReadOnlyList<MiniGameItemDto>> GetActiveItemsAsync(
        string gameType,
        CancellationToken cancellationToken = default)
    {
        var items = new List<MiniGameItemDto>();
        Dictionary<string, AttributeValue>? lastEvaluatedKey = null;

        do
        {
            var response = await _dynamoDb.ScanAsync(
                new ScanRequest
                {
                    TableName = _options.ItemsTableName,
                    FilterExpression = "gameType = :gameType AND isActive = :isActive",
                    ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                    {
                        [":gameType"] = new() { S = gameType },
                        [":isActive"] = new() { BOOL = true }
                    },
                    ExclusiveStartKey = lastEvaluatedKey
                },
                cancellationToken);

            items.AddRange(response.Items.Select(ToItem));
            lastEvaluatedKey = response.LastEvaluatedKey.Count > 0
                ? response.LastEvaluatedKey
                : null;
        }
        while (lastEvaluatedKey is not null);

        return items
            .OrderBy(item => item.Difficulty, StringComparer.OrdinalIgnoreCase)
            .ThenBy(item => item.ItemId, StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    public async Task<int> GetBestScoreAsync(
        string childId,
        string gameType,
        CancellationToken cancellationToken = default)
    {
        var response = await _dynamoDb.QueryAsync(
            new QueryRequest
            {
                TableName = _options.ResultsTableName,
                IndexName = ChildGameIndexName,
                KeyConditionExpression = "childId = :childId AND gameType = :gameType",
                ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                {
                    [":childId"] = new() { S = childId },
                    [":gameType"] = new() { S = gameType }
                },
                ProjectionExpression = "score"
            },
            cancellationToken);

        return response.Items
            .Select(item => item.TryGetValue("score", out var score) && int.TryParse(score.N, out var parsed)
                ? parsed
                : 0)
            .DefaultIfEmpty(0)
            .Max();
    }

    public Task SaveResultAsync(
        MiniGameResultDto result,
        CancellationToken cancellationToken = default)
    {
        var item = new Dictionary<string, AttributeValue>
        {
            ["resultId"] = new() { S = result.ResultId },
            ["childId"] = new() { S = result.ChildId },
            ["cognitoSub"] = new() { S = result.CognitoSub },
            ["gameType"] = new() { S = result.GameType },
            ["score"] = new() { N = result.Score.ToString() },
            ["correctCount"] = new() { N = result.CorrectCount.ToString() },
            ["wrongCount"] = new() { N = result.WrongCount.ToString() },
            ["durationSeconds"] = new() { N = result.DurationSeconds.ToString() },
            ["xpAwarded"] = new() { N = result.XpAwarded.ToString() },
            ["completedFromDailyActivity"] = new() { BOOL = result.CompletedFromDailyActivity },
            ["createdAt"] = new() { S = result.CreatedAt.ToString("O") }
        };

        return _dynamoDb.PutItemAsync(
            new PutItemRequest
            {
                TableName = _options.ResultsTableName,
                Item = item,
                ConditionExpression = "attribute_not_exists(resultId)"
            },
            cancellationToken);
    }

    private static MiniGameItemDto ToItem(Dictionary<string, AttributeValue> item)
    {
        return new MiniGameItemDto(
            GetString(item, "itemId"),
            GetString(item, "name"),
            GetString(item, "category"),
            GetString(item, "binColor"),
            GetString(item, "iconKey"),
            GetString(item, "difficulty", "easy"),
            item.TryGetValue("isActive", out var active) && active.BOOL);
    }

    private static string GetString(
        Dictionary<string, AttributeValue> item,
        string name,
        string fallback = "")
    {
        return item.TryGetValue(name, out var value) && !string.IsNullOrWhiteSpace(value.S)
            ? value.S
            : fallback;
    }
}
