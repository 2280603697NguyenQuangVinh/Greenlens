namespace GreenLens.Domain.Modules.Activities.Entities;

public sealed class DailyActivity
{
    public required string ChildId { get; init; }

    public required string Date { get; init; }

    public bool GameCompleted { get; init; }

    public int Streak { get; init; }

    public required DateTime UpdatedAt { get; init; }
}
