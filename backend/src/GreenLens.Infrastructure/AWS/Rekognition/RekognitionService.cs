using Amazon.Rekognition;
using Amazon.Rekognition.Model;
using Amazon.Runtime;
using GreenLens.Application.Modules.AiCamera.DTOs;
using GreenLens.Application.Modules.AiCamera.Interfaces;
using GreenLens.Application.Modules.AiCamera.Services;

namespace GreenLens.Infrastructure.AWS.Rekognition;

public sealed class RekognitionService : IRekognitionService
{
    private static readonly string[] BatteryTextHints =
    [
        "battery",
        "alkaline battery",
        "duracell",
        "energizer",
        "aa",
        "aaa"
    ];

    private static readonly string[] PreferredWasteLabels =
    [
        "Battery",
        "Paper",
        "Cardboard",
        "Bottle",
        "Plastic Bottle",
        "Plastic Bag",
        "Plastic",
        "Can",
        "Aluminium",
        "Food",
        "Banana",
        "Trash"
    ];

    private readonly IAmazonRekognition _rekognitionClient;
    private readonly RekognitionOptions _options;
    private readonly AiCameraDependencyCircuitBreaker _circuitBreaker;

    public RekognitionService(
        IAmazonRekognition rekognitionClient,
        RekognitionOptions options,
        AiCameraDependencyCircuitBreaker circuitBreaker)
    {
        _rekognitionClient = rekognitionClient;
        _options = options;
        _circuitBreaker = circuitBreaker;
    }

    public async Task<RekognitionDetectionDto> DetectLabelsAsync(
        Stream imageStream,
        CancellationToken cancellationToken = default)
    {
        if (imageStream.CanSeek)
        {
            imageStream.Position = 0;
        }

        await using var imageBytes = new MemoryStream();
        await imageStream.CopyToAsync(imageBytes, cancellationToken);

        if (!_circuitBreaker.CanExecute(out var retryAfterSeconds))
        {
            throw RekognitionUnavailable(retryAfterSeconds);
        }

        DetectLabelsResponse response;
        using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        timeoutCts.CancelAfter(TimeSpan.FromSeconds(Math.Max(1, _options.TimeoutSeconds)));

        try
        {
            response = await _rekognitionClient.DetectLabelsAsync(
                new DetectLabelsRequest
                {
                    Image = new Image
                    {
                        Bytes = imageBytes
                    },
                    MaxLabels = _options.MaxLabels,
                    MinConfidence = _options.MinConfidence
                },
                timeoutCts.Token);
            _circuitBreaker.RecordSuccess();
        }
        catch (OperationCanceledException exception) when (!cancellationToken.IsCancellationRequested)
        {
            throw RekognitionUnavailable(_circuitBreaker.RecordFailure(), exception);
        }
        catch (AmazonRekognitionException exception)
        {
            throw RekognitionUnavailable(_circuitBreaker.RecordFailure(), exception);
        }
        catch (AmazonServiceException exception)
        {
            throw RekognitionUnavailable(_circuitBreaker.RecordFailure(), exception);
        }

        var textHint = await TryDetectBatteryTextHintAsync(imageBytes, cancellationToken);

        var labels = response.Labels
            .Where(label => !string.IsNullOrWhiteSpace(label.Name))
            .OrderByDescending(label => label.Confidence)
            .Select(label => new DetectedLabelDto(label.Name, label.Confidence))
            .ToArray();

        if (textHint is not null)
        {
            var mergedLabels = labels
                .Where(label => !label.Label.Contains("Battery", StringComparison.OrdinalIgnoreCase))
                .ToList();

            mergedLabels.Insert(0, textHint);
            labels = mergedLabels.ToArray();
        }

        var label = response.Labels
            .Where(IsPreferredWasteLabel)
            .OrderByDescending(item => item.Confidence)
            .FirstOrDefault() ??
            response.Labels
                .OrderByDescending(item => item.Confidence)
                .FirstOrDefault();

        if (textHint is not null &&
            (label is null || textHint.Confidence >= label.Confidence || !label.Name.Contains("Battery", StringComparison.OrdinalIgnoreCase)))
        {
            label = new Label
            {
                Name = textHint.Label,
                Confidence = (float)textHint.Confidence
            };
        }

        if (label is null || string.IsNullOrWhiteSpace(label.Name))
        {
            throw new InvalidOperationException("Rekognition did not return any labels for the uploaded image.");
        }

        return new RekognitionDetectionDto(label.Name, label.Confidence, labels);
    }

    private static AiCameraDependencyUnavailableException RekognitionUnavailable(
        int retryAfterSeconds,
        Exception? exception = null)
    {
        return new AiCameraDependencyUnavailableException(
            "Dịch vụ nhận diện ảnh đang bận. Hãy thử lại sau ít phút.",
            "rekognition_unavailable",
            retryAfterSeconds,
            exception);
    }

    private static bool IsPreferredWasteLabel(Label label)
    {
        if (string.IsNullOrWhiteSpace(label.Name))
        {
            return false;
        }

        return PreferredWasteLabels.Any(preferred =>
            label.Name.Contains(preferred, StringComparison.OrdinalIgnoreCase));
    }

    private async Task<DetectedLabelDto?> TryDetectBatteryTextHintAsync(
        MemoryStream imageBytes,
        CancellationToken cancellationToken)
    {
        try
        {
            imageBytes.Position = 0;

            using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            timeoutCts.CancelAfter(TimeSpan.FromSeconds(Math.Max(1, _options.TimeoutSeconds)));

            var response = await _rekognitionClient.DetectTextAsync(
                new DetectTextRequest
                {
                    Image = new Image
                    {
                        Bytes = imageBytes
                    }
                },
                timeoutCts.Token);

            var matchedText = response.TextDetections
                .Where(item => item.Type == TextTypes.LINE || item.Type == TextTypes.WORD)
                .FirstOrDefault(item =>
                    !string.IsNullOrWhiteSpace(item.DetectedText) &&
                    BatteryTextHints.Any(hint =>
                        item.DetectedText.Contains(hint, StringComparison.OrdinalIgnoreCase)));

            if (matchedText is null)
            {
                return null;
            }

            return new DetectedLabelDto("Battery", Math.Max(matchedText.Confidence, 95));
        }
        catch (Exception)
        {
            return null;
        }
        finally
        {
            imageBytes.Position = 0;
        }
    }
}
