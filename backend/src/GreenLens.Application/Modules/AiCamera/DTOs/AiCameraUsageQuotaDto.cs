namespace GreenLens.Application.Modules.AiCamera.DTOs;

public sealed record AiCameraUsageQuotaResult(
    bool Allowed,
    string? Message = null);
