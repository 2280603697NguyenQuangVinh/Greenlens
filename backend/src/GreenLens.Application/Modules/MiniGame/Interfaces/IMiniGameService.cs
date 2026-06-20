using GreenLens.Application.Modules.MiniGame.DTOs;

namespace GreenLens.Application.Modules.MiniGame.Interfaces;

public interface IMiniGameService
{
    Task<CompleteMiniGameResponse> CompleteAsync(
        CompleteMiniGameRequest request,
        CancellationToken cancellationToken = default);
}
