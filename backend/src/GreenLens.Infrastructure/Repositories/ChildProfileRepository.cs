using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using GreenLens.Domain.Entities;
using GreenLens.Domain.Interfaces;

namespace GreenLens.Infrastructure.Repositories;

public sealed class ChildProfileRepository(IAmazonDynamoDB dynamoDbClient) : IChildProfileRepository
{
    private const string TableName = "GreenLens-ChildProfiles";

    public async Task<ChildProfile> CreateProfileAsync(ChildProfile profile, CancellationToken cancellationToken = default)
    {
        var request = new PutItemRequest
        {
            TableName = TableName,
            Item = ToItem(profile),
            ConditionExpression = "attribute_not_exists(childId)"
        };

        await dynamoDbClient.PutItemAsync(request, cancellationToken);
        return profile;
    }

    public async Task<ChildProfile?> GetByChildIdAsync(string childId, CancellationToken cancellationToken = default)
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

        return FromItem(response.Item);
    }

    private static Dictionary<string, AttributeValue> ToItem(ChildProfile profile)
    {
        return new Dictionary<string, AttributeValue>
        {
            ["childId"] = new AttributeValue { S = profile.ChildId },
            ["characterName"] = new AttributeValue { S = profile.CharacterName },
            ["gender"] = new AttributeValue { S = profile.Gender },
            ["hair"] = new AttributeValue { S = profile.Hair },
            ["eyes"] = new AttributeValue { S = profile.Eyes },
            ["outfit"] = new AttributeValue { S = profile.Outfit },
            ["avatarPreview"] = new AttributeValue { S = profile.AvatarPreview },
            ["xp"] = new AttributeValue { N = profile.Xp.ToString() },
            ["level"] = new AttributeValue { N = profile.Level.ToString() },
            ["streak"] = new AttributeValue { N = profile.Streak.ToString() },
            ["badges"] = new AttributeValue
            {
                L = profile.Badges.Select(static b => new AttributeValue { S = b }).ToList()
            },
            ["rewards"] = new AttributeValue
            {
                L = profile.Rewards.Select(static r => new AttributeValue { S = r }).ToList()
            },
            ["createdAt"] = new AttributeValue { S = profile.CreatedAt.ToString("O") }
        };
    }

    private static ChildProfile FromItem(IReadOnlyDictionary<string, AttributeValue> item)
    {
        return new ChildProfile
        {
            ChildId = GetString(item, "childId"),
            CharacterName = GetString(item, "characterName"),
            Gender = GetString(item, "gender"),
            Hair = GetString(item, "hair"),
            Eyes = GetString(item, "eyes"),
            Outfit = GetString(item, "outfit"),
            AvatarPreview = GetString(item, "avatarPreview"),
            Xp = GetInt(item, "xp"),
            Level = GetInt(item, "level", defaultValue: 1),
            Streak = GetInt(item, "streak"),
            Badges = GetStringList(item, "badges"),
            Rewards = GetStringList(item, "rewards"),
            CreatedAt = GetDateTime(item, "createdAt")
        };
    }

    private static string GetString(IReadOnlyDictionary<string, AttributeValue> item, string key)
        => item.TryGetValue(key, out var value) ? value.S ?? string.Empty : string.Empty;

    private static int GetInt(IReadOnlyDictionary<string, AttributeValue> item, string key, int defaultValue = 0)
    {
        if (!item.TryGetValue(key, out var value) || string.IsNullOrWhiteSpace(value.N))
        {
            return defaultValue;
        }

        return int.TryParse(value.N, out var parsed) ? parsed : defaultValue;
    }

    private static DateTime GetDateTime(IReadOnlyDictionary<string, AttributeValue> item, string key)
    {
        if (!item.TryGetValue(key, out var value) || string.IsNullOrWhiteSpace(value.S))
        {
            return DateTime.UtcNow;
        }

        return DateTime.TryParse(value.S, out var parsed) ? parsed : DateTime.UtcNow;
    }

    private static List<string> GetStringList(IReadOnlyDictionary<string, AttributeValue> item, string key)
    {
        if (!item.TryGetValue(key, out var value) || value.L is null)
        {
            return [];
        }

        return value.L.Select(static v => v.S ?? string.Empty).ToList();
    }
}
