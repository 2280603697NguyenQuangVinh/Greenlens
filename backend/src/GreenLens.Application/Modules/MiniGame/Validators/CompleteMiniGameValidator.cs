using GreenLens.Application.Modules.MiniGame.DTOs;

namespace GreenLens.Application.Modules.MiniGame.Validators;

public sealed class CompleteMiniGameValidator
{
    public IReadOnlyList<string> Validate(CompleteMiniGameRequest? request)
    {
        if (request is null)
        {
            return ["Request body is required."];
        }

        var errors = new List<string>();

        if (string.IsNullOrWhiteSpace(request.ChildId))
        {
            errors.Add("childId is required.");
        }

        if (request.Score < 0)
        {
            errors.Add("score must be zero or greater.");
        }

        if (request.CorrectAnswers < 0)
        {
            errors.Add("correctAnswers must be zero or greater.");
        }

        if (request.WrongAnswers < 0)
        {
            errors.Add("wrongAnswers must be zero or greater.");
        }

        if (request.DurationSeconds < 0)
        {
            errors.Add("durationSeconds must be zero or greater.");
        }

        return errors;
    }
}
