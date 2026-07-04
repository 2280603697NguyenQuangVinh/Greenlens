using System.Text.Json;
using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using GreenLens.Application.Modules.Quiz.DTOs;
using GreenLens.Application.Modules.Quiz.Interfaces;

namespace GreenLens.Infrastructure.AWS.DynamoDB;

public sealed class DynamoDbQuizRepository : IQuizRepository, IQuizPoolRepository
{
    private const string GlobalPoolChildId = "global";
    private const string ProgressQuizSetId = "state";
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
                !string.IsNullOrWhiteSpace(questionsJson.S) &&
                (!response.Item.TryGetValue("status", out var status) ||
                    string.IsNullOrWhiteSpace(status.S) ||
                    string.Equals(status.S, "Active", StringComparison.OrdinalIgnoreCase)))
            {
                var questions = JsonSerializer.Deserialize<List<QuizQuestionDto>>(questionsJson.S, JsonOptions);
                if (questions is { Count: >= 3 } &&
                    questions.Take(3).All(question => question.Options.Count == 4))
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

    public async Task<QuizPoolItemDto?> ClaimReadyAsync(
        string childId,
        string cognitoSub,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await _dynamoDb.QueryAsync(
                new QueryRequest
                {
                    TableName = _options.QuizPoolTableName,
                    KeyConditionExpression = "childId = :global",
                    FilterExpression = "#status = :ready",
                    ExpressionAttributeNames = new Dictionary<string, string>
                    {
                        ["#status"] = "status"
                    },
                    ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                    {
                        [":global"] = new() { S = GlobalPoolChildId },
                        [":ready"] = new() { S = "Ready" }
                    },
                    ScanIndexForward = true,
                    Limit = Math.Max(_options.PoolTargetReadyCount * 2, 10)
                },
                cancellationToken);

            var usedIds = await GetUsedQuizSetIdsAsync(childId, cancellationToken);
            foreach (var item in response.Items)
            {
                var poolItem = ToPoolItem(item);
                if (usedIds.Contains(poolItem.QuizSetId))
                {
                    continue;
                }

                if (poolItem.Questions.Count < 3 ||
                    poolItem.Questions.Take(3).Any(question => question.Options.Count != 4))
                {
                    continue;
                }

                await MarkQuizSetUsedAsync(childId, cognitoSub, poolItem.QuizSetId, cancellationToken);
                return poolItem with { Status = "Ready", ClaimedAt = DateTime.UtcNow };
            }
        }
        catch (ResourceNotFoundException)
        {
        }

        return null;
    }

    public async Task<int> CountReadyAsync(
        string childId,
        string cognitoSub,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await _dynamoDb.QueryAsync(
                new QueryRequest
                {
                    TableName = _options.QuizPoolTableName,
                    KeyConditionExpression = "childId = :global",
                    FilterExpression = "#status = :ready",
                    ExpressionAttributeNames = new Dictionary<string, string>
                    {
                        ["#status"] = "status"
                    },
                    ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                    {
                        [":global"] = new() { S = GlobalPoolChildId },
                        [":ready"] = new() { S = "Ready" }
                    }
                },
                cancellationToken);

            var usedIds = await GetUsedQuizSetIdsAsync(childId, cancellationToken);
            return response.Items.Count(item =>
            {
                if (item.TryGetValue("quizSetId", out var quizSetId) &&
                    !string.IsNullOrWhiteSpace(quizSetId.S) &&
                    usedIds.Contains(quizSetId.S))
                {
                    return false;
                }

                var questions = JsonSerializer.Deserialize<List<QuizQuestionDto>>(
                    GetString(item, "questionsJson") ?? "[]",
                    JsonOptions) ?? [];
                return questions.Count >= 3 &&
                    questions.Take(3).All(question => question.Options.Count == 4);
            });
        }
        catch (ResourceNotFoundException)
        {
            throw;
        }
    }

    public Task SaveReadyAsync(
        QuizPoolItemDto item,
        CancellationToken cancellationToken = default)
    {
        return SavePoolItemAsync(item with { ChildId = GlobalPoolChildId, CognitoSub = "global" }, cancellationToken);
    }

    public async Task SupersedeReadyAsync(
        CancellationToken cancellationToken = default)
    {
        var response = await _dynamoDb.QueryAsync(
            new QueryRequest
            {
                TableName = _options.QuizPoolTableName,
                KeyConditionExpression = "childId = :global",
                FilterExpression = "#status = :ready",
                ExpressionAttributeNames = new Dictionary<string, string>
                {
                    ["#status"] = "status"
                },
                ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                {
                    [":global"] = new() { S = GlobalPoolChildId },
                    [":ready"] = new() { S = "Ready" }
                }
            },
            cancellationToken);

        foreach (var item in response.Items)
        {
            var quizSetId = GetString(item, "quizSetId");
            if (string.IsNullOrWhiteSpace(quizSetId))
            {
                continue;
            }

            await _dynamoDb.UpdateItemAsync(
                new UpdateItemRequest
                {
                    TableName = _options.QuizPoolTableName,
                    Key = new Dictionary<string, AttributeValue>
                    {
                        ["childId"] = new() { S = GlobalPoolChildId },
                        ["quizSetId"] = new() { S = quizSetId }
                    },
                    UpdateExpression = "SET #status = :superseded, supersededAt = :now",
                    ConditionExpression = "#status = :ready",
                    ExpressionAttributeNames = new Dictionary<string, string>
                    {
                        ["#status"] = "status"
                    },
                    ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                    {
                        [":superseded"] = new() { S = "Superseded" },
                        [":now"] = new() { S = DateTime.UtcNow.ToString("O") },
                        [":ready"] = new() { S = "Ready" }
                    }
                },
                cancellationToken);
        }
    }

    public async Task SaveFailedAsync(
        string childId,
        string cognitoSub,
        string topic,
        int targetAge,
        string reason,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var now = DateTime.UtcNow;
            await SavePoolItemAsync(
                new QuizPoolItemDto(
                    childId,
                    $"quizset_failed_{Guid.NewGuid():N}",
                    cognitoSub,
                    topic,
                    targetAge,
                    [],
                    "Failed",
                    now,
                    null,
                    now,
                    now.AddDays(Math.Max(_options.PoolItemTtlDays, 1))),
                cancellationToken,
                reason);
        }
        catch (ResourceNotFoundException)
        {
        }
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

    private async Task SavePoolItemAsync(
        QuizPoolItemDto item,
        CancellationToken cancellationToken,
        string? failureReason = null)
    {
        var attributes = new Dictionary<string, AttributeValue>
        {
            ["childId"] = new() { S = item.ChildId },
            ["quizSetId"] = new() { S = item.QuizSetId },
            ["cognitoSub"] = new() { S = item.CognitoSub },
            ["topic"] = new() { S = item.Topic },
            ["targetAge"] = new() { N = item.TargetAge.ToString() },
            ["status"] = new() { S = item.Status },
            ["questionsJson"] = new() { S = JsonSerializer.Serialize(item.Questions, JsonOptions) },
            ["createdAt"] = new() { S = item.CreatedAt.ToString("O") },
            ["expiresAt"] = new() { N = new DateTimeOffset(item.ExpiresAt).ToUnixTimeSeconds().ToString() }
        };

        if (item.ClaimedAt.HasValue)
        {
            attributes["claimedAt"] = new() { S = item.ClaimedAt.Value.ToString("O") };
        }

        if (item.FailedAt.HasValue)
        {
            attributes["failedAt"] = new() { S = item.FailedAt.Value.ToString("O") };
        }

        if (!string.IsNullOrWhiteSpace(failureReason))
        {
            attributes["failureReason"] = new() { S = failureReason };
        }

        try
        {
            await _dynamoDb.PutItemAsync(
                new PutItemRequest
                {
                    TableName = _options.QuizPoolTableName,
                    Item = attributes,
                    ConditionExpression = "attribute_not_exists(childId) AND attribute_not_exists(quizSetId)"
                },
                cancellationToken);
        }
        catch (ConditionalCheckFailedException)
        {
        }
    }

    private async Task<HashSet<string>> GetUsedQuizSetIdsAsync(
        string childId,
        CancellationToken cancellationToken)
    {
        var response = await _dynamoDb.GetItemAsync(
            new GetItemRequest
            {
                TableName = _options.QuizPoolTableName,
                Key = new Dictionary<string, AttributeValue>
                {
                    ["childId"] = new() { S = ToProgressChildId(childId) },
                    ["quizSetId"] = new() { S = ProgressQuizSetId }
                }
            },
            cancellationToken);

        if (response.Item.Count == 0 ||
            !response.Item.TryGetValue("usedQuizSetIds", out var value) ||
            value.SS is null)
        {
            return [];
        }

        return value.SS.ToHashSet(StringComparer.Ordinal);
    }

    private async Task MarkQuizSetUsedAsync(
        string childId,
        string cognitoSub,
        string quizSetId,
        CancellationToken cancellationToken)
    {
        await _dynamoDb.UpdateItemAsync(
            new UpdateItemRequest
            {
                TableName = _options.QuizPoolTableName,
                Key = new Dictionary<string, AttributeValue>
                {
                    ["childId"] = new() { S = ToProgressChildId(childId) },
                    ["quizSetId"] = new() { S = ProgressQuizSetId }
                },
                UpdateExpression = "SET cognitoSub = :cognitoSub, updatedAt = :updatedAt ADD usedQuizSetIds :quizSetId",
                ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                {
                    [":cognitoSub"] = new() { S = cognitoSub },
                    [":updatedAt"] = new() { S = DateTime.UtcNow.ToString("O") },
                    [":quizSetId"] = new() { SS = [quizSetId] }
                }
            },
            cancellationToken);
    }

    private static string ToProgressChildId(string childId)
    {
        return $"progress#{childId}";
    }

    private static QuizPoolItemDto ToPoolItem(Dictionary<string, AttributeValue> item)
    {
        var questions = JsonSerializer.Deserialize<List<QuizQuestionDto>>(
            GetString(item, "questionsJson") ?? "[]",
            JsonOptions) ?? [];

        return new QuizPoolItemDto(
            GetString(item, "childId") ?? string.Empty,
            GetString(item, "quizSetId") ?? string.Empty,
            GetString(item, "cognitoSub") ?? string.Empty,
            GetString(item, "topic") ?? "trash",
            GetInt(item, "targetAge", 8),
            questions,
            GetString(item, "status") ?? "Ready",
            GetDate(item, "createdAt"),
            GetOptionalDate(item, "claimedAt"),
            GetOptionalDate(item, "failedAt"),
            GetUnixDate(item, "expiresAt"));
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

    private static DateTime? GetOptionalDate(Dictionary<string, AttributeValue> item, string name)
    {
        return item.TryGetValue(name, out var value) && DateTime.TryParse(value.S, out var parsed)
            ? parsed
            : null;
    }

    private static DateTime GetUnixDate(Dictionary<string, AttributeValue> item, string name)
    {
        return item.TryGetValue(name, out var value) &&
            long.TryParse(value.N ?? value.S, out var seconds)
                ? DateTimeOffset.FromUnixTimeSeconds(seconds).UtcDateTime
                : DateTime.UtcNow.AddDays(14);
    }
}
