using GreenLens.Application.Modules.ChildProfiles.DTOs;

namespace GreenLens.Application.Modules.ChildProfiles.Interfaces;

public interface IChildProfileService
{
    Task<ChildProfileResponse> CreateAsync(
        CreateChildProfileRequest request,
        string? cognitoSub = null,
        CancellationToken cancellationToken = default);

    Task<ChildProfileResponse> GetAsync(
        string childId,
        string cognitoSub,
        CancellationToken cancellationToken = default);

    Task<ChildProfileResponse> RestoreSessionAsync(
        string childId,
        string deviceId,
        string? cognitoSub = null,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<LeaderboardEntryDto>> GetLeaderboardAsync(
        string? currentChildId,
        int limit = 10,
        CancellationToken cancellationToken = default);

    Task<ChildStreakResponse> GetStreakAsync(
        string childId,
        string cognitoSub,
        CancellationToken cancellationToken = default);

    Task<ChildStreakResponse> CheckInStreakAsync(
        string childId,
        string cognitoSub,
        CancellationToken cancellationToken = default);
}
