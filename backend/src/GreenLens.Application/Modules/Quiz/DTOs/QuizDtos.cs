namespace GreenLens.Application.Modules.Quiz.DTOs;

public sealed record GenerateQuizRequest(
    string ChildId);

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
    string GameType,
    string WasteType,
    int TargetAge,
    IReadOnlyList<QuizQuestionDto> Questions,
    bool UsedFallback);

public sealed record QuizSessionDto(
    string SessionId,
    string ChildId,
    string GameType,
    string WasteType,
    int TargetAge,
    string Status,
    IReadOnlyList<QuizQuestionDto> Questions,
    DateTime CreatedAt,
    DateTime UpdatedAt);

public sealed record CompleteQuizResponse(
    string SessionId,
    string GameType,
    int Score,
    int CorrectAnswers,
    int TotalQuestions,
    int XpAwarded,
    string Status);

public sealed record ChildQuizContext(
    string ChildId,
    string CognitoSub);

public sealed record QuizPoolItemDto(
    string ChildId,
    string QuizSetId,
    string CognitoSub,
    string Topic,
    int TargetAge,
    IReadOnlyList<QuizQuestionDto> Questions,
    string Status,
    DateTime CreatedAt,
    DateTime? ClaimedAt,
    DateTime? FailedAt,
    DateTime ExpiresAt);

public sealed record QuizPoolRefillRequest(
    string ChildId,
    string CognitoSub);
