namespace GreenLens.Application.Modules.Quiz.DTOs;

public sealed record GenerateQuizRequest(
    string ChildId,
    string WasteType);

public sealed record CompleteQuizRequest(
    string SessionId,
    int CorrectAnswers);

public sealed record QuizQuestionDto(
    string Question,
    IReadOnlyList<string> Options,
    string Correct,
    string Explanation);

public sealed record GenerateQuizResponse(
    string SessionId,
    string ChildId,
    string WasteType,
    int Age,
    IReadOnlyList<QuizQuestionDto> Questions,
    bool UsedFallback);

public sealed record QuizSessionDto(
    string SessionId,
    string ChildId,
    string WasteType,
    int Age,
    string Status,
    IReadOnlyList<QuizQuestionDto> Questions,
    DateTime CreatedAt,
    DateTime UpdatedAt);

public sealed record CompleteQuizResponse(
    string SessionId,
    int CorrectAnswers,
    int TotalQuestions,
    int XpAwarded,
    string Status);

public sealed record ChildQuizContext(
    string ChildId,
    string CognitoSub,
    int Age);
