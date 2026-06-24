using GreenLens.Infrastructure.AWS.Bedrock;
using Xunit;

namespace GreenLens.UnitTests.AiCamera;

public sealed class AiCameraFallbackGuidanceTests
{
    [Fact]
    public void Build_UsesSafetyFallbackBeforeReuseSuggestion()
    {
        var guidance = AiCameraFallbackGuidance.Build("Battery", "Hazardous");

        Assert.Contains("người lớn", guidance.RecycleGuide);
        Assert.Contains("Không dùng", guidance.ReuseSuggestion);
        Assert.Contains("nguy hại", guidance.EnvironmentImpact);
    }

    [Fact]
    public void Build_ReturnsObjectSpecificReuseForPaper()
    {
        var guidance = AiCameraFallbackGuidance.Build("Paper", "Recyclable");

        Assert.Contains("máy bay giấy", guidance.ReuseSuggestion);
        Assert.Contains("thùng tái chế", guidance.RecycleGuide);
    }

    [Fact]
    public void Build_ReturnsCategoryFallbackForUnknownRecyclableObject()
    {
        var guidance = AiCameraFallbackGuidance.Build("Cup", "Recyclable");

        Assert.Contains("thùng tái chế", guidance.RecycleGuide);
        Assert.Contains("đồ thủ công", guidance.ReuseSuggestion);
    }

    [Fact]
    public void Build_ReturnsNonRecyclableFallbackForUnknownObject()
    {
        var guidance = AiCameraFallbackGuidance.Build("Sneaker", "Non-Recyclable");

        Assert.Contains("thùng rác thường", guidance.RecycleGuide);
        Assert.Contains("an toàn", guidance.ReuseSuggestion);
    }
}
