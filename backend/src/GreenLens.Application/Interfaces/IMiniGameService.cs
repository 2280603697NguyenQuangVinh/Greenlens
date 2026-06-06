using GreenLens.Application.DTOs;

namespace GreenLens.Application.Interfaces;

public interface IMiniGameService
{
    Task<MiniGameCompletionResponseDto> CompleteAsync(
        MiniGameCompletionRequestDto request,
        CancellationToken cancellationToken = default);
}
