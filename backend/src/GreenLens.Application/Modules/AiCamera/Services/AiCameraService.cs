using GreenLens.Application.Modules.AiCamera.DTOs;
using GreenLens.Application.Modules.AiCamera.Interfaces;

namespace GreenLens.Application.Modules.AiCamera.Services;

public sealed class AiCameraService : IAiCameraService
{
    private readonly IImageStorageService _imageStorageService;
    private readonly IRekognitionService _rekognitionService;
    private readonly IWasteMappingService _wasteMappingService;
    private readonly IBedrockGuidanceService _bedrockGuidanceService;

    public AiCameraService(
        IImageStorageService imageStorageService,
        IRekognitionService rekognitionService,
        IWasteMappingService wasteMappingService,
        IBedrockGuidanceService bedrockGuidanceService)
    {
        _imageStorageService = imageStorageService;
        _rekognitionService = rekognitionService;
        _wasteMappingService = wasteMappingService;
        _bedrockGuidanceService = bedrockGuidanceService;
    }

    public async Task<AiCameraAnalyzeResponse> AnalyzeAsync(
        AiCameraAnalyzeRequest request,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.ChildId))
        {
            throw new ArgumentException("childId is required.", nameof(request));
        }

        if (request.ImageStream is null || !request.ImageStream.CanRead)
        {
            throw new ArgumentException("image is required.", nameof(request));
        }

        await using var imageBuffer = new MemoryStream();
        await request.ImageStream.CopyToAsync(imageBuffer, cancellationToken);

        if (imageBuffer.Length == 0)
        {
            throw new ArgumentException("image is required.", nameof(request));
        }

        var imageBytes = imageBuffer.ToArray();

        await using var uploadStream = new MemoryStream(imageBytes);
        var upload = await _imageStorageService.UploadImageAsync(
            uploadStream,
            request.FileName,
            request.ContentType,
            cancellationToken);

        await using var rekognitionStream = new MemoryStream(imageBytes);
        var detectedLabel = await _rekognitionService.DetectLabelsAsync(rekognitionStream, cancellationToken);
        var wasteCategory = _wasteMappingService.Map(detectedLabel.Label);
        var guidance = await _bedrockGuidanceService.GenerateGuidanceAsync(
            detectedLabel.Label,
            wasteCategory.Category,
            cancellationToken);

        return new AiCameraAnalyzeResponse(
            request.ChildId,
            detectedLabel.Label,
            Math.Round(detectedLabel.Confidence, 1),
            wasteCategory.Category,
            wasteCategory.BinColor,
            guidance.RecycleGuide,
            guidance.ReuseSuggestion,
            guidance.EnvironmentImpact,
            upload.S3ImageKey,
            upload.S3Url);
    }
}
