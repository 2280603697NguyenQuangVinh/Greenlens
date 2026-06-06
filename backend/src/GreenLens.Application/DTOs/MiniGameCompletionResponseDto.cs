namespace GreenLens.Application.DTOs;

public sealed class MiniGameCompletionResponseDto
{
    public int XpEarned { get; set; }
    public int NewXp { get; set; }
    public int NewLevel { get; set; }
    public int Streak { get; set; }
    public bool DailyActivityCompleted { get; set; }
}
