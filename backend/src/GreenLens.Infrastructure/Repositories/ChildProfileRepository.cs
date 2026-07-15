using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using GreenLens.Domain.Common.Interfaces;
using GreenLens.Domain.Modules.ChildProfiles.Entities;
using GreenLens.Infrastructure.Persistence;

namespace GreenLens.Infrastructure.Repositories;

public sealed class ChildProfileRepository : IChildProfileRepository
{
    private readonly IAmazonDynamoDB _dynamoDb;
    private readonly string _tableName;

    public ChildProfileRepository(IAmazonDynamoDB dynamoDb, string? tableName = null)
    {
        _dynamoDb = dynamoDb;
        _tableName = string.IsNullOrWhiteSpace(tableName)
            ? Environment.GetEnvironmentVariable("CHILD_PROFILES_TABLE_NAME") ?? TableNames.ChildProfiles
            : tableName;
    }

    public Task SaveAsync(ChildProfile profile, CancellationToken cancellationToken = default)
    {
        var item = new Dictionary<string, AttributeValue>
        {
            ["childId"] = RequiredString(profile.ChildId, nameof(profile.ChildId)),
            ["cognitoSub"] = RequiredString(profile.CognitoSub, nameof(profile.CognitoSub)),
            ["characterName"] = RequiredString(profile.CharacterName, nameof(profile.CharacterName)),
            ["gender"] = RequiredString(profile.Gender, nameof(profile.Gender)),
            ["hair"] = RequiredString(profile.Hair, nameof(profile.Hair)),
            ["eyes"] = RequiredString(profile.Eyes, nameof(profile.Eyes)),
            ["outfit"] = RequiredString(profile.Outfit, nameof(profile.Outfit)),
            ["avatarPreview"] = RequiredString(profile.AvatarPreview, nameof(profile.AvatarPreview)),
            ["xp"] = new() { N = profile.Xp.ToString() },
            ["level"] = new() { N = profile.Level.ToString() },
            ["streak"] = new() { N = profile.Streak.ToString() },
            ["streakFreezeDaysUsed"] = new() { N = profile.StreakFreezeDaysUsed.ToString() },
            ["aiCameraScanCount"] = new() { N = profile.AiCameraScanCount.ToString() },
            ["miniGameHighScore"] = new() { N = profile.MiniGameHighScore.ToString() },
            ["status"] = new() { S = string.IsNullOrWhiteSpace(profile.Status) ? "Active" : profile.Status },
            ["createdAt"] = new() { S = profile.CreatedAt.ToString("O") },
            ["updatedAt"] = new() { S = profile.UpdatedAt.ToString("O") }
        };

        if (!string.IsNullOrWhiteSpace(profile.DeviceId))
        {
            item["deviceId"] = new AttributeValue { S = profile.DeviceId.Trim() };
        }

        if (!string.IsNullOrWhiteSpace(profile.LastStreakDate))
        {
            item["lastStreakDate"] = new AttributeValue { S = profile.LastStreakDate };
        }

        AddStringList(item, "badges", profile.Badges);
        AddStringList(item, "rewards", profile.Rewards);

        if (!string.IsNullOrWhiteSpace(profile.UpdatedBy))
        {
            item["updatedBy"] = new AttributeValue { S = profile.UpdatedBy };
        }

        var request = new PutItemRequest
        {
            TableName = _tableName,
            Item = item,
            ConditionExpression = "attribute_not_exists(childId)"
        };

        return _dynamoDb.PutItemAsync(request, cancellationToken);
    }

    public async Task<ChildProfile?> GetAsync(
        string childId,
        CancellationToken cancellationToken = default)
    {
        var response = await _dynamoDb.GetItemAsync(
            new GetItemRequest
            {
                TableName = _tableName,
                Key = new Dictionary<string, AttributeValue>
                {
                    ["childId"] = new() { S = childId }
                }
            },
            cancellationToken);

        if (response.Item.Count == 0)
        {
            return null;
        }

        return new ChildProfile
        {
            ChildId = GetRequiredString(response.Item, "childId"),
            CognitoSub = GetRequiredString(response.Item, "cognitoSub"),
            DeviceId = GetString(response.Item, "deviceId"),
            CharacterName = GetRequiredString(response.Item, "characterName"),
            Gender = GetRequiredString(response.Item, "gender"),
            Hair = GetRequiredString(response.Item, "hair"),
            Eyes = GetRequiredString(response.Item, "eyes"),
            Outfit = GetRequiredString(response.Item, "outfit"),
            AvatarPreview = GetRequiredString(response.Item, "avatarPreview"),
            Xp = GetInt(response.Item, "xp"),
            Level = GetInt(response.Item, "level", 1),
            Streak = GetInt(response.Item, "streak"),
            LastStreakDate = GetString(response.Item, "lastStreakDate"),
            StreakFreezeDaysUsed = GetInt(response.Item, "streakFreezeDaysUsed"),
            AiCameraScanCount = GetInt(response.Item, "aiCameraScanCount"),
            MiniGameHighScore = GetInt(response.Item, "miniGameHighScore"),
            Badges = GetStringList(response.Item, "badges"),
            Rewards = GetStringList(response.Item, "rewards"),
            Status = GetString(response.Item, "status") ?? "Active",
            UpdatedBy = GetString(response.Item, "updatedBy"),
            CreatedAt = GetDate(response.Item, "createdAt"),
            UpdatedAt = GetDate(response.Item, "updatedAt")
        };
    }

    public async Task<IReadOnlyList<ChildProfile>> ListTopByMiniGameHighScoreAsync(
        int limit,
        CancellationToken cancellationToken = default)
    {
        var requestedLimit = Math.Clamp(limit, 1, 50);
        var items = new List<Dictionary<string, AttributeValue>>();
        Dictionary<string, AttributeValue>? lastKey = null;

        do
        {
            var response = await _dynamoDb.ScanAsync(
                new ScanRequest
                {
                    TableName = _tableName,
                    ExclusiveStartKey = lastKey,
                    ProjectionExpression = "childId, cognitoSub, characterName, gender, hair, eyes, outfit, avatarPreview, xp, #level, streak, lastStreakDate, streakFreezeDaysUsed, aiCameraScanCount, miniGameHighScore, badges, rewards, createdAt, updatedAt",
                    ExpressionAttributeNames = new Dictionary<string, string>
                    {
                        ["#level"] = "level"
                    }
                },
                cancellationToken);

            items.AddRange(response.Items);
            lastKey = response.LastEvaluatedKey is { Count: > 0 }
                ? response.LastEvaluatedKey
                : null;
        }
        while (lastKey is not null);

        return items
            .Select(ToProfile)
            .Where(profile => string.Equals(profile.Status, "Active", StringComparison.OrdinalIgnoreCase))
            .OrderByDescending(profile => profile.MiniGameHighScore)
            .ThenByDescending(profile => profile.Xp)
            .ThenBy(profile => profile.CreatedAt)
            .Take(requestedLimit)
            .ToList();
    }

    public Task UpdateDeviceIdAsync(
        string childId,
        string cognitoSub,
        string deviceId,
        CancellationToken cancellationToken = default)
    {
        var request = new UpdateItemRequest
        {
            TableName = _tableName,
            Key = new Dictionary<string, AttributeValue>
            {
                ["childId"] = RequiredString(childId, nameof(childId))
            },
            UpdateExpression = "SET deviceId = :deviceId, updatedAt = :updatedAt",
            ConditionExpression = "cognitoSub = :cognitoSub",
            ExpressionAttributeValues = new Dictionary<string, AttributeValue>
            {
                [":deviceId"] = RequiredString(deviceId, nameof(deviceId)),
                [":updatedAt"] = new() { S = DateTime.UtcNow.ToString("O") },
                [":cognitoSub"] = RequiredString(cognitoSub, nameof(cognitoSub))
            }
        };

        return _dynamoDb.UpdateItemAsync(request, cancellationToken);
    }

    public Task UpdateStreakAsync(
        string childId,
        string cognitoSub,
        int streak,
        string lastStreakDate,
        int streakFreezeDaysUsed,
        CancellationToken cancellationToken = default)
    {
        var request = new UpdateItemRequest
        {
            TableName = _tableName,
            Key = new Dictionary<string, AttributeValue>
            {
                ["childId"] = RequiredString(childId, nameof(childId))
            },
            UpdateExpression = "SET streak = :streak, lastStreakDate = :lastStreakDate, streakFreezeDaysUsed = :freezeDaysUsed, updatedAt = :updatedAt",
            ConditionExpression = "cognitoSub = :cognitoSub",
            ExpressionAttributeValues = new Dictionary<string, AttributeValue>
            {
                [":streak"] = new() { N = Math.Max(streak, 0).ToString() },
                [":lastStreakDate"] = RequiredString(lastStreakDate, nameof(lastStreakDate)),
                [":freezeDaysUsed"] = new() { N = Math.Max(streakFreezeDaysUsed, 0).ToString() },
                [":updatedAt"] = new() { S = DateTime.UtcNow.ToString("O") },
                [":cognitoSub"] = RequiredString(cognitoSub, nameof(cognitoSub))
            }
        };

        return _dynamoDb.UpdateItemAsync(request, cancellationToken);
    }

    private static ChildProfile ToProfile(Dictionary<string, AttributeValue> item)
    {
        return new ChildProfile
        {
            ChildId = GetRequiredString(item, "childId"),
            CognitoSub = GetRequiredString(item, "cognitoSub"),
            DeviceId = GetString(item, "deviceId"),
            CharacterName = GetRequiredString(item, "characterName"),
            Gender = GetRequiredString(item, "gender"),
            Hair = GetRequiredString(item, "hair"),
            Eyes = GetRequiredString(item, "eyes"),
            Outfit = GetRequiredString(item, "outfit"),
            AvatarPreview = GetRequiredString(item, "avatarPreview"),
            Xp = GetInt(item, "xp"),
            Level = GetInt(item, "level", 1),
            Streak = GetInt(item, "streak"),
            LastStreakDate = GetString(item, "lastStreakDate"),
            StreakFreezeDaysUsed = GetInt(item, "streakFreezeDaysUsed"),
            AiCameraScanCount = GetInt(item, "aiCameraScanCount"),
            MiniGameHighScore = GetInt(item, "miniGameHighScore"),
            Badges = GetStringList(item, "badges"),
            Rewards = GetStringList(item, "rewards"),
            Status = GetString(item, "status") ?? "Active",
            UpdatedBy = GetString(item, "updatedBy"),
            CreatedAt = GetDate(item, "createdAt"),
            UpdatedAt = GetDate(item, "updatedAt")
        };
    }

    private static AttributeValue RequiredString(string value, string fieldName)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new InvalidOperationException($"{fieldName} cannot be empty when saving child profile.");
        }

        return new AttributeValue { S = value };
    }

    private static void AddStringList(
        IDictionary<string, AttributeValue> item,
        string fieldName,
        IReadOnlyList<string> values)
    {
        var nonEmptyValues = values
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Select(value => new AttributeValue { S = value })
            .ToList();

        if (nonEmptyValues.Count > 0)
        {
            item[fieldName] = new AttributeValue { L = nonEmptyValues };
        }
    }

    private static string GetRequiredString(Dictionary<string, AttributeValue> item, string name)
    {
        return item.TryGetValue(name, out var value) && !string.IsNullOrWhiteSpace(value.S)
            ? value.S
            : string.Empty;
    }

    private static string? GetString(Dictionary<string, AttributeValue> item, string name)
    {
        return item.TryGetValue(name, out var value) && !string.IsNullOrWhiteSpace(value.S)
            ? value.S
            : null;
    }

    private static int GetInt(Dictionary<string, AttributeValue> item, string name, int fallback = 0)
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

    private static IReadOnlyList<string> GetStringList(Dictionary<string, AttributeValue> item, string name)
    {
        if (!item.TryGetValue(name, out var value))
        {
            return [];
        }

        if (value.SS is { Count: > 0 })
        {
            return value.SS;
        }

        return value.L?
            .Where(entry => !string.IsNullOrWhiteSpace(entry.S))
            .Select(entry => entry.S)
            .ToList() ?? [];
    }
}
