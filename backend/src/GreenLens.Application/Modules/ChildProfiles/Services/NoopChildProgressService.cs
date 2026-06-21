using GreenLens.Application.Modules.ChildProfiles.Interfaces;

namespace GreenLens.Application.Modules.ChildProfiles.Services;

public sealed class NoopChildProgressService : IChildProgressService
{
    public Task AwardAiCameraScanAsync(
        string childId,
        string cognitoSub,
        CancellationToken cancellationToken = default)
    {
        return Task.CompletedTask;
    }

    public Task AwardQuizAsync(
        string childId,
        string cognitoSub,
        int correctAnswers,
        int totalQuestions,
        CancellationToken cancellationToken = default)
    {
        return Task.CompletedTask;
    }

    public Task AwardMiniGameAsync(
        string childId,
        string cognitoSub,
        int score,
        int xpAwarded,
        CancellationToken cancellationToken = default)
    {
        return Task.CompletedTask;
    }
}
