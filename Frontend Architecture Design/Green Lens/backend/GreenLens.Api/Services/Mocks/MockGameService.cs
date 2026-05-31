using GreenLens.Api.Interfaces;

namespace GreenLens.Api.Services.Mocks;

public class MockGameService : IGameService
{
    private readonly IUserProfileService _profiles;

    public MockGameService(IUserProfileService profiles)
    {
        _profiles = profiles;
    }

    public async Task<int> ProcessGameResultAsync(string userId, int score)
    {
        var xpEarned = Math.Max(score / 5, 5);
        Console.WriteLine($"[MockGameService] UserId={userId}, Score={score}, XP+={xpEarned}");
        await _profiles.AddXpAsync(userId, xpEarned, "♻️", "Completed Sort Game");
        return xpEarned;
    }
}
