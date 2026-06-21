using GreenLens.Application.Modules.AiCamera.DTOs;
using GreenLens.Application.Modules.AiCamera.Interfaces;
using GreenLens.Application.Modules.AiCamera.Services;
using GreenLens.Application.Modules.ChildProfiles.Interfaces;
using Xunit;

namespace GreenLens.UnitTests.AiCamera;

public sealed class AiCameraServiceTests
{
    [Fact]
    public async Task AnalyzeAsync_CallsPipelineAndBuildsResponse()
    {
        var imageStorage = new FakeImageStorageService();
        var rekognition = new FakeRekognitionService();
        var wasteMapping = new FakeWasteMappingService();
        var bedrock = new FakeBedrockGuidanceService();
        var usageLimiter = new FakeUsageLimiter();
        var progress = new FakeChildProgressService();
        var service = new AiCameraService(imageStorage, rekognition, wasteMapping, bedrock, usageLimiter, progress);

        await using var image = new MemoryStream(PngBytes());
        var response = await service.AnalyzeAsync(new AiCameraAnalyzeRequest(
            "child_123",
            image,
            "bottle.png",
            "image/png",
            "cognito-sub-123"));

        Assert.Equal("child_123", response.ChildId);
        Assert.Equal("Bottle", response.Label);
        Assert.Equal(96.7, response.Confidence);
        Assert.Equal("Recyclable", response.Category);
        Assert.Equal("Green", response.BinColor);
        Assert.Equal("uploads/2026/06/13/image.png", response.S3ImageKey);
        Assert.True(imageStorage.WasCalled);
        Assert.True(rekognition.WasCalled);
        Assert.True(bedrock.WasCalled);
        Assert.True(usageLimiter.WasCalled);
        Assert.True(progress.WasCalled);
    }

    [Fact]
    public async Task AnalyzeAsync_WhenQuotaExceeded_DoesNotCallPipeline()
    {
        var imageStorage = new FakeImageStorageService();
        var rekognition = new FakeRekognitionService();
        var wasteMapping = new FakeWasteMappingService();
        var bedrock = new FakeBedrockGuidanceService();
        var usageLimiter = new FakeUsageLimiter(false);
        var progress = new FakeChildProgressService();
        var service = new AiCameraService(imageStorage, rekognition, wasteMapping, bedrock, usageLimiter, progress);

        await using var image = new MemoryStream(PngBytes());
        var exception = await Assert.ThrowsAsync<AiCameraQuotaExceededException>(() =>
            service.AnalyzeAsync(new AiCameraAnalyzeRequest(
                "child_123",
                image,
                "bottle.png",
                "image/png",
                "cognito-sub-123")));

        Assert.Equal("Daily limit reached.", exception.Message);
        Assert.True(usageLimiter.WasCalled);
        Assert.False(imageStorage.WasCalled);
        Assert.False(rekognition.WasCalled);
        Assert.False(bedrock.WasCalled);
        Assert.False(progress.WasCalled);
    }

    private static byte[] PngBytes()
    {
        return [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00];
    }

    private sealed class FakeImageStorageService : IImageStorageService
    {
        public bool WasCalled { get; private set; }

        public Task<S3UploadResultDto> UploadImageAsync(
            Stream imageStream,
            string fileName,
            string contentType,
            CancellationToken cancellationToken = default)
        {
            WasCalled = true;
            Assert.Equal("bottle.png", fileName);
            Assert.Equal("image/png", contentType);
            Assert.Equal(0, imageStream.Position);
            return Task.FromResult(new S3UploadResultDto(
                "uploads/2026/06/13/image.png",
                "https://example.test/uploads/2026/06/13/image.png"));
        }
    }

    private sealed class FakeRekognitionService : IRekognitionService
    {
        public bool WasCalled { get; private set; }

        public Task<DetectedLabelDto> DetectLabelsAsync(
            Stream imageStream,
            CancellationToken cancellationToken = default)
        {
            WasCalled = true;
            Assert.Equal(0, imageStream.Position);
            return Task.FromResult(new DetectedLabelDto("Bottle", 96.74));
        }
    }

    private sealed class FakeWasteMappingService : IWasteMappingService
    {
        public WasteCategoryDto Map(string label)
        {
            Assert.Equal("Bottle", label);
            return new WasteCategoryDto("Recyclable", "Green");
        }
    }

    private sealed class FakeBedrockGuidanceService : IBedrockGuidanceService
    {
        public bool WasCalled { get; private set; }

        public Task<BedrockGuidanceDto> GenerateGuidanceAsync(
            string label,
            string category,
            CancellationToken cancellationToken = default)
        {
            WasCalled = true;
            Assert.Equal("Bottle", label);
            Assert.Equal("Recyclable", category);
            return Task.FromResult(new BedrockGuidanceDto(
                "Rửa sạch trước khi bỏ vào thùng tái chế.",
                "Có thể dùng làm chậu cây nhỏ.",
                "Tái chế giúp giảm rác ngoài môi trường."));
        }
    }

    private sealed class FakeUsageLimiter : IAiCameraUsageLimiter
    {
        private readonly bool _allowed;

        public FakeUsageLimiter(bool allowed = true)
        {
            _allowed = allowed;
        }

        public bool WasCalled { get; private set; }

        public Task<AiCameraUsageQuotaResult> CheckAndConsumeAsync(
            string cognitoSub,
            string childId,
            CancellationToken cancellationToken = default)
        {
            WasCalled = true;
            Assert.Equal("cognito-sub-123", cognitoSub);
            Assert.Equal("child_123", childId);

            return Task.FromResult(_allowed
                ? new AiCameraUsageQuotaResult(true)
                : new AiCameraUsageQuotaResult(false, "Daily limit reached."));
        }
    }

    private sealed class FakeChildProgressService : IChildProgressService
    {
        public bool WasCalled { get; private set; }

        public Task AwardAiCameraScanAsync(
            string childId,
            string cognitoSub,
            CancellationToken cancellationToken = default)
        {
            WasCalled = true;
            Assert.Equal("child_123", childId);
            Assert.Equal("cognito-sub-123", cognitoSub);
            return Task.CompletedTask;
        }

        public Task AwardQuizAsync(
            string childId,
            string cognitoSub,
            int correctAnswers,
            int totalQuestions,
            CancellationToken cancellationToken = default)
        {
            throw new NotSupportedException();
        }

        public Task AwardMiniGameAsync(
            string childId,
            string cognitoSub,
            int score,
            int xpAwarded,
            CancellationToken cancellationToken = default)
        {
            throw new NotSupportedException();
        }
    }
}
