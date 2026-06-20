using GreenLens.Application.Modules.ChildProfiles.DTOs;

namespace GreenLens.Application.Modules.ChildProfiles.Services;

public static class ChildLeveling
{
    public static readonly IReadOnlyList<LevelMilestoneDto> Milestones =
    [
        new(1, 0),
        new(2, 50),
        new(3, 120),
        new(4, 220),
        new(5, 350),
        new(6, 520),
        new(7, 750),
        new(8, 1050),
        new(9, 1450),
        new(10, 2000)
    ];

    public static int GetLevel(int xp)
    {
        var safeXp = Math.Max(xp, 0);

        return Milestones
            .Where(milestone => milestone.RequiredXp <= safeXp)
            .Max(milestone => milestone.Level);
    }

    public static LevelProgressDto BuildProgress(int xp)
    {
        var safeXp = Math.Max(xp, 0);
        var current = Milestones.Last(milestone => milestone.RequiredXp <= safeXp);
        var next = Milestones.FirstOrDefault(milestone => milestone.RequiredXp > safeXp);

        if (next is null)
        {
            return new LevelProgressDto(
                current.Level,
                current.RequiredXp,
                null,
                null,
                safeXp - current.RequiredXp,
                0,
                100);
        }

        var xpIntoCurrentLevel = safeXp - current.RequiredXp;
        var xpBetweenLevels = Math.Max(next.RequiredXp - current.RequiredXp, 1);
        var progressPercent = (int)Math.Round(xpIntoCurrentLevel * 100d / xpBetweenLevels);

        return new LevelProgressDto(
            current.Level,
            current.RequiredXp,
            next.Level,
            next.RequiredXp,
            xpIntoCurrentLevel,
            next.RequiredXp - safeXp,
            Math.Clamp(progressPercent, 0, 100));
    }
}
