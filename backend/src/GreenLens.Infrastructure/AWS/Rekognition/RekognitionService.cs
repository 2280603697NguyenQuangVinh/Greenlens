using Amazon.Rekognition;
using Amazon.Rekognition.Model;
using GreenLens.Application.Modules.AiCamera.DTOs;
using GreenLens.Application.Modules.AiCamera.Interfaces;

namespace GreenLens.Infrastructure.AWS.Rekognition;

public sealed class RekognitionService : IRekognitionService
{
    private readonly IAmazonRekognition _rekognitionClient;
    private readonly RekognitionOptions _options;

    public RekognitionService(
        IAmazonRekognition rekognitionClient,
        RekognitionOptions options)
    {
        _rekognitionClient = rekognitionClient;
        _options = options;
    }

    public async Task<DetectedLabelDto> DetectLabelsAsync(
        Stream imageStream,
        CancellationToken cancellationToken = default)
    {
        if (imageStream.CanSeek)
        {
            imageStream.Position = 0;
        }

        await using var imageBytes = new MemoryStream();
        await imageStream.CopyToAsync(imageBytes, cancellationToken);

        var response = await _rekognitionClient.DetectLabelsAsync(
            new DetectLabelsRequest
            {
                Image = new Image
                {
                    Bytes = imageBytes
                },
                MaxLabels = _options.MaxLabels,
                MinConfidence = _options.MinConfidence
            },
            cancellationToken);

        var label = response.Labels
            .OrderByDescending(item => item.Confidence)
            .FirstOrDefault();

        if (label is null || string.IsNullOrWhiteSpace(label.Name))
        {
            throw new InvalidOperationException("Rekognition did not return any labels for the uploaded image.");
        }

        return new DetectedLabelDto(label.Name, label.Confidence);
    }
}
