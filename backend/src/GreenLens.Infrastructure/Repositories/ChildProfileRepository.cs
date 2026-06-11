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
            Item = new Dictionary<string, AttributeValue>
            {
                ["childId"] = new() { S = profile.ChildId },
                ["cognitoSub"] = new() { S = profile.CognitoSub },
                ["characterName"] = new() { S = profile.CharacterName },
                ["gender"] = new() { S = profile.Gender },
                ["hair"] = new() { S = profile.Hair },
                ["eyes"] = new() { S = profile.Eyes },
                ["outfit"] = new() { S = profile.Outfit },
                ["avatarPreview"] = new() { S = profile.AvatarPreview },
                ["xp"] = new() { N = profile.Xp.ToString() },
                ["level"] = new() { N = profile.Level.ToString() },
                ["streak"] = new() { N = profile.Streak.ToString() },
                ["badges"] = new() { L = profile.Badges.Select(value => new AttributeValue { S = value }).ToList() },
                ["rewards"] = new() { L = profile.Rewards.Select(value => new AttributeValue { S = value }).ToList() },
                ["createdAt"] = new() { S = profile.CreatedAt.ToString("O") },
                ["updatedAt"] = new() { S = profile.UpdatedAt.ToString("O") }
            },
            ConditionExpression = "attribute_not_exists(childId)"
        };

        return _dynamoDb.PutItemAsync(request, cancellationToken);
    }
}
