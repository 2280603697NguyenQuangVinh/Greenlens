namespace GreenLens.Application.Modules.AiCamera.Services;

public sealed class AiCameraInvalidImageException : Exception
{
    public AiCameraInvalidImageException(
        string message,
        string reason,
        string? detectedLabel,
        double? confidence)
        : base(message)
    {
        Reason = reason;
        DetectedLabel = detectedLabel;
        Confidence = confidence;
    }

    public string Reason { get; }

    public string? DetectedLabel { get; }

    public double? Confidence { get; }
}
