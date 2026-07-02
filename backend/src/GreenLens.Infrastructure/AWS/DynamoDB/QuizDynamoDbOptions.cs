namespace GreenLens.Infrastructure.AWS.DynamoDB;

public sealed class QuizDynamoDbOptions
{
    public string ChildProfilesTableName { get; init; } = "GreenLens-ChildProfiles";
    public string QuizSessionsTableName { get; init; } = "GreenLens-QuizSessions";
    public string QuizFallbackTableName { get; init; } = "GreenLens-QuizFallbacks";
    public string QuizPoolTableName { get; init; } = "GreenLens-QuizPool";
    public int DefaultAge { get; init; } = 8;
    public int PoolTargetReadyCount { get; init; } = 5;
    public int PoolRefillThreshold { get; init; } = 2;
    public int PoolItemTtlDays { get; init; } = 14;
}
