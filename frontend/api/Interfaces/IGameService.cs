namespace GreenLens.Api.Interfaces;

public interface IGameService
{
    Task<int> ProcessGameResultAsync(string userId, int score);
}
