using GreenLens.Api.Interfaces;
using GreenLens.Api.Models;

namespace GreenLens.Api.Services.Mocks;

public class MockQuizService : IQuizService
{
    public Task<IReadOnlyList<QuizQuestion>> GenerateQuizAsync(string category)
    {
        var key = string.IsNullOrWhiteSpace(category) ? "recycle" : category.Trim().ToLowerInvariant();

        IReadOnlyList<QuizQuestion> questions = key switch
        {
            "organic" or "hữu cơ" or "huu-co" => OrganicQuestions,
            "hazardous" or "nguy hại" or "nguy-hai" => HazardQuestions,
            _ => RecycleQuestions
        };

        return Task.FromResult(questions);
    }

    private static readonly IReadOnlyList<QuizQuestion> RecycleQuestions =
    [
        new()
        {
            Id = 1,
            Emoji = "🍶",
            Question = "Chai nhựa nên bỏ vào thùng rác màu gì?",
            Options = ["♻️ Tái chế", "🌿 Hữu cơ", "☠️ Nguy hại"],
            CorrectIndex = 0,
            Tip = "Chai nhựa có thể tái chế thành sản phẩm mới!"
        },
        new()
        {
            Id = 2,
            Emoji = "📦",
            Question = "Thùng carton thuộc loại rác nào?",
            Options = ["♻️ Tái chế", "🌿 Hữu cơ", "☠️ Nguy hại"],
            CorrectIndex = 0,
            Tip = "Giấy và carton là vật liệu tái chế phổ biến."
        },
        new()
        {
            Id = 3,
            Emoji = "🫙",
            Question = "Lọ thủy tinh sạch nên xử lý thế nào?",
            Options = ["♻️ Tái chế", "🌿 Hữu cơ", "🗑️ Thùng thường"],
            CorrectIndex = 0,
            Tip = "Thủy tinh có thể nung chảy và tái sử dụng nhiều lần."
        }
    ];

    private static readonly IReadOnlyList<QuizQuestion> OrganicQuestions =
    [
        new()
        {
            Id = 1,
            Emoji = "🍎",
            Question = "Vỏ táo thối nên bỏ đâu?",
            Options = ["🌿 Hữu cơ", "♻️ Tái chế", "☠️ Nguy hại"],
            CorrectIndex = 0,
            Tip = "Rác hữu cơ giúp đất màu mỡ hơn!"
        },
        new()
        {
            Id = 2,
            Emoji = "🍌",
            Question = "Vỏ chuối thuộc nhóm nào?",
            Options = ["🌿 Hữu cơ", "♻️ Tái chế", "☠️ Nguy hại"],
            CorrectIndex = 0,
            Tip = "Thực phẩm tự nhiên phân hủy trong đất."
        },
        new()
        {
            Id = 3,
            Emoji = "🍃",
            Question = "Lá khô trong vườn nên làm gì?",
            Options = ["🌿 Ủ compost", "♻️ Tái chế", "☠️ Nguy hại"],
            CorrectIndex = 0,
            Tip = "Lá khô là nguồn dinh dưỡng tuyệt vời cho compost."
        }
    ];

    private static readonly IReadOnlyList<QuizQuestion> HazardQuestions =
    [
        new()
        {
            Id = 1,
            Emoji = "🔋",
            Question = "Pin cũ nên xử lý ra sao?",
            Options = ["☠️ Thu gom riêng", "♻️ Tái chế", "🌿 Hữu cơ"],
            CorrectIndex = 0,
            Tip = "Pin chứa hóa chất độc — không vứt thùng thường!"
        },
        new()
        {
            Id = 2,
            Emoji = "🎨",
            Question = "Sơn và hóa chất cũ thuộc loại nào?",
            Options = ["☠️ Nguy hại", "♻️ Tái chế", "🌿 Hữu cơ"],
            CorrectIndex = 0,
            Tip = "Hóa chất cần điểm thu gom nguy hại an toàn."
        },
        new()
        {
            Id = 3,
            Emoji = "💉",
            Question = "Kim tiêm y tế (đã dùng) phải làm gì?",
            Options = ["☠️ Thu gom y tế", "♻️ Tái chế", "🗑️ Thùng thường"],
            CorrectIndex = 0,
            Tip = "Vật sắc nhọn y tế rất nguy hiểm — cần xử lý chuyên biệt."
        }
    ];
}
