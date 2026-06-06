using GreenLens.Application.DTOs;
using GreenLens.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace GreenLens.Api.Controllers;

[ApiController]
[Route("mini-game")]
public sealed class GameController(IMiniGameService miniGameService) : ControllerBase
{
    [HttpPost("complete")]
    [ProducesResponseType(typeof(MiniGameCompletionResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<MiniGameCompletionResponseDto>> Complete(
        [FromBody] MiniGameCompletionRequestDto request,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        try
        {
            var response = await miniGameService.CompleteAsync(request, cancellationToken);
            return Ok(response);
        }
        catch (ArgumentException argumentException)
        {
            return BadRequest(new { error = argumentException.Message });
        }
        catch (KeyNotFoundException notFoundException)
        {
            return NotFound(new { error = notFoundException.Message });
        }
    }
}
