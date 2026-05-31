using GreenLens.Api.Interfaces;
using GreenLens.Api.Models;

namespace GreenLens.Api.Services.Cloud;

public class RekognitionScannerService : IAiScannerService
{
    public Task<ClassificationResult> AnalyzeImageAsync(string base64Image)
    {
        // TODO: Call Amazon Rekognition Custom Labels for waste classification.
        throw new NotImplementedException();
    }
}
