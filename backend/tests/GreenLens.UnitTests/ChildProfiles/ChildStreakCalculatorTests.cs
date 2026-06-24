using GreenLens.Application.Modules.ChildProfiles.Services;
using Xunit;

namespace GreenLens.UnitTests.ChildProfiles;

public sealed class ChildStreakCalculatorTests
{
    [Fact]
    public void CheckIn_StartsStreakWhenProfileHasNoStreakDate()
    {
        var result = ChildStreakCalculator.CheckIn(0, null, new DateOnly(2026, 6, 23));

        Assert.Equal(1, result.CurrentStreak);
        Assert.Equal("2026-06-23", result.LastStreakDate);
        Assert.Equal("Started", result.Status);
        Assert.Equal(2, result.FreezeDaysRemaining);
    }

    [Theory]
    [InlineData("2026-06-21", 1)]
    [InlineData("2026-06-20", 2)]
    public void CheckIn_UsesFreezeWhenChildMissesOneOrTwoDays(
        string lastStreakDate,
        int expectedMissedDays)
    {
        var result = ChildStreakCalculator.CheckIn(5, lastStreakDate, new DateOnly(2026, 6, 23));

        Assert.Equal(6, result.CurrentStreak);
        Assert.Equal("2026-06-23", result.LastStreakDate);
        Assert.Equal(expectedMissedDays, result.FreezeDaysUsed);
        Assert.Equal(expectedMissedDays, result.MissedDaysCoveredByFreeze);
        Assert.Equal("FreezeUsed", result.Status);
    }

    [Fact]
    public void CheckIn_ResetsWhenChildMissesMoreThanTwoDays()
    {
        var result = ChildStreakCalculator.CheckIn(5, "2026-06-19", new DateOnly(2026, 6, 23));

        Assert.Equal(1, result.CurrentStreak);
        Assert.Equal("2026-06-23", result.LastStreakDate);
        Assert.Equal("Reset", result.Status);
        Assert.Equal(2, result.FreezeDaysRemaining);
    }

    [Fact]
    public void CheckIn_DoesNotIncrementTwiceOnSameDay()
    {
        var result = ChildStreakCalculator.CheckIn(5, "2026-06-23", new DateOnly(2026, 6, 23));

        Assert.Equal(5, result.CurrentStreak);
        Assert.Equal("AlreadyCheckedIn", result.Status);
    }

    [Fact]
    public void Preview_ShowsFrozenStatusBeforeCheckIn()
    {
        var result = ChildStreakCalculator.Preview(5, "2026-06-20", new DateOnly(2026, 6, 23));

        Assert.Equal(5, result.CurrentStreak);
        Assert.Equal(2, result.FreezeDaysUsed);
        Assert.Equal(0, result.FreezeDaysRemaining);
        Assert.Equal("Frozen", result.Status);
    }

    [Fact]
    public void Preview_KeepsFreezeMetadataForSameDayAfterCheckIn()
    {
        var result = ChildStreakCalculator.Preview(
            6,
            "2026-06-23",
            new DateOnly(2026, 6, 23),
            storedFreezeDaysUsed: 2);

        Assert.Equal(6, result.CurrentStreak);
        Assert.Equal(2, result.FreezeDaysUsed);
        Assert.Equal(0, result.FreezeDaysRemaining);
        Assert.Equal("ActiveToday", result.Status);
    }
}
