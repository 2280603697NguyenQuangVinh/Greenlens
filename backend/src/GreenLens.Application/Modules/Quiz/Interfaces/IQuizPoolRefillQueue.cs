using GreenLens.Application.Modules.Quiz.DTOs;

namespace GreenLens.Application.Modules.Quiz.Interfaces;

public interface IQuizPoolRefillQueue
{
    Task EnqueueAsync(
        QuizPoolRefillRequest request,
        CancellationToken cancellationToken = default);
}
