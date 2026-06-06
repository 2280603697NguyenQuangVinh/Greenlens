using System.ComponentModel.DataAnnotations;

namespace GreenLens.Application.DTOs;

public sealed class MiniGameCompletionRequestDto
{
    [Required]
    public string ChildId { get; set; } = string.Empty;

    [Range(0, int.MaxValue)]
    public int Score { get; set; }

    [Range(0, int.MaxValue)]
    public int CorrectAnswers { get; set; }

    [Range(0, int.MaxValue)]
    public int WrongAnswers { get; set; }

    [Range(1, int.MaxValue)]
    public int DurationSeconds { get; set; }
}
