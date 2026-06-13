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
        var prompt = BuildPrompt(label, category);
        ConverseResponse response;
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
                        MaxTokens = 500,
                        Temperature = 0.3F
                    }
                },
                cancellationToken);
        }
        catch (AmazonServiceException exception) when (
            _options.EnableFallbackGuidance &&
            exception.Message.Contains("Operation not allowed", StringComparison.OrdinalIgnoreCase))
        {
            return BuildFallbackGuidance(label, category);
        }

        var text = NormalizeJsonText(ExtractResponseText(response));

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
            return BuildFallbackGuidance(label, category);
        }
        catch (JsonException exception)
        {
            throw new InvalidOperationException($"Bedrock returned invalid guidance JSON: {text}", exception);
        }
    }

    private static BedrockGuidanceDto BuildFallbackGuidance(string label, string category)
    {
        return category switch
        {
            "Recyclable" => new BedrockGuidanceDto(
                $"Rửa sạch {label.ToLowerInvariant()} rồi bỏ vào thùng tái chế màu xanh.",
                $"Con có thể dùng {label.ToLowerInvariant()} để làm đồ thủ công hoặc chậu cây nhỏ.",
                "Tái chế giúp tiết kiệm tài nguyên và giảm rác thải ra môi trường."),
            "Organic" => new BedrockGuidanceDto(
                $"Bỏ {label.ToLowerInvariant()} vào thùng rác hữu cơ màu nâu.",
                "Rác hữu cơ có thể ủ thành phân bón cho cây.",
                "Ủ rác hữu cơ giúp đất khỏe hơn và giảm mùi hôi từ rác sinh hoạt."),
            "Hazardous" => new BedrockGuidanceDto(
                $"Không tự xử lý {label.ToLowerInvariant()}; hãy nhờ người lớn mang đến điểm thu gom rác nguy hại.",
                "Không nên tái sử dụng rác nguy hại để chơi hoặc làm đồ thủ công.",
                "Rác nguy hại có thể làm bẩn đất, nước và gây hại cho sức khỏe."),
            _ => new BedrockGuidanceDto(
                $"Bỏ {label.ToLowerInvariant()} vào thùng rác thường màu xám.",
                "Nếu vật còn sạch và dùng được, con có thể hỏi người lớn trước khi bỏ đi.",
                "Phân loại đúng giúp rác được xử lý an toàn hơn.")
        };
    }

    private static string BuildPrompt(string label, string category)
    {
        return $$"""
Detected object: {{label}}

Waste category: {{category}}

Generate in Vietnamese:
1. Recycling instruction
2. Reuse suggestion
3. Environmental impact

Return concise responses suitable for children aged 6-12.
Return only valid JSON with exactly these camelCase fields:
{
  "recycleGuide": "...",
  "reuseSuggestion": "...",
  "environmentImpact": "..."
}
""";
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
