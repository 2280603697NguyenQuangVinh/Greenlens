using GreenLens.Application.Models;

namespace GreenLens.Application.Interfaces;

public interface IMiniGameChildProfileRepository
{
    Task<ChildGameProfile?> GetByChildIdAsync(string childId, CancellationToken cancellationToken = default);
    Task UpdateProgressAsync(string childId, int xp, int level, int streak, CancellationToken cancellationToken = default);
}
