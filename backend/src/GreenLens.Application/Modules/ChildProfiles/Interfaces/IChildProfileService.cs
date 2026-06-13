using GreenLens.Application.Modules.ChildProfiles.DTOs;

namespace GreenLens.Application.Modules.ChildProfiles.Interfaces;

public interface IChildProfileService
{
    Task<ChildProfileResponse> CreateAsync(
        CreateChildProfileRequest request,
        string? cognitoSub = null,
        CancellationToken cancellationToken = default);
}
