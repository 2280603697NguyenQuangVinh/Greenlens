using GreenLens.Application.Modules.Quiz.DTOs;

namespace GreenLens.Infrastructure.AWS.DynamoDB;

internal static class BuiltInFallbacks
{
    private static readonly IReadOnlyList<QuizQuestionDto> Recyclable =
    [
        new("Giấy sạch nên bỏ vào thùng nào?", ["Thùng xanh", "Thùng đỏ", "Thùng nâu", "Thùng rác thường"], "Thùng xanh", "Giấy sạch có thể tái chế nên bỏ vào thùng xanh."),
        new("Chai nhựa trước khi tái chế nên làm gì?", ["Rửa sạch", "Đổ đầy nước", "Vứt xuống đất", "Bóp với đồ ăn thừa"], "Rửa sạch", "Rửa sạch giúp chai dễ được tái chế hơn."),
        new("Lon nhôm sạch có thể làm gì?", ["Tái chế", "Chôn trong đất", "Bỏ vào ao", "Trộn với vỏ chuối"], "Tái chế", "Kim loại có thể tái chế để tiết kiệm tài nguyên.")
    ];

    private static readonly IReadOnlyList<QuizQuestionDto> Organic =
    [
        new("Vỏ chuối thuộc loại rác nào?", ["Hữu cơ", "Nguy hại", "Kim loại", "Thủy tinh"], "Hữu cơ", "Vỏ chuối phân hủy được và có thể ủ làm phân."),
        new("Rác hữu cơ có thể giúp cây bằng cách nào?", ["Làm phân ủ", "Làm pin", "Làm nhựa", "Làm lon kim loại"], "Làm phân ủ", "Ủ rác hữu cơ giúp tạo chất dinh dưỡng cho đất."),
        new("Thùng màu nâu thường dành cho gì?", ["Rác hữu cơ", "Pin cũ", "Giấy sạch", "Chai thủy tinh"], "Rác hữu cơ", "Màu nâu thường dùng cho rác dễ phân hủy.")
    ];

    private static readonly IReadOnlyList<QuizQuestionDto> Hazardous =
    [
        new("Pin cũ nên xử lý thế nào?", ["Đưa người lớn mang đến điểm thu gom", "Bỏ vào thùng thường", "Ném ra sân", "Cho vào chậu cây"], "Đưa người lớn mang đến điểm thu gom", "Pin có chất nguy hại nên cần người lớn xử lý đúng chỗ."),
        new("Vì sao không chơi với pin cũ?", ["Có thể rò chất độc", "Vì pin biết bay", "Vì pin là thức ăn", "Vì pin là đồ uống"], "Có thể rò chất độc", "Pin cũ có thể gây hại cho sức khỏe và môi trường."),
        new("Rác nguy hại thường bỏ vào thùng màu gì?", ["Đỏ", "Xanh", "Nâu", "Trắng"], "Đỏ", "Màu đỏ nhắc chúng ta cẩn thận với rác nguy hại.")
    ];

    private static readonly IReadOnlyList<QuizQuestionDto> Trash =
    [
        new("Tã đã dùng nên bỏ ở đâu?", ["Thùng rác thường", "Thùng giấy sạch", "Chậu cây", "Thùng tái chế"], "Thùng rác thường", "Tã đã dùng không tái chế được và cần bỏ kín vào rác thường."),
        new("Rác bẩn không tái chế được nên làm gì?", ["Bỏ đúng thùng xám", "Trộn với giấy sạch", "Để trên bàn", "Bỏ vào thùng hữu cơ"], "Bỏ đúng thùng xám", "Phân loại đúng giúp nơi ở sạch sẽ hơn."),
        new("Khi không chắc rác có an toàn không, con nên làm gì?", ["Nhờ người lớn kiểm tra", "Tự tháo ra", "Đưa cho em bé", "Ném ra đường"], "Nhờ người lớn kiểm tra", "Người lớn giúp xử lý vật không rõ an toàn.")
    ];

    public static IReadOnlyList<QuizQuestionDto> GetQuestions(string wasteType)
    {
        if (wasteType.Contains("battery", StringComparison.OrdinalIgnoreCase) ||
            wasteType.Contains("hazard", StringComparison.OrdinalIgnoreCase) ||
            wasteType.Contains("pin", StringComparison.OrdinalIgnoreCase))
        {
            return Hazardous;
        }

        if (wasteType.Contains("food", StringComparison.OrdinalIgnoreCase) ||
            wasteType.Contains("banana", StringComparison.OrdinalIgnoreCase) ||
            wasteType.Contains("organic", StringComparison.OrdinalIgnoreCase))
        {
            return Organic;
        }

        if (wasteType.Contains("paper", StringComparison.OrdinalIgnoreCase) ||
            wasteType.Contains("plastic", StringComparison.OrdinalIgnoreCase) ||
            wasteType.Contains("bottle", StringComparison.OrdinalIgnoreCase) ||
            wasteType.Contains("recycl", StringComparison.OrdinalIgnoreCase) ||
            wasteType.Contains("can", StringComparison.OrdinalIgnoreCase))
        {
            return Recyclable;
        }

        return Trash;
    }
}
