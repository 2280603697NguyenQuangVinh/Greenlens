using GreenLens.Api.Interfaces;
using GreenLens.Api.Models;
using Microsoft.AspNetCore.Mvc;

namespace GreenLens.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ScannerController : ControllerBase
{
    private readonly IAiScannerService _scannerService;
    private readonly IUserProfileService _profiles;

    public ScannerController(IAiScannerService scannerService, IUserProfileService profiles)
    {
        _scannerService = scannerService;
        _profiles = profiles;
    }

    [HttpPost("analyze")]
    public async Task<ActionResult<ScanAnalyzeResponse>> Analyze([FromBody] ScanRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Base64Image))
        {
            return BadRequest(new { message = "Base64Image is required." });
        }

        var result = await _scannerService.AnalyzeImageAsync(request.Base64Image);

        var badgeId = _profiles.ExtractBadgeIdFromToken(Request.Headers.Authorization);
        UserProfile? profile = null;
        if (!string.IsNullOrEmpty(badgeId))
        {
            await _profiles.AddXpAsync(badgeId, result.XpEarned, "♻️", $"Scanned {result.Label}");
            profile = await _profiles.RecordScanAsync(badgeId);
        }

        return Ok(new ScanAnalyzeResponse
        {
            Result = result,
            Profile = profile
        });
    }
}

public record ScanRequest(string Base64Image);

public class ScanAnalyzeResponse
{
    public ClassificationResult Result { get; set; } = new();
    public UserProfile? Profile { get; set; }
}
