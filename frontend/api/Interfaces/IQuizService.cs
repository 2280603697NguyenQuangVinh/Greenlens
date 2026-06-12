using GreenLens.Api.Models;

namespace GreenLens.Api.Interfaces;

public interface IQuizService
{
    Task<IReadOnlyList<QuizQuestion>> GenerateQuizAsync(string category);
}
