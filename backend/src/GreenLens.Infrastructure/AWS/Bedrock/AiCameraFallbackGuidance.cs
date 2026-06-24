using GreenLens.Application.Modules.AiCamera.DTOs;

namespace GreenLens.Infrastructure.AWS.Bedrock;

public static class AiCameraFallbackGuidance
{
    public static BedrockGuidanceDto Build(string label, string category)
    {
        var safeLabel = string.IsNullOrWhiteSpace(label) ? "vật này" : label.Trim();
        var normalizedLabel = safeLabel.ToLowerInvariant();

        if (IsUnsafe(normalizedLabel))
        {
            return new BedrockGuidanceDto(
                $"Không tự xử lý {normalizedLabel}; hãy nhờ người lớn bỏ vào điểm thu gom rác nguy hại hoặc nơi xử lý phù hợp.",
                "Không dùng vật này để chơi hoặc làm đồ thủ công vì có thể nguy hiểm.",
                "Xử lý đúng rác nguy hại giúp bảo vệ sức khỏe, đất và nguồn nước.");
        }

        if (ContainsAny(normalizedLabel, "paper", "cardboard", "newspaper", "book", "envelope", "folder"))
        {
            return new BedrockGuidanceDto(
                "Nếu giấy còn sạch, xếp phẳng rồi bỏ vào thùng tái chế màu xanh.",
                "Con có thể dùng giấy này để gấp máy bay giấy, làm origami hoặc dùng mặt sau làm giấy nháp.",
                "Tái chế giấy giúp tiết kiệm cây xanh, nước và năng lượng.");
        }

        if (ContainsAny(normalizedLabel, "bottle", "plastic bottle"))
        {
            return new BedrockGuidanceDto(
                "Rửa sạch chai, để khô rồi bỏ vào thùng tái chế màu xanh.",
                "Con có thể biến chai sạch thành chậu cây nhỏ, ống cắm bút hoặc bình tưới cây.",
                "Tái chế chai nhựa giúp giảm rác nhựa ngoài sông, biển và đường phố.");
        }

        if (ContainsAny(normalizedLabel, "plastic bag", "bag"))
        {
            return new BedrockGuidanceDto(
                "Nếu túi còn sạch, gom lại để tái sử dụng hoặc bỏ vào điểm thu gom phù hợp.",
                "Con có thể dùng túi sạch để lót thùng rác nhỏ hoặc đựng đồ khi cần.",
                "Dùng lại túi giúp giảm rác nhựa khó phân hủy.");
        }

        if (ContainsAny(normalizedLabel, "can", "aluminium", "aluminum", "tin"))
        {
            return new BedrockGuidanceDto(
                "Rửa sạch lon, ép gọn nếu an toàn rồi bỏ vào thùng tái chế màu xanh.",
                "Con có thể dùng lon sạch, không sắc cạnh, để làm hộp đựng bút cùng người lớn.",
                "Tái chế kim loại giúp tiết kiệm tài nguyên khai thác từ thiên nhiên.");
        }

        if (ContainsAny(normalizedLabel, "banana", "apple", "food", "vegetable", "fruit", "leaf", "bread", "egg", "peel"))
        {
            return new BedrockGuidanceDto(
                "Bỏ rác hữu cơ vào thùng màu nâu hoặc nơi ủ phân nếu gia đình có.",
                "Rác hữu cơ có thể được ủ thành phân bón cho cây thay vì tái sử dụng làm đồ chơi.",
                "Ủ rác hữu cơ giúp đất khỏe hơn và giảm lượng rác phải chôn lấp.");
        }

        if (ContainsAny(normalizedLabel, "diaper", "tissue", "napkin"))
        {
            return new BedrockGuidanceDto(
                "Bỏ vật đã bẩn vào túi kín rồi cho vào thùng rác thường màu xám.",
                "Vật đã bẩn không nên tái sử dụng; hãy rửa tay sạch sau khi xử lý.",
                "Bỏ đúng nơi giúp giữ vệ sinh và tránh mùi khó chịu.");
        }

        return category switch
        {
            "Recyclable" => new BedrockGuidanceDto(
                $"Nếu {normalizedLabel} còn sạch, hãy làm sạch rồi bỏ vào thùng tái chế màu xanh.",
                $"Nếu còn an toàn và sạch, con có thể dùng {normalizedLabel} làm đồ thủ công đơn giản.",
                "Tái chế giúp tiết kiệm tài nguyên và giảm rác thải ra môi trường."),
            "Organic" => new BedrockGuidanceDto(
                $"Bỏ {normalizedLabel} vào thùng rác hữu cơ màu nâu.",
                "Rác hữu cơ có thể ủ thành phân bón cho cây.",
                "Ủ rác hữu cơ giúp đất khỏe hơn và giảm mùi hôi từ rác sinh hoạt."),
            "Hazardous" => new BedrockGuidanceDto(
                $"Không tự xử lý {normalizedLabel}; hãy nhờ người lớn mang đến điểm thu gom rác nguy hại.",
                "Không nên tái sử dụng rác nguy hại để chơi hoặc làm đồ thủ công.",
                "Rác nguy hại có thể làm bẩn đất, nước và gây hại cho sức khỏe."),
            _ => new BedrockGuidanceDto(
                $"Bỏ {normalizedLabel} vào thùng rác thường màu xám.",
                "Nếu vật còn sạch và an toàn, con có thể dùng lại làm đồ thủ công đơn giản.",
                "Phân loại đúng giúp rác được xử lý an toàn hơn.")
        };
    }

    private static bool IsUnsafe(string normalizedLabel)
    {
        return ContainsAny(
            normalizedLabel,
            "battery",
            "medicine",
            "pill",
            "drug",
            "syringe",
            "needle",
            "chemical",
            "detergent",
            "paint",
            "oil",
            "glass",
            "broken",
            "knife",
            "blade",
            "razor",
            "light bulb",
            "lamp",
            "thermometer",
            "electronic",
            "phone",
            "laptop",
            "computer",
            "charger",
            "wire",
            "cable");
    }

    private static bool ContainsAny(string value, params string[] terms)
    {
        return terms.Any(term => value.Contains(term, StringComparison.OrdinalIgnoreCase));
    }
}
