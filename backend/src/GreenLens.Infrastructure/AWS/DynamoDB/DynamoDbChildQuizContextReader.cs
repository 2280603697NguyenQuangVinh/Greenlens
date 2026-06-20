using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using GreenLens.Application.Modules.Quiz.DTOs;
using GreenLens.Application.Modules.Quiz.Interfaces;

namespace GreenLens.Infrastructure.AWS.DynamoDB;

public sealed class DynamoDbChildQuizContextReader : IChildQuizContextReader
{
    private readonly IAmazonDynamoDB _dynamoDb;
    private readonly QuizDynamoDbOptions _options;

    public DynamoDbChildQuizContextReader(
        IAmazonDynamoDB dynamoDb,
        QuizDynamoDbOptions options)
    {
        _dynamoDb = dynamoDb;
        _options = options;
    }

    public async Task<ChildQuizContext> GetAsync(
        string childId,
        string cognitoSub,
        CancellationToken cancellationToken = default)
    {
        var response = await _dynamoDb.GetItemAsync(
            new GetItemRequest
            {
                TableName = _options.ChildProfilesTableName,
                Key = new Dictionary<string, AttributeValue>
                {
                    ["childId"] = new() { S = childId }
                }
            },
            cancellationToken);

        if (response.Item.Count == 0)
        {
            throw new InvalidOperationException("Child profile was not found.");
        }

        var ownerSub = GetString(response.Item, "cognitoSub");
        if (!string.Equals(ownerSub, cognitoSub, StringComparison.Ordinal))
        {
            throw new UnauthorizedAccessException("Child profile does not belong to this user.");
        }

        return new ChildQuizContext(
            childId,
            cognitoSub,
            ReadAge(response.Item));
    }

    private int ReadAge(Dictionary<string, AttributeValue> item)
    {
        if (item.TryGetValue("age", out var age) &&
            int.TryParse(age.N ?? age.S, out var parsedAge))
        {
            return Math.Clamp(parsedAge, 6, 12);
        }

        if (item.TryGetValue("birthYear", out var birthYear) &&
            int.TryParse(birthYear.N ?? birthYear.S, out var parsedBirthYear))
        {
            var ageFromYear = DateTime.UtcNow.Year - parsedBirthYear;
            return Math.Clamp(ageFromYear, 6, 12);
        }

        return _options.DefaultAge;
    }

    private static string? GetString(Dictionary<string, AttributeValue> item, string name)
    {
        return item.TryGetValue(name, out var value) ? value.S : null;
    }
}
