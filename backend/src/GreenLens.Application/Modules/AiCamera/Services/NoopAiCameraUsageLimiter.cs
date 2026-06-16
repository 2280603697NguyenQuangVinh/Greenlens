using GreenLens.Application.Modules.AiCamera.DTOs;
using GreenLens.Application.Modules.AiCamera.Interfaces;

namespace GreenLens.Application.Modules.AiCamera.Services;

public sealed class NoopAiCameraUsageLimiter : IAiCameraUsageLimiter
{
    public Task<AiCameraUsageQuotaResult> CheckAndConsumeAsync(
        string cognitoSub,
        string childId,
        CancellationToken cancellationToken = default)
    {
        return Task.FromResult(new AiCameraUsageQuotaResult(true));
    }
}
