using GreenLens.Application.Modules.AiCamera.DTOs;

namespace GreenLens.Application.Modules.AiCamera.Interfaces;

public interface IRekognitionService
{
    Task<RekognitionDetectionDto> DetectLabelsAsync(
        Stream imageStream,
        CancellationToken cancellationToken = default);
}
