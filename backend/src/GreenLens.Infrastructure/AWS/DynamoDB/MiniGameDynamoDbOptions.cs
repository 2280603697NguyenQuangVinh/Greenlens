namespace GreenLens.Infrastructure.AWS.DynamoDB;

public sealed class MiniGameDynamoDbOptions
{
    public string ResultsTableName { get; init; } = "GreenLens-MiniGameResults";
    public string ItemsTableName { get; init; } = "GreenLens-MiniGameItems";
    public string AssetBaseUrl { get; init; } = string.Empty;
}
