using GreenLens.Application.Modules.Quiz.DTOs;

namespace GreenLens.Application.Modules.Quiz.Interfaces;

public interface IChildQuizContextReader
{
    Task<ChildQuizContext> GetAsync(
        string childId,
        string cognitoSub,
        CancellationToken cancellationToken = default);
}
