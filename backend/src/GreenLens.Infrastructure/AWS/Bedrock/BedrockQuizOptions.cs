namespace GreenLens.Infrastructure.AWS.Bedrock;

public sealed class BedrockQuizOptions
{
    public string ModelId { get; init; } = "apac.amazon.nova-micro-v1:0";
    public int MaxTokens { get; init; } = 700;
    public int TimeoutSeconds { get; init; } = 10;
}
