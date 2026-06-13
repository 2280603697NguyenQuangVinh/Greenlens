using GreenLens.Application.Modules.AiCamera.DTOs;

namespace GreenLens.Application.Modules.AiCamera.Interfaces;

public interface IAiCameraService
{
    Task<AiCameraAnalyzeResponse> AnalyzeAsync(
        AiCameraAnalyzeRequest request,
        CancellationToken cancellationToken = default);
}
