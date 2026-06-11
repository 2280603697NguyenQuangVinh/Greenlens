using GreenLens.Application.Modules.ChildProfiles.DTOs;

namespace GreenLens.Application.Modules.ChildProfiles.Validators;

public sealed class CreateChildProfileValidator
{
    private const int MaxFieldLength = 100;

    public IReadOnlyList<string> Validate(CreateChildProfileRequest? request)
    {
        if (request is null)
        {
            return ["Request body is required."];
        }

        var errors = new List<string>();
        Require(request.CharacterName, "characterName", errors);
        Require(request.Gender, "gender", errors);
        Require(request.Hair, "hair", errors);
        Require(request.Eyes, "eyes", errors);
        Require(request.Outfit, "outfit", errors);
        Require(request.AvatarPreview, "avatarPreview", errors);

        return errors;
    }

    private static void Require(string? value, string fieldName, ICollection<string> errors)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            errors.Add($"{fieldName} is required.");
            return;
        }

        if (value.Length > MaxFieldLength)
        {
            errors.Add($"{fieldName} must be {MaxFieldLength} characters or fewer.");
        }
    }
}
