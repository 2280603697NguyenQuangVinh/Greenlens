using GreenLens.Application.Modules.ChildProfiles.DTOs;
using GreenLens.Application.Modules.ChildProfiles.Interfaces;
using GreenLens.Application.Modules.ChildProfiles.Validators;
using GreenLens.Domain.Common.Interfaces;
using GreenLens.Domain.Modules.ChildProfiles.Entities;

namespace GreenLens.Application.Modules.ChildProfiles.Services;

public sealed class ChildProfileService(
    IChildProfileRepository childProfileRepository,
    IChildIdentityService childIdentityService,
    CreateChildProfileValidator validator) : IChildProfileService
{
    public async Task<ChildProfileResponse> CreateAsync(
        CreateChildProfileRequest request,
        CancellationToken cancellationToken = default)
    {
        var validationErrors = validator.Validate(request);
        if (validationErrors.Count > 0)
        {
            throw new ArgumentException(string.Join(" ", validationErrors));
        }

        var now = DateTime.UtcNow;
        var childId = $"child_{Guid.NewGuid():N}";
        var cognitoSub = await childIdentityService.CreateChildIdentityAsync(
            childId,
            request.CharacterName!.Trim(),
            cancellationToken);

        var profile = new ChildProfile
        {
            ChildId = childId,
            CognitoSub = cognitoSub,
            CharacterName = request.CharacterName!.Trim(),
            Gender = request.Gender!.Trim(),
            Hair = request.Hair!.Trim(),
            Eyes = request.Eyes!.Trim(),
            Outfit = request.Outfit!.Trim(),
            AvatarPreview = request.AvatarPreview!.Trim(),
            Xp = 0,
            Level = 1,
            Streak = 0,
            Badges = [],
            Rewards = [],
            CreatedAt = now,
            UpdatedAt = now
        };

        await childProfileRepository.SaveAsync(profile, cancellationToken);

        return new ChildProfileResponse(
            profile.ChildId,
            profile.CognitoSub,
            profile.CharacterName,
            profile.Gender,
            profile.Hair,
            profile.Eyes,
            profile.Outfit,
            profile.AvatarPreview,
            profile.Xp,
            profile.Level,
            profile.Streak,
            profile.Badges,
            profile.Rewards,
            profile.CreatedAt,
            profile.UpdatedAt);
    }
}
