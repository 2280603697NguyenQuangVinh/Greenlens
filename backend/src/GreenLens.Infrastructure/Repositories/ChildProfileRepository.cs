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
        var request = new PutItemRequest
        {
            TableName = _tableName,
            Item = ToItem(profile),
            ConditionExpression = "attribute_not_exists(childId)"
        };

        return _dynamoDb.PutItemAsync(request, cancellationToken);
    }

    public async Task<ChildProfile?> GetByIdAsync(string childId, CancellationToken cancellationToken = default)
    {
        var response = await _dynamoDb.GetItemAsync(new GetItemRequest
        {
            TableName = _tableName,
            Key = new Dictionary<string, AttributeValue>
            {
                ["childId"] = new() { S = childId }
            }
        }, cancellationToken);

        return response.Item is null || response.Item.Count == 0
            ? null
            : FromItem(response.Item);
    }

    public Task UpdateProgressAsync(
        string childId,
        int xp,
        int level,
        int streak,
        CancellationToken cancellationToken = default)
    {
        var request = new UpdateItemRequest
        {
            TableName = _tableName,
            Key = new Dictionary<string, AttributeValue>
            {
                ["childId"] = new() { S = childId }
            },
            UpdateExpression = "SET xp = :xp, #level = :level, streak = :streak, updatedAt = :updatedAt",
            ExpressionAttributeNames = new Dictionary<string, string>
            {
                ["#level"] = "level"
            },
            ExpressionAttributeValues = new Dictionary<string, AttributeValue>
            {
                [":xp"] = new() { N = xp.ToString() },
                [":level"] = new() { N = level.ToString() },
                [":streak"] = new() { N = streak.ToString() },
                [":updatedAt"] = new() { S = DateTime.UtcNow.ToString("O") }
            },
            ConditionExpression = "attribute_exists(childId)"
        };

        return _dynamoDb.UpdateItemAsync(request, cancellationToken);
    }

    private static Dictionary<string, AttributeValue> ToItem(ChildProfile profile)
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
            ["createdAt"] = new() { S = profile.CreatedAt.ToString("O") },
            ["updatedAt"] = new() { S = profile.UpdatedAt.ToString("O") }
        };

        AddStringList(item, "badges", profile.Badges);
        AddStringList(item, "rewards", profile.Rewards);

        return item;
    }

    private static ChildProfile FromItem(Dictionary<string, AttributeValue> item)
    {
        return new ChildProfile
        {
            ChildId = item["childId"].S,
            CognitoSub = item["cognitoSub"].S,
            CharacterName = item["characterName"].S,
            Gender = item["gender"].S,
            Hair = item["hair"].S,
            Eyes = item["eyes"].S,
            Outfit = item["outfit"].S,
            AvatarPreview = item["avatarPreview"].S,
            Xp = int.Parse(item["xp"].N),
            Level = int.Parse(item["level"].N),
            Streak = int.Parse(item["streak"].N),
            Badges = ReadStringList(item, "badges"),
            Rewards = ReadStringList(item, "rewards"),
            CreatedAt = DateTime.Parse(item["createdAt"].S, null, System.Globalization.DateTimeStyles.RoundtripKind),
            UpdatedAt = DateTime.Parse(item["updatedAt"].S, null, System.Globalization.DateTimeStyles.RoundtripKind)
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

    private static IReadOnlyList<string> ReadStringList(
        IReadOnlyDictionary<string, AttributeValue> item,
        string fieldName)
    {
        if (!item.TryGetValue(fieldName, out var value) || value.L is null)
        {
            return [];
        }

        return value.L
            .Where(attribute => !string.IsNullOrWhiteSpace(attribute.S))
            .Select(attribute => attribute.S)
            .ToList();
    }
}
