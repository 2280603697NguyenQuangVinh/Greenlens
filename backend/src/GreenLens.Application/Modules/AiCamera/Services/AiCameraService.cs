using GreenLens.Application.Modules.AiCamera.DTOs;
using GreenLens.Application.Modules.AiCamera.Interfaces;

namespace GreenLens.Application.Modules.AiCamera.Services;

public sealed class AiCameraService : IAiCameraService
{
    private readonly IImageStorageService _imageStorageService;
    private readonly IRekognitionService _rekognitionService;
    private readonly IWasteMappingService _wasteMappingService;
    private readonly IBedrockGuidanceService _bedrockGuidanceService;
    private readonly IAiCameraUsageLimiter _usageLimiter;

    public AiCameraService(
        IImageStorageService imageStorageService,
        IRekognitionService rekognitionService,
        IWasteMappingService wasteMappingService,
        IBedrockGuidanceService bedrockGuidanceService,
        IAiCameraUsageLimiter usageLimiter)
    {
        _imageStorageService = imageStorageService;
        _rekognitionService = rekognitionService;
        _wasteMappingService = wasteMappingService;
        _bedrockGuidanceService = bedrockGuidanceService;
        _usageLimiter = usageLimiter;
    }

    public async Task<AiCameraAnalyzeResponse> AnalyzeAsync(
        AiCameraAnalyzeRequest request,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.ChildId))
        {
            throw new ArgumentException("childId is required.", nameof(request));
        }

        var quota = await _usageLimiter.CheckAndConsumeAsync(
            request.CognitoSub ?? string.Empty,
            request.ChildId,
            cancellationToken);

        if (!quota.Allowed)
        {
            throw new AiCameraQuotaExceededException(
                quota.Message ?? "AI Camera usage limit reached.");
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
        ValidateSupportedImageFormat(imageBytes);

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

    private static void ValidateSupportedImageFormat(byte[] imageBytes)
    {
        if (IsJpeg(imageBytes) || IsPng(imageBytes))
        {
            return;
        }

        if (IsWebP(imageBytes))
        {
            throw new ArgumentException(
                "Unsupported image format: WebP. Please upload a real JPEG or PNG image.",
                nameof(imageBytes));
        }

        throw new ArgumentException(
            "Unsupported image format. Please upload a JPEG or PNG image.",
            nameof(imageBytes));
    }

    private static bool IsJpeg(byte[] bytes)
    {
        return bytes.Length >= 3 &&
            bytes[0] == 0xFF &&
            bytes[1] == 0xD8 &&
            bytes[2] == 0xFF;
    }

    private static bool IsPng(byte[] bytes)
    {
        return bytes.Length >= 8 &&
            bytes[0] == 0x89 &&
            bytes[1] == 0x50 &&
            bytes[2] == 0x4E &&
            bytes[3] == 0x47 &&
            bytes[4] == 0x0D &&
            bytes[5] == 0x0A &&
            bytes[6] == 0x1A &&
            bytes[7] == 0x0A;
    }

    private static bool IsWebP(byte[] bytes)
    {
        return bytes.Length >= 12 &&
            bytes[0] == 0x52 &&
            bytes[1] == 0x49 &&
            bytes[2] == 0x46 &&
            bytes[3] == 0x46 &&
            bytes[8] == 0x57 &&
            bytes[9] == 0x45 &&
            bytes[10] == 0x42 &&
            bytes[11] == 0x50;
    }
}
