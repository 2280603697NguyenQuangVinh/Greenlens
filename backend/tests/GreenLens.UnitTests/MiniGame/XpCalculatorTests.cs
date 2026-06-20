using GreenLens.Application.Modules.MiniGame.Services;
using Xunit;

namespace GreenLens.UnitTests.MiniGame;

public sealed class XpCalculatorTests
{
    [Fact]
    public void CalculateXpEarned_MatchesAcceptanceCriteriaExample()
    {
        var xpEarned = XpCalculator.CalculateXpEarned(score: 120, correctAnswers: 8, wrongAnswers: 2);

        Assert.Equal(25, xpEarned);
    }

    [Fact]
    public void CalculateXpEarned_HasMinimumOfFive()
    {
        var xpEarned = XpCalculator.CalculateXpEarned(score: 0, correctAnswers: 0, wrongAnswers: 0);

        Assert.Equal(5, xpEarned);
    }

    [Theory]
    [InlineData(125, 25, 150, 2)]
    [InlineData(0, 25, 25, 1)]
    [InlineData(100, 25, 125, 2)]
    public void CalculateLevel_UsesHundredXpThresholds(
        int currentXp,
        int xpEarned,
        int expectedNewXp,
        int expectedLevel)
    {
        var newXp = currentXp + xpEarned;
        var newLevel = XpCalculator.CalculateLevel(newXp);

        Assert.Equal(expectedNewXp, newXp);
        Assert.Equal(expectedLevel, newLevel);
    }
}
