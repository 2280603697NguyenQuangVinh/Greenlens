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
            ["aiCameraScanCount"] = new() { N = profile.AiCameraScanCount.ToString() },
            ["createdAt"] = new() { S = profile.CreatedAt.ToString("O") },
            ["updatedAt"] = new() { S = profile.UpdatedAt.ToString("O") }
        };

        AddStringList(item, "badges", profile.Badges);
        AddStringList(item, "rewards", profile.Rewards);

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
            CharacterName = GetRequiredString(response.Item, "characterName"),
            Gender = GetRequiredString(response.Item, "gender"),
            Hair = GetRequiredString(response.Item, "hair"),
            Eyes = GetRequiredString(response.Item, "eyes"),
            Outfit = GetRequiredString(response.Item, "outfit"),
            AvatarPreview = GetRequiredString(response.Item, "avatarPreview"),
            Xp = GetInt(response.Item, "xp"),
            Level = GetInt(response.Item, "level", 1),
            Streak = GetInt(response.Item, "streak"),
            AiCameraScanCount = GetInt(response.Item, "aiCameraScanCount"),
            Badges = GetStringList(response.Item, "badges"),
            Rewards = GetStringList(response.Item, "rewards"),
            CreatedAt = GetDate(response.Item, "createdAt"),
            UpdatedAt = GetDate(response.Item, "updatedAt")
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
