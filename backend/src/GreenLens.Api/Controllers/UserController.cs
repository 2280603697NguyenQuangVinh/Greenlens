using GreenLens.Application.DTOs;
using GreenLens.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace GreenLens.Api.Controllers;

[ApiController]
[Route("child-profiles")]
public sealed class UserController(
    IChildProfileService childProfileService,
    ILogger<UserController> logger) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public ActionResult Get()
    {
        logger.LogWarning("GET /child-profiles called without childId");
        return BadRequest(new { error = "childId is required. Use GET /child-profiles/{childId}." });
    }

    [HttpGet("{childId}")]
    [ProducesResponseType(typeof(ChildProfileDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ChildProfileDto>> GetByChildId(string childId, CancellationToken cancellationToken)
    {
        logger.LogInformation("GET /child-profiles/{ChildId}", childId);
        var profile = await childProfileService.GetProfileAsync(childId, cancellationToken);
        if (profile is null)
        {
            logger.LogWarning("Child profile not found for childId '{ChildId}'", childId);
            return NotFound(new { error = $"Child profile not found for childId '{childId}'." });
        }

        return Ok(profile);
    }

    [HttpPost]
    [ProducesResponseType(typeof(ChildProfileDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<ChildProfileDto>> Create(
        [FromBody] AvatarConfigDto request,
        CancellationToken cancellationToken)
    {
        if (request is null)
        {
            logger.LogWarning("POST /child-profiles request body is null");
            return BadRequest(new { error = "Request body is required and must contain AvatarConfigDto fields." });
        }

        if (!ModelState.IsValid)
        {
            logger.LogWarning("POST /child-profiles validation failed: {ModelStateErrors}", ModelState);
            return ValidationProblem(ModelState);
        }

        logger.LogInformation("POST /child-profiles request received: CharacterName={CharacterName}, Gender={Gender}, Hair={Hair}, Eyes={Eyes}, Outfit={Outfit}",
            request.CharacterName,
            request.Gender,
            request.Hair,
            request.Eyes,
            request.Outfit);

        try
        {
            var createdProfile = await childProfileService.CreateProfileAsync(request, cancellationToken);
            return CreatedAtAction(nameof(GetByChildId), new { childId = createdProfile.ChildId }, createdProfile);
        }
        catch (ArgumentException argumentException)
        {
            logger.LogWarning(argumentException, "POST /child-profiles bad request");
            return BadRequest(new { error = argumentException.Message });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "POST /child-profiles unexpected error");
            return StatusCode(StatusCodes.Status500InternalServerError, new { error = "Unexpected server error.", detail = ex.Message });
        }
    }
}
