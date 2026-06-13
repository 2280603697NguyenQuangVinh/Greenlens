namespace GreenLens.Application.Modules.AiCamera.DTOs;

public sealed record DetectedLabelDto(
    string Label,
    double Confidence);

public sealed record WasteCategoryDto(
    string Category,
    string BinColor);

public sealed record BedrockGuidanceDto(
    string RecycleGuide,
    string ReuseSuggestion,
    string EnvironmentImpact);

public sealed record AiCameraAnalyzeResponse(
    string ChildId,
    string Label,
    double Confidence,
    string Category,
    string BinColor,
    string RecycleGuide,
    string ReuseSuggestion,
    string EnvironmentImpact,
    string S3ImageKey,
    string S3Url);
