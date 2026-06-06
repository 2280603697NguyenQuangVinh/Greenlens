using GreenLens.Domain.Entities;

namespace GreenLens.Domain.Interfaces;

public interface IChildProfileRepository
{
    Task<ChildProfile> CreateProfileAsync(ChildProfile profile, CancellationToken cancellationToken = default);
    Task<ChildProfile?> GetByChildIdAsync(string childId, CancellationToken cancellationToken = default);
}
