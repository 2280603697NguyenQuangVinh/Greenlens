using GreenLens.Application.DTOs;
using GreenLens.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace GreenLens.Api.Controllers;

[ApiController]
[Route("child-profiles")]
public sealed class UserController(IChildProfileService childProfileService) : ControllerBase
{
    [HttpGet("{childId}")]
    [ProducesResponseType(typeof(ChildProfileDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ChildProfileDto>> GetByChildId(string childId, CancellationToken cancellationToken)
    {
        var profile = await childProfileService.GetProfileAsync(childId, cancellationToken);
        if (profile is null)
        {
            return NotFound(new { error = $"Child profile not found for childId '{childId}'." });
        }

        return Ok(profile);
    }

    [HttpPost]
    [ProducesResponseType(typeof(ChildProfileDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ChildProfileDto>> Create(
        [FromBody] AvatarConfigDto request,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        try
        {
            var createdProfile = await childProfileService.CreateProfileAsync(request, cancellationToken);
            return CreatedAtAction(nameof(GetByChildId), new { childId = createdProfile.ChildId }, createdProfile);
        }
        catch (ArgumentException argumentException)
        {
            return BadRequest(new { error = argumentException.Message });
        }
    }
}
