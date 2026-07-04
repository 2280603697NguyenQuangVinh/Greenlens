namespace GreenLens.Api.Admin;

public interface IAdminService
{
    Task<AdminOverviewResponse> GetOverviewAsync(CancellationToken cancellationToken = default);
    Task<AdminChildListResponse> GetChildrenAsync(string? search, string? status, CancellationToken cancellationToken = default);
    Task<AdminChildDetailDto> GetChildAsync(string childId, CancellationToken cancellationToken = default);
    Task ArchiveChildAsync(string childId, string adminSub, CancellationToken cancellationToken = default);
    Task LockChildAsync(string childId, string adminSub, CancellationToken cancellationToken = default);
    Task UnlockChildAsync(string childId, string adminSub, CancellationToken cancellationToken = default);
    Task ResetChildStreakAsync(string childId, string adminSub, CancellationToken cancellationToken = default);
    Task AdjustChildXpAsync(string childId, string adminSub, int xp, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<AdminQuizFallbackDto>> GetQuizFallbacksAsync(CancellationToken cancellationToken = default);
    Task<AdminQuizFallbackDto> SaveQuizFallbackAsync(AdminSaveQuizFallbackRequest request, string adminSub, CancellationToken cancellationToken = default);
    Task ArchiveQuizFallbackAsync(string fallbackKey, string adminSub, CancellationToken cancellationToken = default);
    Task<AdminQuizPoolListResponse> GetQuizPoolAsync(CancellationToken cancellationToken = default);
    Task TriggerQuizPoolRefillAsync(string adminSub, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<AdminAiCameraRecordDto>> GetAiCameraClassificationsAsync(CancellationToken cancellationToken = default);
    Task<AdminMiniGameItemsResponse> GetMiniGameItemsAsync(CancellationToken cancellationToken = default);
    Task<AdminMiniGameItemDto> SaveMiniGameItemAsync(AdminSaveMiniGameItemRequest request, string adminSub, CancellationToken cancellationToken = default);
    Task ArchiveMiniGameItemAsync(string itemId, string adminSub, CancellationToken cancellationToken = default);
}
