using GreenLens.Domain.Modules.ChildProfiles.Entities;

namespace GreenLens.Domain.Common.Interfaces;

public interface IChildProfileRepository
{
    Task SaveAsync(ChildProfile profile, CancellationToken cancellationToken = default);

    Task<ChildProfile?> GetByIdAsync(string childId, CancellationToken cancellationToken = default);

    Task UpdateProgressAsync(
        string childId,
        int xp,
        int level,
        int streak,
        CancellationToken cancellationToken = default);
}
