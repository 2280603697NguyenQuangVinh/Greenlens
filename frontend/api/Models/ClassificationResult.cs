namespace GreenLens.Api.Models;

public class ClassificationResult
{
    public string Label { get; set; } = string.Empty;
    public string Emoji { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string CategoryKey { get; set; } = string.Empty;
    public string BinColor { get; set; } = string.Empty;
    public string CategoryColor { get; set; } = string.Empty;
    public string BackgroundColor { get; set; } = string.Empty;
    public string Guide { get; set; } = string.Empty;
    public double Confidence { get; set; }
    public int XpEarned { get; set; }
}
