using GreenLens.Application.DTOs;
using GreenLens.Application.Interfaces;
using GreenLens.Domain.Entities;
using GreenLens.Domain.Interfaces;
using Microsoft.Extensions.Logging;

namespace GreenLens.Application.Services;

public sealed class CloudUserProfileService(
    IChildProfileRepository childProfileRepository,
    ILogger<CloudUserProfileService> logger) : IChildProfileService
{
    public async Task<ChildProfileDto> CreateProfileAsync(AvatarConfigDto request, CancellationToken cancellationToken = default)
    {
        logger.LogInformation("Creating child profile for CharacterName={CharacterName}, Gender={Gender}", request.CharacterName, request.Gender);

        Validate(request);

        var profile = new ChildProfile
        {
            ChildId = $"child_{Guid.NewGuid():N}",
            CharacterName = request.CharacterName.Trim(),
            Gender = request.Gender.Trim(),
            Hair = request.Hair.Trim(),
            Eyes = request.Eyes.Trim(),
            Outfit = request.Outfit.Trim(),
            AvatarPreview = request.AvatarPreview.Trim(),
            Xp = 0,
            Level = 1,
            Streak = 0,
            Badges = [],
            Rewards = [],
            CreatedAt = DateTime.UtcNow
        };

        var createdProfile = await childProfileRepository.CreateProfileAsync(profile, cancellationToken);
        logger.LogInformation("Child profile created successfully: ChildId={ChildId}", createdProfile.ChildId);
        return MapToDto(createdProfile);
    }

    public async Task<ChildProfileDto?> GetProfileAsync(string childId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(childId))
        {
            throw new ArgumentException("childId is required.", nameof(childId));
        }

        var profile = await childProfileRepository.GetByChildIdAsync(childId, cancellationToken);
        return profile is null ? null : MapToDto(profile);
    }

    private static void Validate(AvatarConfigDto request)
    {
        if (string.IsNullOrWhiteSpace(request.CharacterName))
        {
            throw new ArgumentException("characterName is required.", nameof(request.CharacterName));
        }

        if (string.IsNullOrWhiteSpace(request.Gender))
        {
            throw new ArgumentException("gender is required.", nameof(request.Gender));
        }

        if (string.IsNullOrWhiteSpace(request.Hair))
        {
            throw new ArgumentException("hair is required.", nameof(request.Hair));
        }

        if (string.IsNullOrWhiteSpace(request.Eyes))
        {
            throw new ArgumentException("eyes is required.", nameof(request.Eyes));
        }

        if (string.IsNullOrWhiteSpace(request.Outfit))
        {
            throw new ArgumentException("outfit is required.", nameof(request.Outfit));
        }

        if (string.IsNullOrWhiteSpace(request.AvatarPreview))
        {
            throw new ArgumentException("avatarPreview is required.", nameof(request.AvatarPreview));
        }
    }

    private static ChildProfileDto MapToDto(ChildProfile profile)
    {
        return new ChildProfileDto
        {
            ChildId = profile.ChildId,
            CharacterName = profile.CharacterName,
            Gender = profile.Gender,
            Hair = profile.Hair,
            Eyes = profile.Eyes,
            Outfit = profile.Outfit,
            AvatarPreview = profile.AvatarPreview,
            Xp = profile.Xp,
            Level = profile.Level,
            Streak = profile.Streak,
            Badges = profile.Badges,
            Rewards = profile.Rewards,
            CreatedAt = profile.CreatedAt
        };
    }
}
