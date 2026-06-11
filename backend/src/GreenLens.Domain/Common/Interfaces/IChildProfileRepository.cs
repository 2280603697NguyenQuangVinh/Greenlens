using GreenLens.Domain.Modules.ChildProfiles.Entities;

namespace GreenLens.Domain.Common.Interfaces;

public interface IChildProfileRepository
{
    Task SaveAsync(ChildProfile profile, CancellationToken cancellationToken = default);
}
