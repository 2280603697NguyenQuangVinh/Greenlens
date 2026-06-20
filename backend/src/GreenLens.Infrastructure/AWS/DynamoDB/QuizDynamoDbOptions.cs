namespace GreenLens.Infrastructure.AWS.DynamoDB;

public sealed class QuizDynamoDbOptions
{
    public string ChildProfilesTableName { get; init; } = "GreenLens-ChildProfiles";
    public string QuizSessionsTableName { get; init; } = "GreenLens-QuizSessions";
    public string QuizFallbackTableName { get; init; } = "GreenLens-QuizFallbacks";
    public int DefaultAge { get; init; } = 8;
}
