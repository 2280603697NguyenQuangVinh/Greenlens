using GreenLens.Api.Models;

namespace GreenLens.Api.Interfaces;

public interface IAiScannerService
{
    Task<ClassificationResult> AnalyzeImageAsync(string base64Image);
}
