using GreenLens.Api.Interfaces;
using GreenLens.Api.Models;

namespace GreenLens.Api.Services.Mocks;

public class MockAiScannerService : IAiScannerService
{
    private static readonly ClassificationResult DefaultResult = new()
    {
        Label = "Chai nhựa",
        Emoji = "🍶",
        Category = "Tái chế",
        CategoryKey = "recycle",
        BinColor = "Xanh lá",
        CategoryColor = "#2563EB",
        BackgroundColor = "#DBEAFE",
        Guide = "Rửa sạch chai, sau đó bỏ vào thùng tái chế màu xanh. ♻️",
        Confidence = 0.92,
        XpEarned = 10
    };

    public Task<ClassificationResult> AnalyzeImageAsync(string base64Image)
    {
        _ = base64Image;
        return Task.FromResult(DefaultResult);
    }
}
