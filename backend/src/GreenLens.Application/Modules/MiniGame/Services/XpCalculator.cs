namespace GreenLens.Application.Modules.MiniGame.Services;

public static class XpCalculator
{
    public static int CalculateXpEarned(int score, int correctAnswers, int wrongAnswers)
    {
        _ = wrongAnswers;
        return Math.Max(5, (correctAnswers * 3) + (score / 120));
    }

    public static int CalculateLevel(int xp) => (xp / 100) + 1;
}
