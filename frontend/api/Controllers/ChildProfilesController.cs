using Microsoft.AspNetCore.Mvc;

namespace GreenLens.Api.Controllers;

/// <summary>
/// LOCAL DEV MOCK — for frontend integration testing only.
/// Replace with real DynamoDB implementation when backend team is ready.
/// </summary>
[ApiController]
[Route("child-profiles")]
public class ChildProfilesController : ControllerBase
{
    [HttpPost]
    public ActionResult<ChildProfileResponse> Create([FromBody] CreateChildProfileRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.CharacterName))
        {
            return BadRequest(new { message = "Character Name is required" });
        }

        var childId = $"child_{Guid.NewGuid():N}";

        return Ok(new ChildProfileResponse
        {
            ChildId = childId,
            CharacterName = request.CharacterName.Trim(),
            Gender = request.Gender,
            Hair = request.Hair,
            Eyes = request.Eyes,
            Outfit = request.Outfit,
            Xp = 0,
            Level = 1,
            Streak = 0,
            Badges = [],
            Rewards = [],
        });
    }
}

public record CreateChildProfileRequest(
    string CharacterName,
    string Gender,
    string Hair,
    string Eyes,
    string Outfit,
    string AvatarPreview);

public record ChildProfileResponse
{
    public string ChildId { get; init; } = string.Empty;
    public string CharacterName { get; init; } = string.Empty;
    public string Gender { get; init; } = string.Empty;
    public string Hair { get; init; } = string.Empty;
    public string Eyes { get; init; } = string.Empty;
    public string Outfit { get; init; } = string.Empty;
    public int Xp { get; init; }
    public int Level { get; init; }
    public int Streak { get; init; }
    public List<string> Badges { get; init; } = [];
    public List<string> Rewards { get; init; } = [];
}
