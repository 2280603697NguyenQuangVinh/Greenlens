using GreenLens.Application.Modules.AiCamera.DTOs;
using GreenLens.Application.Modules.AiCamera.Interfaces;
using GreenLens.Application.Modules.AiCamera.Services;
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
        var service = new AiCameraService(imageStorage, rekognition, wasteMapping, bedrock);

        await using var image = new MemoryStream(new byte[] { 1, 2, 3 });
        var response = await service.AnalyzeAsync(new AiCameraAnalyzeRequest(
            "child_123",
            image,
            "bottle.png",
            "image/png"));

        Assert.Equal("child_123", response.ChildId);
        Assert.Equal("Bottle", response.Label);
        Assert.Equal(96.7, response.Confidence);
        Assert.Equal("Recyclable", response.Category);
        Assert.Equal("Green", response.BinColor);
        Assert.Equal("uploads/2026/06/13/image.png", response.S3ImageKey);
        Assert.True(imageStorage.WasCalled);
        Assert.True(rekognition.WasCalled);
        Assert.True(bedrock.WasCalled);
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
}
