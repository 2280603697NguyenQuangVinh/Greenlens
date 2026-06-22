using GreenLens.Domain.Modules.ChildProfiles.Entities;

namespace GreenLens.Domain.Common.Interfaces;

public interface IChildProfileRepository
{
    Task SaveAsync(ChildProfile profile, CancellationToken cancellationToken = default);

    Task<ChildProfile?> GetAsync(
        string childId,
        CancellationToken cancellationToken = default);

    Task UpdateStreakAsync(
        string childId,
        string cognitoSub,
        int streak,
        string lastStreakDate,
        int streakFreezeDaysUsed,
        CancellationToken cancellationToken = default);
}
