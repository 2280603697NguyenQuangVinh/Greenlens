using GreenLens.Domain.Modules.Activities.Enums;

namespace GreenLens.Domain.Modules.Activities.Entities;

public sealed class ActivityHistory
{
    public required string HistoryId { get; init; }

    public required string ChildId { get; init; }

    public required ActivityType ActivityType { get; init; }

    public int Score { get; init; }

    public int CorrectAnswers { get; init; }

    public int WrongAnswers { get; init; }

    public int DurationSeconds { get; init; }

    public int XpEarned { get; init; }

    public required DateTime CompletedAt { get; init; }
}
