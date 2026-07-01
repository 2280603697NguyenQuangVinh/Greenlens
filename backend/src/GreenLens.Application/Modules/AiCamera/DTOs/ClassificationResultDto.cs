namespace GreenLens.Application.Modules.AiCamera.DTOs;

public sealed record DetectedLabelDto(
    string Label,
    double Confidence);

public sealed record RekognitionDetectionDto(
    string Label,
    double Confidence,
    IReadOnlyList<DetectedLabelDto> Labels);

public sealed record WasteCategoryDto(
    string Category,
    string BinColor);

public sealed record WasteImageValidationResult(
    bool IsValid,
    string Reason,
    DetectedLabelDto? MatchedLabel,
    DetectedLabelDto? TopLabel);

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
