namespace GreenLens.Infrastructure.AWS.Bedrock;

public sealed class BedrockOptions
{
    public string ModelId { get; init; } = "amazon.nova-lite-v1:0";
    public bool EnableFallbackGuidance { get; init; }
}
