using Amazon;
using Amazon.Rekognition;
using Amazon.Rekognition.Model;
using Amazon.Runtime;
using GreenLens.Application.Modules.AiCamera.Services;
using GreenLens.Infrastructure.AWS.Rekognition;
using Xunit;

namespace GreenLens.UnitTests.AiCamera;

public sealed class RekognitionServiceTests
{
    [Fact]
    public async Task DetectLabelsAsync_WhenClientSucceeds_ReturnsDetectionAndResetsCircuit()
    {
        DetectLabelsRequest? capturedRequest = null;
        var client = new FakeAmazonRekognitionClient(request =>
        {
            capturedRequest = request;
            return Task.FromResult(new DetectLabelsResponse
            {
                Labels =
                [
                    new Label { Name = "Bottle", Confidence = 96.7f }
                ]
            });
        });
        var options = new RekognitionOptions { MaxLabels = 25, MinConfidence = 35, TimeoutSeconds = 5 };
        var breaker = new AiCameraDependencyCircuitBreaker(options);
        var service = new RekognitionService(client, options, breaker);

        await using var image = new MemoryStream(JpegBytes());
        var result = await service.DetectLabelsAsync(image);

        Assert.Equal("Bottle", result.Label);
        Assert.Equal(96.7f, result.Confidence);
        Assert.Single(result.Labels);
        Assert.NotNull(capturedRequest);
        Assert.Equal(25, capturedRequest.MaxLabels);
        Assert.Equal(35, capturedRequest.MinConfidence);
    }

    [Fact]
    public async Task DetectLabelsAsync_DefaultOptions_UseDeeperLabelScan()
    {
        DetectLabelsRequest? capturedRequest = null;
        var client = new FakeAmazonRekognitionClient(request =>
        {
            capturedRequest = request;
            return Task.FromResult(new DetectLabelsResponse
            {
                Labels =
                [
                    new Label { Name = "Paper", Confidence = 91.4f }
                ]
            });
        });
        var options = new RekognitionOptions { TimeoutSeconds = 5 };
        var breaker = new AiCameraDependencyCircuitBreaker(options);
        var service = new RekognitionService(client, options, breaker);

        await using var image = new MemoryStream(JpegBytes());
        await service.DetectLabelsAsync(image);

        Assert.NotNull(capturedRequest);
        Assert.Equal(25, capturedRequest.MaxLabels);
        Assert.Equal(35, capturedRequest.MinConfidence);
    }

    [Fact]
    public async Task DetectLabelsAsync_WhenClientThrowsRekognitionException_ThrowsDependencyUnavailable()
    {
        var client = new FakeAmazonRekognitionClient(_ =>
            throw new AmazonRekognitionException("service down"));
        var options = new RekognitionOptions { TimeoutSeconds = 5, CircuitBreakSeconds = 60 };
        var breaker = new AiCameraDependencyCircuitBreaker(options);
        var service = new RekognitionService(client, options, breaker);

        await using var image = new MemoryStream(JpegBytes());
        var exception = await Assert.ThrowsAsync<AiCameraDependencyUnavailableException>(() =>
            service.DetectLabelsAsync(image));

        Assert.Equal("rekognition_unavailable", exception.Reason);
        Assert.Equal(60, exception.RetryAfterSeconds);
    }

    [Fact]
    public async Task DetectLabelsAsync_WhenClientTimesOut_ThrowsDependencyUnavailable()
    {
        var client = new FakeAmazonRekognitionClient(async (_, cancellationToken) =>
        {
            await Task.Delay(TimeSpan.FromSeconds(30), cancellationToken);
            return new DetectLabelsResponse();
        });
        var options = new RekognitionOptions { TimeoutSeconds = 1, CircuitBreakSeconds = 60 };
        var breaker = new AiCameraDependencyCircuitBreaker(options);
        var service = new RekognitionService(client, options, breaker);

        await using var image = new MemoryStream(JpegBytes());
        var exception = await Assert.ThrowsAsync<AiCameraDependencyUnavailableException>(() =>
            service.DetectLabelsAsync(image));

        Assert.Equal("rekognition_unavailable", exception.Reason);
        Assert.Equal(60, exception.RetryAfterSeconds);
    }

    private static byte[] JpegBytes()
    {
        return [0xFF, 0xD8, 0xFF, 0x00];
    }

    private sealed class FakeAmazonRekognitionClient : AmazonRekognitionClient
    {
        private readonly Func<DetectLabelsRequest, CancellationToken, Task<DetectLabelsResponse>> _handler;

        public FakeAmazonRekognitionClient(Func<DetectLabelsRequest, Task<DetectLabelsResponse>> handler)
            : this((request, _) => handler(request))
        {
        }

        public FakeAmazonRekognitionClient(
            Func<DetectLabelsRequest, CancellationToken, Task<DetectLabelsResponse>> handler)
            : base(new AnonymousAWSCredentials(), RegionEndpoint.APSoutheast1)
        {
            _handler = handler;
        }

        public override Task<DetectLabelsResponse> DetectLabelsAsync(
            DetectLabelsRequest request,
            CancellationToken cancellationToken = default)
        {
            return _handler(request, cancellationToken);
        }
    }
}
