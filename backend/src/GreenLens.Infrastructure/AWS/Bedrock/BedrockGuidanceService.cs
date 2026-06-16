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
            return BuildFallbackGuidance(label, category);
        }

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
                        MaxTokens = _options.MaxTokens,
                        Temperature = 0.1F
                    }
                },
                cancellationToken);
        }
        catch (AmazonServiceException exception) when (ShouldUseFallback(exception))
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
        if (ContainsAny(label, "paper", "cardboard"))
        {
            return new BedrockGuidanceDto(
                "Nếu giấy còn sạch, xếp phẳng rồi bỏ vào thùng tái chế màu xanh.",
                "Con có thể dùng giấy này để gấp máy bay giấy, làm origami hoặc dùng mặt sau làm giấy nháp.",
                "Tái chế giấy giúp tiết kiệm cây xanh, nước và năng lượng.");
        }

        if (ContainsAny(label, "bottle", "plastic bottle"))
        {
            return new BedrockGuidanceDto(
                "Rửa sạch chai, để khô rồi bỏ vào thùng tái chế màu xanh.",
                "Con có thể biến chai sạch thành chậu cây nhỏ, ống cắm bút hoặc bình tưới cây.",
                "Tái chế chai nhựa giúp giảm rác nhựa ngoài sông, biển và đường phố.");
        }

        if (ContainsAny(label, "plastic bag", "bag"))
        {
            return new BedrockGuidanceDto(
                "Nếu túi còn sạch, gom lại để tái sử dụng hoặc bỏ vào điểm thu gom phù hợp.",
                "Con có thể dùng túi sạch để lót thùng rác nhỏ hoặc đựng đồ khi cần.",
                "Dùng lại túi giúp giảm rác nhựa khó phân hủy.");
        }

        if (ContainsAny(label, "can", "aluminium"))
        {
            return new BedrockGuidanceDto(
                "Rửa sạch lon, ép gọn nếu an toàn rồi bỏ vào thùng tái chế màu xanh.",
                "Con có thể dùng lon sạch, không sắc cạnh, để làm hộp đựng bút cùng người lớn.",
                "Tái chế kim loại giúp tiết kiệm tài nguyên khai thác từ thiên nhiên.");
        }

        if (ContainsAny(label, "battery"))
        {
            return new BedrockGuidanceDto(
                "Không bỏ pin vào thùng rác thường; hãy nhờ người lớn mang đến điểm thu gom pin cũ.",
                "Không nên tái sử dụng pin cũ để chơi hoặc làm đồ thủ công.",
                "Pin có thể rò hóa chất làm bẩn đất, nước và gây hại cho sức khỏe.");
        }

        if (ContainsAny(label, "diaper"))
        {
            return new BedrockGuidanceDto(
                "Bỏ tã đã dùng vào túi kín rồi cho vào thùng rác thường màu xám.",
                "Tã đã dùng không nên tái sử dụng; hãy rửa tay sạch sau khi xử lý.",
                "Bỏ đúng nơi giúp giữ vệ sinh và tránh mùi khó chịu.");
        }

        return category switch
        {
            "Recyclable" => new BedrockGuidanceDto(
                $"Rửa sạch {label.ToLowerInvariant()} rồi bỏ vào thùng tái chế màu xanh.",
                $"Nếu còn sạch, con có thể dùng {label.ToLowerInvariant()} để làm đồ thủ công.",
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
                "Nếu vật còn sạch và an toàn, con có thể dùng lại làm đồ thủ công đơn giản.",
                "Phân loại đúng giúp rác được xử lý an toàn hơn.")
        };
    }

    private static bool ContainsAny(string value, params string[] terms)
    {
        return terms.Any(term => value.Contains(term, StringComparison.OrdinalIgnoreCase));
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
