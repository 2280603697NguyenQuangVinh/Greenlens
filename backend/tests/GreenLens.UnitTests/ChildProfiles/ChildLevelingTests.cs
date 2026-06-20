using GreenLens.Application.Modules.ChildProfiles.Services;
using Xunit;

namespace GreenLens.UnitTests.ChildProfiles;

public sealed class ChildLevelingTests
{
    [Theory]
    [InlineData(0, 1)]
    [InlineData(49, 1)]
    [InlineData(50, 2)]
    [InlineData(119, 2)]
    [InlineData(120, 3)]
    [InlineData(2000, 10)]
    [InlineData(2500, 10)]
    public void GetLevel_ReturnsExpectedLevel(int xp, int expectedLevel)
    {
        var level = ChildLeveling.GetLevel(xp);

        Assert.Equal(expectedLevel, level);
    }

    [Fact]
    public void BuildProgress_ReturnsDistanceToNextLevel()
    {
        var progress = ChildLeveling.BuildProgress(80);

        Assert.Equal(2, progress.CurrentLevel);
        Assert.Equal(50, progress.CurrentLevelXp);
        Assert.Equal(3, progress.NextLevel);
        Assert.Equal(120, progress.NextLevelXp);
        Assert.Equal(30, progress.XpIntoCurrentLevel);
        Assert.Equal(40, progress.XpToNextLevel);
        Assert.Equal(43, progress.ProgressPercent);
    }
}
