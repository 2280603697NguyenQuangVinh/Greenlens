using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using GreenLens.Application.Modules.ChildProfiles.Interfaces;
using GreenLens.Application.Modules.ChildProfiles.Services;

namespace GreenLens.Infrastructure.AWS.DynamoDB;

public sealed class DynamoDbChildProgressService : IChildProgressService
{
    private const int AiCameraScanXp = 15;
    private const int QuizCorrectXp = 10;
    private const int QuizWrongXp = 5;
    private const int TrashSortMasterScore = 81;

    private readonly IAmazonDynamoDB _dynamoDb;
    private readonly string _childProfilesTableName;

    public DynamoDbChildProgressService(
        IAmazonDynamoDB dynamoDb,
        string childProfilesTableName)
    {
        _dynamoDb = dynamoDb;
        _childProfilesTableName = childProfilesTableName;
    }

    public async Task AwardAiCameraScanAsync(
        string childId,
        string cognitoSub,
        CancellationToken cancellationToken = default)
    {
        var response = await _dynamoDb.UpdateItemAsync(
            new UpdateItemRequest
            {
                TableName = _childProfilesTableName,
                Key = Key(childId),
                UpdateExpression = "SET updatedAt = :updatedAt ADD xp :xp, aiCameraScanCount :one",
                ConditionExpression = "cognitoSub = :cognitoSub",
                ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                {
                    [":xp"] = new() { N = AiCameraScanXp.ToString() },
                    [":one"] = new() { N = "1" },
                    [":updatedAt"] = new() { S = DateTime.UtcNow.ToString("O") },
                    [":cognitoSub"] = new() { S = cognitoSub }
                },
                ReturnValues = ReturnValue.UPDATED_NEW
            },
            cancellationToken);

        var scanCount = GetUpdatedNumber(response, "aiCameraScanCount");
        await UpdateLevelAsync(
            childId,
            cognitoSub,
            GetUpdatedNumber(response, "xp"),
            cancellationToken);

        if (scanCount == 1)
        {
            await AddBadgeAsync(childId, cognitoSub, "First Scan", cancellationToken);
        }

        if (scanCount >= 100)
        {
            await AddBadgeAsync(childId, cognitoSub, "Anh hùng môi trường", cancellationToken);
        }
    }

    public async Task AwardQuizAsync(
        string childId,
        string cognitoSub,
        int correctAnswers,
        int totalQuestions,
        CancellationToken cancellationToken = default)
    {
        var safeTotal = Math.Max(totalQuestions, 0);
        var safeCorrect = Math.Clamp(correctAnswers, 0, safeTotal);
        var wrongAnswers = Math.Max(safeTotal - safeCorrect, 0);
        var xp = safeCorrect * QuizCorrectXp + wrongAnswers * QuizWrongXp;

        if (xp > 0)
        {
            await AddXpAsync(childId, cognitoSub, xp, cancellationToken);
        }

        if (safeTotal > 0 && safeCorrect == safeTotal)
        {
            await AddBadgeAsync(childId, cognitoSub, "Thiên tài quiz", cancellationToken);
        }
    }

    public async Task AwardMiniGameAsync(
        string childId,
        string cognitoSub,
        int score,
        int xpAwarded,
        CancellationToken cancellationToken = default)
    {
        if (xpAwarded > 0)
        {
            await AddXpAsync(childId, cognitoSub, xpAwarded, cancellationToken);
        }

        await UpdateMiniGameHighScoreAsync(
            childId,
            cognitoSub,
            Math.Max(score, 0),
            cancellationToken);

        if (score >= TrashSortMasterScore)
        {
            await AddBadgeAsync(childId, cognitoSub, "Rác Kỳ Thủ", cancellationToken);
        }
    }

    private async Task AddXpAsync(
        string childId,
        string cognitoSub,
        int xp,
        CancellationToken cancellationToken)
    {
        var response = await _dynamoDb.UpdateItemAsync(
            new UpdateItemRequest
            {
                TableName = _childProfilesTableName,
                Key = Key(childId),
                UpdateExpression = "SET updatedAt = :updatedAt ADD xp :xp",
                ConditionExpression = "cognitoSub = :cognitoSub",
                ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                {
                    [":xp"] = new() { N = xp.ToString() },
                    [":updatedAt"] = new() { S = DateTime.UtcNow.ToString("O") },
                    [":cognitoSub"] = new() { S = cognitoSub }
                },
                ReturnValues = ReturnValue.UPDATED_NEW
            },
            cancellationToken);

        await UpdateLevelAsync(
            childId,
            cognitoSub,
            GetUpdatedNumber(response, "xp"),
            cancellationToken);
    }

    private Task UpdateLevelAsync(
        string childId,
        string cognitoSub,
        int xp,
        CancellationToken cancellationToken)
    {
        if (xp <= 0)
        {
            return Task.CompletedTask;
        }

        return _dynamoDb.UpdateItemAsync(
            new UpdateItemRequest
            {
                TableName = _childProfilesTableName,
                Key = Key(childId),
                UpdateExpression = "SET #level = :level, updatedAt = :updatedAt",
                ConditionExpression = "cognitoSub = :cognitoSub",
                ExpressionAttributeNames = new Dictionary<string, string>
                {
                    ["#level"] = "level"
                },
                ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                {
                    [":level"] = new() { N = ChildLeveling.GetLevel(xp).ToString() },
                    [":updatedAt"] = new() { S = DateTime.UtcNow.ToString("O") },
                    [":cognitoSub"] = new() { S = cognitoSub }
                }
            },
            cancellationToken);
    }

    private async Task UpdateMiniGameHighScoreAsync(
        string childId,
        string cognitoSub,
        int score,
        CancellationToken cancellationToken)
    {
        try
        {
            await _dynamoDb.UpdateItemAsync(
                new UpdateItemRequest
                {
                    TableName = _childProfilesTableName,
                    Key = Key(childId),
                    UpdateExpression = "SET miniGameHighScore = :score, updatedAt = :updatedAt",
                    ConditionExpression = "cognitoSub = :cognitoSub AND (attribute_not_exists(miniGameHighScore) OR miniGameHighScore < :score)",
                    ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                    {
                        [":score"] = new() { N = score.ToString() },
                        [":updatedAt"] = new() { S = DateTime.UtcNow.ToString("O") },
                        [":cognitoSub"] = new() { S = cognitoSub }
                    }
                },
                cancellationToken);
        }
        catch (ConditionalCheckFailedException)
        {
        }
    }

    private async Task AddBadgeAsync(
        string childId,
        string cognitoSub,
        string badge,
        CancellationToken cancellationToken)
    {
        try
        {
            await _dynamoDb.UpdateItemAsync(
                new UpdateItemRequest
                {
                    TableName = _childProfilesTableName,
                    Key = Key(childId),
                    UpdateExpression = "SET badges = :badge, updatedAt = :updatedAt",
                    ConditionExpression = "cognitoSub = :cognitoSub AND attribute_not_exists(badges)",
                    ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                    {
                        [":badge"] = new() { L = [new AttributeValue { S = badge }] },
                        [":updatedAt"] = new() { S = DateTime.UtcNow.ToString("O") },
                        [":cognitoSub"] = new() { S = cognitoSub }
                    }
                },
                cancellationToken);
        }
        catch (ConditionalCheckFailedException)
        {
            try
            {
                await _dynamoDb.UpdateItemAsync(
                    new UpdateItemRequest
                    {
                        TableName = _childProfilesTableName,
                        Key = Key(childId),
                        UpdateExpression = "SET badges = list_append(badges, :badge), updatedAt = :updatedAt",
                        ConditionExpression = "cognitoSub = :cognitoSub AND NOT contains(badges, :badgeValue)",
                        ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                        {
                            [":badge"] = new() { L = [new AttributeValue { S = badge }] },
                            [":badgeValue"] = new() { S = badge },
                            [":updatedAt"] = new() { S = DateTime.UtcNow.ToString("O") },
                            [":cognitoSub"] = new() { S = cognitoSub }
                        }
                    },
                    cancellationToken);
            }
            catch (ConditionalCheckFailedException)
            {
            }
        }
    }

    private static Dictionary<string, AttributeValue> Key(string childId)
    {
        return new Dictionary<string, AttributeValue>
        {
            ["childId"] = new() { S = childId }
        };
    }

    private static int GetUpdatedNumber(UpdateItemResponse response, string name)
    {
        return response.Attributes.TryGetValue(name, out var value) && int.TryParse(value.N, out var parsed)
            ? parsed
            : 0;
    }
}
