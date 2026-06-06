using GreenLens.Application.DTOs;
using GreenLens.Application.Interfaces;

namespace GreenLens.Application.Services;

public sealed class CloudGameService(
    IMiniGameChildProfileRepository childProfileRepository,
    IMiniGameActivityHistoryRepository activityHistoryRepository,
    IMiniGameDailyActivitiesRepository dailyActivitiesRepository) : IMiniGameService
{
    public async Task<MiniGameCompletionResponseDto> CompleteAsync(
        MiniGameCompletionRequestDto request,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.ChildId))
        {
            throw new ArgumentException("childId is required.", nameof(request.ChildId));
        }

        if (request.DurationSeconds <= 0)
        {
            throw new ArgumentException("durationSeconds must be greater than 0.", nameof(request.DurationSeconds));
        }

        var profile = await childProfileRepository.GetByChildIdAsync(request.ChildId, cancellationToken);
        if (profile is null)
        {
            throw new KeyNotFoundException($"Child profile not found for childId '{request.ChildId}'.");
        }

        var xpEarned = CalculateXp(request);
        var newXp = profile.Xp + xpEarned;
        var newLevel = CalculateLevel(newXp);
        var newStreak = profile.Streak + 1;
        var completedAtUtc = DateTime.UtcNow;

        await childProfileRepository.UpdateProgressAsync(
            request.ChildId,
            newXp,
            newLevel,
            newStreak,
            cancellationToken);

        await activityHistoryRepository.InsertMiniGameCompletionAsync(
            request.ChildId,
            xpEarned,
            completedAtUtc,
            cancellationToken);

        await dailyActivitiesRepository.UpsertGameCompletedAsync(
            request.ChildId,
            DateOnly.FromDateTime(completedAtUtc),
            gameCompleted: true,
            cancellationToken);

        return new MiniGameCompletionResponseDto
        {
            XpEarned = xpEarned,
            NewXp = newXp,
            NewLevel = newLevel,
            Streak = newStreak,
            DailyActivityCompleted = true
        };
    }

    private static int CalculateXp(MiniGameCompletionRequestDto request)
    {
        var totalAnswers = request.CorrectAnswers + request.WrongAnswers;
        var accuracyRatio = totalAnswers > 0
            ? (double)request.CorrectAnswers / totalAnswers
            : 0d;

        var expectedDuration = Math.Max(1, totalAnswers * 8);
        var speedRatio = (double)expectedDuration / request.DurationSeconds;
        var clampedSpeedRatio = Math.Clamp(speedRatio, 0.5d, 1.5d);

        var baseXp = request.Score;
        var accuracyBonus = (int)Math.Round(25d * accuracyRatio);
        var speedBonus = (int)Math.Round(20d * (clampedSpeedRatio - 0.5d));
        var answerBonus = (request.CorrectAnswers * 3) - request.WrongAnswers;

        return Math.Max(10, baseXp + accuracyBonus + speedBonus + answerBonus);
    }

    private static int CalculateLevel(int xp)
    {
        const int xpPerLevel = 100;
        return Math.Max(1, (xp / xpPerLevel) + 1);
    }
}
