using GreenLens.Application.Modules.MiniGames.DTOs;

namespace GreenLens.Application.Modules.MiniGames.Interfaces;

public interface IMiniGameService
{
    Task<TrashSortItemsResponse> GetTrashSortItemsAsync(
        string cognitoSub,
        CancellationToken cancellationToken = default);

    Task<SubmitTrashSortResultResponse> SubmitTrashSortResultAsync(
        SubmitTrashSortResultRequest request,
        string cognitoSub,
        CancellationToken cancellationToken = default);
}
