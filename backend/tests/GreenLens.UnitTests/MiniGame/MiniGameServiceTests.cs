using GreenLens.Api.Repositories;
using GreenLens.Application.Modules.ChildProfiles.DTOs;
using GreenLens.Application.Modules.ChildProfiles.Services;
using GreenLens.Application.Modules.ChildProfiles.Validators;
using GreenLens.Application.Modules.MiniGame.DTOs;
using GreenLens.Application.Modules.MiniGame.Services;
using GreenLens.Application.Modules.MiniGame.Validators;
using Xunit;

namespace GreenLens.UnitTests.MiniGame;

public sealed class MiniGameServiceTests
{
    [Fact]
    public async Task CompleteAsync_UpdatesXpLevelAndStreak()
    {
        var childProfileRepository = new InMemoryChildProfileRepository();
        var activityHistoryRepository = new InMemoryActivityHistoryRepository();
        var dailyActivityRepository = new InMemoryDailyActivityRepository();
        var childProfileService = new ChildProfileService(
            childProfileRepository,
            new InMemoryChildIdentityService(),
            new CreateChildProfileValidator());

        var profile = await childProfileService.CreateAsync(
            new CreateChildProfileRequest(
                "Gau Xanh",
                "male",
                "hair_01",
                "eyes_01",
                "outfit_01",
                "preview_01"),
            "test-cognito-sub");

        await childProfileRepository.UpdateProgressAsync(profile.ChildId, 125, 2, 4);

        var service = new MiniGameService(
            childProfileRepository,
            activityHistoryRepository,
            dailyActivityRepository,
            new CompleteMiniGameValidator());

        var response = await service.CompleteAsync(new CompleteMiniGameRequest(
            profile.ChildId,
            Score: 120,
            CorrectAnswers: 8,
            WrongAnswers: 2,
            DurationSeconds: 60));

        Assert.Equal(25, response.XpEarned);
        Assert.Equal(150, response.NewXp);
        Assert.Equal(2, response.NewLevel);
        Assert.Equal(1, response.Streak);
        Assert.True(response.DailyActivityCompleted);

        var updatedProfile = await childProfileRepository.GetByIdAsync(profile.ChildId);
        Assert.NotNull(updatedProfile);
        Assert.Equal(150, updatedProfile!.Xp);
        Assert.Equal(2, updatedProfile.Level);
        Assert.Equal(1, updatedProfile.Streak);
    }
}
