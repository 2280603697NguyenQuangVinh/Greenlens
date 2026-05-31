using GreenLens.Api.Interfaces;
using GreenLens.Api.Models;

namespace GreenLens.Api.Services.Cloud;

public class BedrockQuizService : IQuizService
{
    public Task<IReadOnlyList<QuizQuestion>> GenerateQuizAsync(string category)
    {
        // TODO: Generate quiz questions via Amazon Bedrock by category.
        throw new NotImplementedException();
    }
}
