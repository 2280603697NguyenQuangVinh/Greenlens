using GreenLens.Application.DTOs;

namespace GreenLens.Application.Interfaces;

public interface IChildProfileService
{
    Task<ChildProfileDto> CreateProfileAsync(AvatarConfigDto request, CancellationToken cancellationToken = default);
    Task<ChildProfileDto?> GetProfileAsync(string childId, CancellationToken cancellationToken = default);
}
