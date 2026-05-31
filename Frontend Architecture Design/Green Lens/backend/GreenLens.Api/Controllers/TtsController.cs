using GreenLens.Api.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace GreenLens.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TtsController : ControllerBase
{
    private readonly ITextToSpeechService _ttsService;

    public TtsController(ITextToSpeechService ttsService)
    {
        _ttsService = ttsService;
    }

    [HttpPost("speak")]
    public async Task<ActionResult<TtsResponse>> Speak([FromBody] TtsRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Text))
        {
            return BadRequest(new { message = "Text is required." });
        }

        var audioUrl = await _ttsService.GenerateAudioAsync(request.Text);
        return Ok(new TtsResponse(audioUrl));
    }
}

public record TtsRequest(string Text);

public record TtsResponse(string AudioUrl);
