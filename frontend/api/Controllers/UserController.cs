using GreenLens.Api.Interfaces;
using GreenLens.Api.Models;
using Microsoft.AspNetCore.Mvc;

namespace GreenLens.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UserController : ControllerBase
{
    private readonly IUserProfileService _profiles;

    public UserController(IUserProfileService profiles)
    {
        _profiles = profiles;
    }

    [HttpGet("profile")]
    public async Task<ActionResult<UserProfile>> GetProfile()
    {
        var badgeId = _profiles.ExtractBadgeIdFromToken(Request.Headers.Authorization);
        if (string.IsNullOrEmpty(badgeId))
        {
            return Unauthorized(new { message = "Missing or invalid token." });
        }

        var profile = await _profiles.GetByBadgeIdAsync(badgeId);
        if (profile is null)
        {
            return NotFound(new { message = "User not found." });
        }

        return Ok(profile);
    }
}
