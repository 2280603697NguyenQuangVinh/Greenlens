using GreenLens.Application.Modules.ChildProfiles.Interfaces;
using GreenLens.Application.Modules.MiniGames.DTOs;
using GreenLens.Application.Modules.MiniGames.Interfaces;
using GreenLens.Application.Modules.MiniGames.Services;
using Xunit;

namespace GreenLens.UnitTests.MiniGames;

public sealed class MiniGameServiceTests
{
    [Fact]
    public async Task GetTrashSortItemsAsync_ReturnsItemsWithAssetUrlsAndBins()
    {
        var service = new MiniGameService(
            new FakeMiniGameRepository(previousBestScore: 0),
            new FakeChildProgressService(),
            "https://assets.example.com");

        var response = await service.GetTrashSortItemsAsync("cognito-sub-123");

        var item = Assert.Single(response.Items);
        Assert.Equal("banana_peel", item.ItemId);
        Assert.Equal("https://assets.example.com/mini-games/trash-sort/icons/banana.svg", item.IconUrl);
        Assert.Contains(response.Bins, bin => bin.Category == "Recyclable" && bin.BinColor == "Green");
        Assert.Contains(response.Bins, bin => bin.Category == "Organic" && bin.BinColor == "Brown");
        Assert.Contains(response.Bins, bin => bin.Category == "Hazardous" && bin.BinColor == "Red");
    }

    [Fact]
    public async Task SubmitTrashSortResultAsync_CalculatesScoreXpAndBadge()
    {
        var repository = new FakeMiniGameRepository(previousBestScore: 50);
        var progress = new FakeChildProgressService();
        var service = new MiniGameService(repository, progress);

        var response = await service.SubmitTrashSortResultAsync(
            new SubmitTrashSortResultRequest("child_123", 10, 2, 60),
            "cognito-sub-123");

        Assert.Equal(90, response.Score);
        Assert.Equal(20, response.XpAwarded);
        Assert.True(response.IsPersonalBest);
        Assert.Contains("Rác Kỳ Thủ", response.UnlockedBadges);
        Assert.Equal(90, progress.Score);
        Assert.Equal(20, progress.XpAwarded);
        Assert.NotNull(repository.SavedResult);
    }

    [Fact]
    public async Task SubmitTrashSortResultAsync_AwardsCompletionXpWhenScoreIsNotAbove80()
    {
        var service = new MiniGameService(
            new FakeMiniGameRepository(previousBestScore: 70),
            new FakeChildProgressService());

        var response = await service.SubmitTrashSortResultAsync(
            new SubmitTrashSortResultRequest("child_123", 8, 0, 60),
            "cognito-sub-123");

        Assert.Equal(80, response.Score);
        Assert.Equal(10, response.XpAwarded);
        Assert.Empty(response.UnlockedBadges);
        Assert.True(response.IsPersonalBest);
    }

    private sealed class FakeMiniGameRepository : IMiniGameRepository
    {
        private readonly int _previousBestScore;

        public FakeMiniGameRepository(int previousBestScore)
        {
            _previousBestScore = previousBestScore;
        }

        public MiniGameResultDto? SavedResult { get; private set; }

        public Task<IReadOnlyList<MiniGameItemDto>> GetActiveItemsAsync(
            string gameType,
            CancellationToken cancellationToken = default)
        {
            IReadOnlyList<MiniGameItemDto> items =
            [
                new(
                    "banana_peel",
                    "Vỏ chuối",
                    "Organic",
                    "Brown",
                    "mini-games/trash-sort/icons/banana.svg",
                    "easy",
                    true)
            ];

            return Task.FromResult(items);
        }

        public Task<int> GetBestScoreAsync(
            string childId,
            string gameType,
            CancellationToken cancellationToken = default)
        {
            return Task.FromResult(_previousBestScore);
        }

        public Task SaveResultAsync(
            MiniGameResultDto result,
            CancellationToken cancellationToken = default)
        {
            SavedResult = result;
            return Task.CompletedTask;
        }
    }

    private sealed class FakeChildProgressService : IChildProgressService
    {
        public int Score { get; private set; }
        public int XpAwarded { get; private set; }

        public Task AwardAiCameraScanAsync(
            string childId,
            string cognitoSub,
            CancellationToken cancellationToken = default)
        {
            throw new NotSupportedException();
        }

        public Task AwardQuizAsync(
            string childId,
            string cognitoSub,
            int correctAnswers,
            int totalQuestions,
            CancellationToken cancellationToken = default)
        {
            throw new NotSupportedException();
        }

        public Task AwardMiniGameAsync(
            string childId,
            string cognitoSub,
            int score,
            int xpAwarded,
            CancellationToken cancellationToken = default)
        {
            Score = score;
            XpAwarded = xpAwarded;
            return Task.CompletedTask;
        }
    }
}
