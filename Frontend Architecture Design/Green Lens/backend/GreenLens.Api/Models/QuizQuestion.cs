namespace GreenLens.Api.Models;

public class QuizQuestion
{
    public int Id { get; set; }
    public string Question { get; set; } = string.Empty;
    public string Emoji { get; set; } = string.Empty;
    public IReadOnlyList<string> Options { get; set; } = [];
    public int CorrectIndex { get; set; }
    public string Tip { get; set; } = string.Empty;
}
