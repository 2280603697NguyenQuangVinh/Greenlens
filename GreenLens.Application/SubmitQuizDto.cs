namespace GreenLens.Application;

public class SubmitQuizDto
{
	public string UserId { get; set; } = string.Empty;

	public string QuizId { get; set; } = string.Empty;

	public string Answer { get; set; } = string.Empty;
}
