using GreenLens.Application.Modules.AiCamera.DTOs;
using GreenLens.Application.Modules.AiCamera.WasteMapping;
using Xunit;

namespace GreenLens.UnitTests.AiCamera;

public sealed class WasteImageValidatorTests
{
    [Theory]
    [InlineData("Body Part")]
    [InlineData("Hand")]
    [InlineData("Face")]
    [InlineData("Person")]
    [InlineData("Dog")]
    [InlineData("Cat")]
    [InlineData("Bird")]
    public void Validate_BlockedLabels_ReturnsInvalid(string label)
    {
        var validator = new WasteImageValidator();
        var detection = Detection((label, 99));

        var result = validator.Validate(detection);

        Assert.False(result.IsValid);
        Assert.Equal("not_waste_image", result.Reason);
        Assert.Equal(label, result.TopLabel?.Label);
    }

    [Theory]
    [InlineData("Bottle")]
    [InlineData("Plastic Bottle")]
    [InlineData("Paper")]
    [InlineData("Battery")]
    [InlineData("Banana Peel")]
    public void Validate_SupportedWasteLabels_ReturnsValid(string label)
    {
        var validator = new WasteImageValidator();
        var detection = Detection((label, 92));

        var result = validator.Validate(detection);

        Assert.True(result.IsValid);
        Assert.Equal(label, result.MatchedLabel?.Label);
    }

    [Fact]
    public void Validate_UnknownHighConfidenceLabel_ReturnsInvalid()
    {
        var validator = new WasteImageValidator();
        var detection = Detection(("Candle", 98));

        var result = validator.Validate(detection);

        Assert.False(result.IsValid);
        Assert.Equal("not_waste_image", result.Reason);
    }

    [Fact]
    public void Validate_LowConfidenceWasteLabel_ReturnsUncertain()
    {
        var validator = new WasteImageValidator();
        var detection = Detection(("Bottle", 62));

        var result = validator.Validate(detection);

        Assert.False(result.IsValid);
        Assert.Equal("uncertain_detection", result.Reason);
        Assert.Equal("Bottle", result.MatchedLabel?.Label);
    }

    [Theory]
    [InlineData("Hand", 99, "Plastic Bottle", 52)]
    [InlineData("Person", 98, "Can", 50)]
    public void Validate_HumanOccluderWithModerateWasteConfidence_ReturnsValid(
        string topLabel,
        double topConfidence,
        string wasteLabel,
        double wasteConfidence)
    {
        var validator = new WasteImageValidator();
        var detection = Detection((topLabel, topConfidence), (wasteLabel, wasteConfidence));

        var result = validator.Validate(detection);

        Assert.True(result.IsValid);
        Assert.Equal(wasteLabel, result.MatchedLabel?.Label);
        Assert.Equal(topLabel, result.TopLabel?.Label);
    }

    [Fact]
    public void Validate_HumanOccluderWithLowWasteConfidence_ReturnsUncertain()
    {
        var validator = new WasteImageValidator();
        var detection = Detection(("Hand", 99), ("Plastic", 38));

        var result = validator.Validate(detection);

        Assert.False(result.IsValid);
        Assert.Equal("uncertain_detection", result.Reason);
        Assert.Equal("Plastic", result.MatchedLabel?.Label);
    }

    [Fact]
    public void Validate_HumanOccluderWithHazardousWasteConfidence_ReturnsValid()
    {
        var validator = new WasteImageValidator();
        var detection = Detection(("Hand", 99), ("Battery", 55));

        var result = validator.Validate(detection);

        Assert.True(result.IsValid);
        Assert.Equal("Battery", result.MatchedLabel?.Label);
    }

    private static RekognitionDetectionDto Detection(params (string Label, double Confidence)[] labels)
    {
        var detectedLabels = labels
            .Select(label => new DetectedLabelDto(label.Label, label.Confidence))
            .ToArray();
        var topLabel = detectedLabels[0];
        return new RekognitionDetectionDto(topLabel.Label, topLabel.Confidence, detectedLabels);
    }
}
