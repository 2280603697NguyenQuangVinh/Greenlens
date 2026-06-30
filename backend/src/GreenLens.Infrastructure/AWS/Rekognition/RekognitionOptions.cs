namespace GreenLens.Infrastructure.AWS.Rekognition;

public sealed class RekognitionOptions
{
    public int MaxLabels { get; init; } = 10;
    public float MinConfidence { get; init; } = 50;
    public int TimeoutSeconds { get; init; } = 5;
    public int CircuitFailureThreshold { get; init; } = 3;
    public int CircuitBreakSeconds { get; init; } = 60;
}
