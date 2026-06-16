using GreenLens.Application.Modules.AiCamera.DTOs;

namespace GreenLens.Application.Modules.AiCamera.Interfaces;

public interface IAiCameraUsageLimiter
{
    Task<AiCameraUsageQuotaResult> CheckAndConsumeAsync(
        string cognitoSub,
        string childId,
        CancellationToken cancellationToken = default);
}
