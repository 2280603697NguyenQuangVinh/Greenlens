using GreenLens.Application.Modules.MiniGame.DTOs;
using GreenLens.Application.Modules.MiniGame.Validators;
using Xunit;

namespace GreenLens.UnitTests.MiniGame;

public sealed class CompleteMiniGameValidatorTests
{
    private readonly CompleteMiniGameValidator _validator = new();

    [Fact]
    public void Validate_ReturnsErrorWhenRequestIsNull()
    {
        var errors = _validator.Validate(null);

        Assert.Contains("Request body is required.", errors);
    }

    [Fact]
    public void Validate_ReturnsErrorWhenChildIdMissing()
    {
        var errors = _validator.Validate(new CompleteMiniGameRequest(
            ChildId: "",
            Score: 10,
            CorrectAnswers: 1,
            WrongAnswers: 0,
            DurationSeconds: 30));

        Assert.Contains("childId is required.", errors);
    }

    [Fact]
    public void Validate_ReturnsErrorWhenScoreIsNegative()
    {
        var errors = _validator.Validate(new CompleteMiniGameRequest(
            ChildId: "child_abc123",
            Score: -1,
            CorrectAnswers: 1,
            WrongAnswers: 0,
            DurationSeconds: 30));

        Assert.Contains("score must be zero or greater.", errors);
    }

    [Fact]
    public void Validate_ReturnsNoErrorsForValidRequest()
    {
        var errors = _validator.Validate(new CompleteMiniGameRequest(
            ChildId: "child_abc123",
            Score: 120,
            CorrectAnswers: 8,
            WrongAnswers: 2,
            DurationSeconds: 60));

        Assert.Empty(errors);
    }
}
