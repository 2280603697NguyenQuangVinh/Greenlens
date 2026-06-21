using System.Text.Json;
using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using GreenLens.Application.Modules.Quiz.DTOs;
using GreenLens.Application.Modules.Quiz.Interfaces;

namespace GreenLens.Infrastructure.AWS.DynamoDB;

public sealed class DynamoDbQuizRepository : IQuizRepository
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly IAmazonDynamoDB _dynamoDb;
    private readonly QuizDynamoDbOptions _options;

    public DynamoDbQuizRepository(
        IAmazonDynamoDB dynamoDb,
        QuizDynamoDbOptions options)
    {
        _dynamoDb = dynamoDb;
        _options = options;
    }

    public async Task<IReadOnlyList<QuizQuestionDto>> GetFallbackQuestionsAsync(
        string wasteType,
        int age,
        CancellationToken cancellationToken = default)
    {
        var key = NormalizeWasteType(wasteType);
        try
        {
            var response = await _dynamoDb.GetItemAsync(
                new GetItemRequest
                {
                    TableName = _options.QuizFallbackTableName,
                    Key = new Dictionary<string, AttributeValue>
                    {
                        ["fallbackKey"] = new() { S = key }
                    }
                },
                cancellationToken);

            if (response.Item.TryGetValue("questionsJson", out var questionsJson) &&
                !string.IsNullOrWhiteSpace(questionsJson.S))
            {
                var questions = JsonSerializer.Deserialize<List<QuizQuestionDto>>(questionsJson.S, JsonOptions);
                if (questions is { Count: >= 3 })
                {
                    return questions.Take(3).ToList();
                }
            }
        }
        catch (ResourceNotFoundException)
        {
        }

        return BuiltInFallbacks.GetQuestions(key);
    }

    public Task SaveSessionAsync(
        QuizSessionDto session,
        string cognitoSub,
        CancellationToken cancellationToken = default)
    {
        var now = DateTimeOffset.UtcNow;
        return _dynamoDb.PutItemAsync(
            new PutItemRequest
            {
                TableName = _options.QuizSessionsTableName,
                Item = new Dictionary<string, AttributeValue>
                {
                    ["sessionId"] = new() { S = session.SessionId },
                    ["cognitoSub"] = new() { S = cognitoSub },
                    ["childId"] = new() { S = session.ChildId },
                    ["gameType"] = new() { S = session.GameType },
                    ["wasteType"] = new() { S = session.WasteType },
                    ["targetAge"] = new() { N = session.TargetAge.ToString() },
                    ["status"] = new() { S = session.Status },
                    ["questionsJson"] = new() { S = JsonSerializer.Serialize(session.Questions, JsonOptions) },
                    ["createdAt"] = new() { S = session.CreatedAt.ToString("O") },
                    ["updatedAt"] = new() { S = session.UpdatedAt.ToString("O") },
                    ["expiresAt"] = new() { N = now.AddDays(7).ToUnixTimeSeconds().ToString() }
                },
                ConditionExpression = "attribute_not_exists(sessionId)"
            },
            cancellationToken);
    }

    public async Task<QuizSessionDto?> GetSessionAsync(
        string sessionId,
        string cognitoSub,
        CancellationToken cancellationToken = default)
    {
        var response = await _dynamoDb.GetItemAsync(
            new GetItemRequest
            {
                TableName = _options.QuizSessionsTableName,
                Key = new Dictionary<string, AttributeValue>
                {
                    ["sessionId"] = new() { S = sessionId }
                }
            },
            cancellationToken);

        if (response.Item.Count == 0)
        {
            return null;
        }

        if (!string.Equals(GetString(response.Item, "cognitoSub"), cognitoSub, StringComparison.Ordinal))
        {
            throw new UnauthorizedAccessException("Quiz session does not belong to this user.");
        }

        var questions = JsonSerializer.Deserialize<List<QuizQuestionDto>>(
            GetString(response.Item, "questionsJson") ?? "[]",
            JsonOptions) ?? [];

        return new QuizSessionDto(
            sessionId,
            GetString(response.Item, "childId") ?? string.Empty,
            GetString(response.Item, "gameType") ?? "quiz",
            GetString(response.Item, "wasteType") ?? string.Empty,
            GetInt(response.Item, "targetAge", GetInt(response.Item, "age", _options.DefaultAge)),
            GetString(response.Item, "status") ?? "InProgress",
            questions,
            GetDate(response.Item, "createdAt"),
            GetDate(response.Item, "updatedAt"));
    }

    public Task MarkSessionCompletedAsync(
        string sessionId,
        string cognitoSub,
        int correctAnswers,
        int xpAwarded,
        CancellationToken cancellationToken = default)
    {
        return _dynamoDb.UpdateItemAsync(
            new UpdateItemRequest
            {
                TableName = _options.QuizSessionsTableName,
                Key = new Dictionary<string, AttributeValue>
                {
                    ["sessionId"] = new() { S = sessionId }
                },
                UpdateExpression = "SET #status = :status, correctAnswers = :correctAnswers, xpAwarded = :xpAwarded, updatedAt = :updatedAt",
                ConditionExpression = "cognitoSub = :cognitoSub",
                ExpressionAttributeNames = new Dictionary<string, string>
                {
                    ["#status"] = "status"
                },
                ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                {
                    [":status"] = new() { S = "Completed" },
                    [":correctAnswers"] = new() { N = correctAnswers.ToString() },
                    [":xpAwarded"] = new() { N = xpAwarded.ToString() },
                    [":updatedAt"] = new() { S = DateTime.UtcNow.ToString("O") },
                    [":cognitoSub"] = new() { S = cognitoSub }
                }
            },
            cancellationToken);
    }

    private static string NormalizeWasteType(string wasteType)
    {
        return string.IsNullOrWhiteSpace(wasteType)
            ? "trash"
            : wasteType.Trim().ToLowerInvariant().Replace(' ', '-');
    }

    private static string? GetString(Dictionary<string, AttributeValue> item, string name)
    {
        return item.TryGetValue(name, out var value) ? value.S : null;
    }

    private static int GetInt(Dictionary<string, AttributeValue> item, string name, int fallback)
    {
        return item.TryGetValue(name, out var value) && int.TryParse(value.N ?? value.S, out var parsed)
            ? parsed
            : fallback;
    }

    private static DateTime GetDate(Dictionary<string, AttributeValue> item, string name)
    {
        return item.TryGetValue(name, out var value) && DateTime.TryParse(value.S, out var parsed)
            ? parsed
            : DateTime.UtcNow;
    }
}
