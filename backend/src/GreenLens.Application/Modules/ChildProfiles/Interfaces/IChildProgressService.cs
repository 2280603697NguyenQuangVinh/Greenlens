namespace GreenLens.Application.Modules.ChildProfiles.Interfaces;

public interface IChildProgressService
{
    Task AwardAiCameraScanAsync(
        string childId,
        string cognitoSub,
        CancellationToken cancellationToken = default);

    Task AwardQuizAsync(
        string childId,
        string cognitoSub,
        int correctAnswers,
        int totalQuestions,
        CancellationToken cancellationToken = default);
}
