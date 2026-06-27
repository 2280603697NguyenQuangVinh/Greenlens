using System.Text.Json;
using Amazon.BedrockRuntime;
using Amazon.BedrockRuntime.Model;
using Amazon.Runtime;
using GreenLens.Application.Modules.AiCamera.DTOs;
using GreenLens.Application.Modules.AiCamera.Interfaces;

namespace GreenLens.Infrastructure.AWS.Bedrock;

public sealed class BedrockGuidanceService : IBedrockGuidanceService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly IAmazonBedrockRuntime _bedrockRuntime;
    private readonly BedrockOptions _options;

    public BedrockGuidanceService(
        IAmazonBedrockRuntime bedrockRuntime,
        BedrockOptions options)
    {
        _bedrockRuntime = bedrockRuntime;
        _options = options;
    }

    public async Task<BedrockGuidanceDto> GenerateGuidanceAsync(
        string label,
        string category,
        CancellationToken cancellationToken = default)
    {
        if (_options.EnableFallbackGuidance && _options.SkipBedrockWhenFallbackEnabled)
        {
            return AiCameraFallbackGuidance.Build(label, category);
        }

        var prompt = BuildPrompt(label, category);
        ConverseResponse response;
        using var timeout = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        timeout.CancelAfter(TimeSpan.FromSeconds(Math.Max(_options.TimeoutSeconds, 1)));

        try
        {
            response = await _bedrockRuntime.ConverseAsync(
                new ConverseRequest
                {
                    ModelId = _options.ModelId,
                    Messages =
                    [
                        new Message
                        {
                            Role = ConversationRole.User,
                            Content = [new ContentBlock { Text = prompt }]
                        }
                    ],
                    InferenceConfig = new InferenceConfiguration
                    {
                        MaxTokens = _options.MaxTokens,
                        Temperature = 0.1F
                    }
                },
                timeout.Token);
        }
        catch (AmazonServiceException exception) when (ShouldUseFallback(exception))
        {
            return AiCameraFallbackGuidance.Build(label, category);
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested && _options.EnableFallbackGuidance)
        {
            return AiCameraFallbackGuidance.Build(label, category);
        }
        catch (InvalidOperationException) when (_options.EnableFallbackGuidance)
        {
            return AiCameraFallbackGuidance.Build(label, category);
        }

        string text;
        try
        {
            text = NormalizeJsonText(ExtractResponseText(response));
        }
        catch (InvalidOperationException) when (_options.EnableFallbackGuidance)
        {
            return AiCameraFallbackGuidance.Build(label, category);
        }

        try
        {
            var guidance = JsonSerializer.Deserialize<BedrockGuidanceDto>(text, JsonOptions);
            if (guidance is null ||
                string.IsNullOrWhiteSpace(guidance.RecycleGuide) ||
                string.IsNullOrWhiteSpace(guidance.ReuseSuggestion) ||
                string.IsNullOrWhiteSpace(guidance.EnvironmentImpact))
            {
                throw new JsonException("Missing required guidance fields.");
            }

            return guidance;
        }
        catch (JsonException) when (_options.EnableFallbackGuidance)
        {
            return AiCameraFallbackGuidance.Build(label, category);
        }
        catch (JsonException exception)
        {
            throw new InvalidOperationException($"Bedrock returned invalid guidance JSON: {text}", exception);
        }
    }

    private static string BuildPrompt(string label, string category)
    {
        return $$"""
Vietnamese for kids 6-12. Object: {{label}}. Category: {{category}}.
Give practical, object-specific reuse ideas. Do not tell kids to ask an adult unless the object is hazardous, sharp, dirty, or unsafe.
Return only compact JSON:
{"recycleGuide":"...","reuseSuggestion":"...","environmentImpact":"..."}
""";
    }

    private bool ShouldUseFallback(AmazonServiceException exception)
    {
        if (!_options.EnableFallbackGuidance)
        {
            return false;
        }

        return exception.Message.Contains("Operation not allowed", StringComparison.OrdinalIgnoreCase) ||
            exception.Message.Contains("Too many tokens per day", StringComparison.OrdinalIgnoreCase) ||
            exception.Message.Contains("quota", StringComparison.OrdinalIgnoreCase) ||
            exception.Message.Contains("throttl", StringComparison.OrdinalIgnoreCase);
    }

    private static string ExtractResponseText(ConverseResponse response)
    {
        var text = response.Output?.Message?.Content?
            .FirstOrDefault(content => !string.IsNullOrWhiteSpace(content.Text))
            ?.Text;

        if (!string.IsNullOrWhiteSpace(text))
        {
            return text;
        }

        throw new InvalidOperationException("Bedrock response did not contain text content.");
    }

    private static string NormalizeJsonText(string text)
    {
        var trimmed = text.Trim();
        if (trimmed.StartsWith("```json", StringComparison.OrdinalIgnoreCase))
        {
            trimmed = trimmed[7..].Trim();
        }
        else if (trimmed.StartsWith("```", StringComparison.OrdinalIgnoreCase))
        {
            trimmed = trimmed[3..].Trim();
        }

        if (trimmed.EndsWith("```", StringComparison.OrdinalIgnoreCase))
        {
            trimmed = trimmed[..^3].Trim();
        }

        return trimmed;
    }
}
