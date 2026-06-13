using GreenLens.Application.Modules.AiCamera.DTOs;

namespace GreenLens.Application.Modules.AiCamera.Interfaces;

public interface IBedrockGuidanceService
{
    Task<BedrockGuidanceDto> GenerateGuidanceAsync(
        string label,
        string category,
        CancellationToken cancellationToken = default);
}
