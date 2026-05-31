using GreenLens.Api.Interfaces;
using GreenLens.Api.Models;
using Microsoft.AspNetCore.Mvc;

namespace GreenLens.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class QuizController : ControllerBase
{
    private readonly IQuizService _quizService;
    private readonly IUserProfileService _profiles;

    public QuizController(IQuizService quizService, IUserProfileService profiles)
    {
        _quizService = quizService;
        _profiles = profiles;
    }

    [HttpGet("{category}")]
    public async Task<ActionResult<IReadOnlyList<QuizQuestion>>> GetQuiz(string category)
    {
        if (string.IsNullOrWhiteSpace(category))
        {
            return BadRequest(new { message = "Category is required." });
        }

        var questions = await _quizService.GenerateQuizAsync(category);
        return Ok(questions);
    }

    [HttpPost("complete")]
    public async Task<ActionResult<QuizCompleteResponse>> Complete([FromBody] QuizCompleteRequest request)
    {
        var badgeId = _profiles.ExtractBadgeIdFromToken(Request.Headers.Authorization);
        if (string.IsNullOrEmpty(badgeId))
        {
            return Unauthorized(new { message = "Missing or invalid token." });
        }

        var xpPerCorrect = 10;
        var xpPerWrong = 5;
        var xpEarned = request.CorrectCount * xpPerCorrect
            + (request.TotalCount - request.CorrectCount) * xpPerWrong;

        var profile = await _profiles.AddXpAsync(
            badgeId,
            xpEarned,
            "🧠",
            $"Completed Eco Quiz ({request.CorrectCount}/{request.TotalCount})");

        return Ok(new QuizCompleteResponse { XpEarned = xpEarned, Profile = profile });
    }
}

public record QuizCompleteRequest(int CorrectCount, int TotalCount);

public class QuizCompleteResponse
{
    public int XpEarned { get; init; }
    public UserProfile Profile { get; init; } = new();
}
