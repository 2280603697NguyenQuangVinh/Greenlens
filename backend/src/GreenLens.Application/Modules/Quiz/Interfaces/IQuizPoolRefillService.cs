using GreenLens.Application.Modules.Quiz.DTOs;

namespace GreenLens.Application.Modules.Quiz.Interfaces;

public interface IQuizPoolRefillService
{
    Task RefillAsync(
        QuizPoolRefillRequest request,
        CancellationToken cancellationToken = default);
}
