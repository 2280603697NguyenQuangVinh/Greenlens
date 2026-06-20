using GreenLens.Application.Modules.Quiz.DTOs;

namespace GreenLens.Application.Modules.Quiz.Interfaces;

public interface IQuizService
{
    Task<GenerateQuizResponse> GenerateAsync(
        GenerateQuizRequest request,
        string cognitoSub,
        CancellationToken cancellationToken = default);

    Task<QuizSessionDto> GetSessionAsync(
        string sessionId,
        string cognitoSub,
        CancellationToken cancellationToken = default);

    Task<CompleteQuizResponse> CompleteAsync(
        CompleteQuizRequest request,
        string cognitoSub,
        CancellationToken cancellationToken = default);
}
