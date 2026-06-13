namespace GreenLens.Infrastructure.AWS.Rekognition;

public sealed class RekognitionOptions
{
    public int MaxLabels { get; init; } = 10;
    public float MinConfidence { get; init; } = 50;
}
