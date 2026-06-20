using GreenLens.Application.Modules.MiniGame.DTOs;
using GreenLens.Application.Modules.MiniGame.Interfaces;
using GreenLens.Application.Modules.MiniGame.Services;
using GreenLens.Application.Modules.MiniGame.Validators;
using GreenLens.Domain.Common.Interfaces;
using GreenLens.Domain.Modules.Activities.Entities;
using GreenLens.Domain.Modules.Activities.Enums;

namespace GreenLens.Application.Modules.MiniGame.Services;

public sealed class MiniGameService(
    IChildProfileRepository childProfileRepository,
    IActivityHistoryRepository activityHistoryRepository,
    IDailyActivityRepository dailyActivityRepository,
    CompleteMiniGameValidator validator) : IMiniGameService
{
    public async Task<CompleteMiniGameResponse> CompleteAsync(
        CompleteMiniGameRequest request,
        CancellationToken cancellationToken = default)
    {
        var validationErrors = validator.Validate(request);
        if (validationErrors.Count > 0)
        {
            throw new ArgumentException(string.Join(" ", validationErrors));
        }

        var childId = request.ChildId!.Trim();
        var profile = await childProfileRepository.GetByIdAsync(childId, cancellationToken);
        if (profile is null)
        {
            throw new KeyNotFoundException($"Child profile '{childId}' was not found.");
        }

        var xpEarned = XpCalculator.CalculateXpEarned(
            request.Score,
            request.CorrectAnswers,
            request.WrongAnswers);
        var newXp = profile.Xp + xpEarned;
        var newLevel = XpCalculator.CalculateLevel(newXp);

        var today = DateTime.UtcNow.ToString("yyyy-MM-dd");
        var yesterday = DateTime.UtcNow.AddDays(-1).ToString("yyyy-MM-dd");
        var todayActivity = await dailyActivityRepository.GetAsync(childId, today, cancellationToken);
        var yesterdayActivity = await dailyActivityRepository.GetAsync(childId, yesterday, cancellationToken);

        var dailyActivityCompleted = todayActivity?.GameCompleted != true;
        var newStreak = CalculateStreak(
            profile.Streak,
            todayActivity,
            yesterdayActivity,
            dailyActivityCompleted);

        var now = DateTime.UtcNow;
        await childProfileRepository.UpdateProgressAsync(
            childId,
            newXp,
            newLevel,
            newStreak,
            cancellationToken);

        await activityHistoryRepository.SaveAsync(new ActivityHistory
        {
            HistoryId = $"history_{Guid.NewGuid():N}",
            ChildId = childId,
            ActivityType = ActivityType.MiniGame,
            Score = request.Score,
            CorrectAnswers = request.CorrectAnswers,
            WrongAnswers = request.WrongAnswers,
            DurationSeconds = request.DurationSeconds,
            XpEarned = xpEarned,
            CompletedAt = now
        }, cancellationToken);

        await dailyActivityRepository.SaveAsync(new DailyActivity
        {
            ChildId = childId,
            Date = today,
            GameCompleted = true,
            Streak = newStreak,
            UpdatedAt = now
        }, cancellationToken);

        return new CompleteMiniGameResponse(
            xpEarned,
            newXp,
            newLevel,
            newStreak,
            dailyActivityCompleted);
    }

    private static int CalculateStreak(
        int currentProfileStreak,
        DailyActivity? todayActivity,
        DailyActivity? yesterdayActivity,
        bool isFirstCompletionToday)
    {
        if (!isFirstCompletionToday)
        {
            return todayActivity?.Streak ?? currentProfileStreak;
        }

        if (yesterdayActivity?.GameCompleted == true)
        {
            return (yesterdayActivity.Streak > 0 ? yesterdayActivity.Streak : currentProfileStreak) + 1;
        }

        return 1;
    }
}
