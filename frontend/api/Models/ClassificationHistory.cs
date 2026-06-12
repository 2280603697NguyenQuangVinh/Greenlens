namespace GreenLens.Api.Models;

public class ClassificationHistory
{
    public string UserId { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public double Confidence { get; set; }
    public DateTime Timestamp { get; set; }
    public int XpEarned { get; set; }
}
