using GreenLens.Application.Modules.Quiz.DTOs;

namespace GreenLens.Application.Modules.Quiz.Interfaces;

public interface IQuizGenerator
{
    Task<IReadOnlyList<QuizQuestionDto>> GenerateAsync(
        string wasteType,
        int age,
        CancellationToken cancellationToken = default);
}
