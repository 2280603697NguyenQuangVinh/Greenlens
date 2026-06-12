using GreenLens.Api.Interfaces;
using GreenLens.Api.Models;
using Microsoft.AspNetCore.Mvc;

namespace GreenLens.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GameController : ControllerBase
{
    private readonly IGameService _gameService;
    private readonly IUserProfileService _profiles;

    public GameController(IGameService gameService, IUserProfileService profiles)
    {
        _gameService = gameService;
        _profiles = profiles;
    }

    [HttpPost("result")]
    public async Task<ActionResult<GameResultResponse>> SubmitResult([FromBody] GameResultRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.UserId))
        {
            return BadRequest(new { message = "UserId is required." });
        }

        var xpEarned = await _gameService.ProcessGameResultAsync(request.UserId, request.Score);
        var profile = await _profiles.GetByBadgeIdAsync(request.UserId);

        return Ok(new GameResultResponse
        {
            XpEarned = xpEarned,
            Profile = profile
        });
    }
}

public record GameResultRequest(string UserId, int Score);

public class GameResultResponse
{
    public int XpEarned { get; init; }
    public UserProfile? Profile { get; init; }
}
