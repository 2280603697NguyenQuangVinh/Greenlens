using GreenLens.Application.Modules.MiniGames.DTOs;

namespace GreenLens.Application.Modules.MiniGames.Interfaces;

public interface IMiniGameRepository
{
    Task<IReadOnlyList<MiniGameItemDto>> GetActiveItemsAsync(
        string gameType,
        CancellationToken cancellationToken = default);

    Task<int> GetBestScoreAsync(
        string childId,
        string gameType,
        CancellationToken cancellationToken = default);

    Task SaveResultAsync(
        MiniGameResultDto result,
        CancellationToken cancellationToken = default);
}
