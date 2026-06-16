namespace GreenLens.Infrastructure.AWS.DynamoDB;

public sealed class AiCameraUsageLimiterOptions
{
    public string TableName { get; init; } = "GreenLens-AiUsage";
    public int PerMinuteLimit { get; init; } = 3;
    public int PerDayLimit { get; init; } = 20;
}
