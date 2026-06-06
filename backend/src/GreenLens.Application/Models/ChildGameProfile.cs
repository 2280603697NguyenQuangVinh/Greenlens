namespace GreenLens.Application.Models;

public sealed class ChildGameProfile
{
    public string ChildId { get; init; } = string.Empty;
    public int Xp { get; init; }
    public int Level { get; init; }
    public int Streak { get; init; }
}
