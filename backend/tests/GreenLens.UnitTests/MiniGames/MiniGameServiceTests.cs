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

        Assert.Equal(6, response.Items.Count);
        Assert.All(response.Items, item =>
            Assert.StartsWith("https://assets.example.com/mini-games/trash-sort/icons/", item.IconUrl));
        Assert.Equal(2, response.Items.Count(item => item.Category == "Recyclable"));
        Assert.Equal(2, response.Items.Count(item => item.Category == "Organic"));
        Assert.Equal(2, response.Items.Count(item => item.Category == "Hazardous"));
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
                new("banana_peel", "Vỏ chuối", "Organic", "Brown", "mini-games/trash-sort/icons/banana.svg", "easy", true),
                new("apple_core", "Lõi táo", "Organic", "Brown", "mini-games/trash-sort/icons/apple.svg", "easy", true),
                new("fallen_leaf", "Lá rụng", "Organic", "Brown", "mini-games/trash-sort/icons/leaf.svg", "easy", true),
                new("paper_sheet", "Giấy", "Recyclable", "Green", "mini-games/trash-sort/icons/paper.svg", "easy", true),
                new("plastic_bottle", "Chai nhựa", "Recyclable", "Green", "mini-games/trash-sort/icons/bottle.svg", "easy", true),
                new("can", "Lon", "Recyclable", "Green", "mini-games/trash-sort/icons/can.svg", "easy", true),
                new("battery", "Pin", "Hazardous", "Red", "mini-games/trash-sort/icons/battery.svg", "easy", true),
                new("medicine", "Thuốc", "Hazardous", "Red", "mini-games/trash-sort/icons/medicine.svg", "easy", true),
                new("light_bulb", "Bóng đèn", "Hazardous", "Red", "mini-games/trash-sort/icons/light-bulb.svg", "easy", true)
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
