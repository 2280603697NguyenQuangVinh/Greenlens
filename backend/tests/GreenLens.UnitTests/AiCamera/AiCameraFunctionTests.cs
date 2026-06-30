using System.Net;
using System.Text;
using Amazon.Lambda.APIGatewayEvents;
using Amazon.Lambda.Core;
using GreenLens.Api.Functions;
using GreenLens.Application.Modules.AiCamera.DTOs;
using GreenLens.Application.Modules.AiCamera.Interfaces;
using GreenLens.Application.Modules.AiCamera.Services;
using Xunit;

namespace GreenLens.UnitTests.AiCamera;

public sealed class AiCameraFunctionTests
{
    [Fact]
    public async Task AnalyzeAsync_ParsesMultipartRequest()
    {
        var service = new CapturingAiCameraService();
        var function = new AiCameraFunction(service);
        var request = BuildMultipartRequest(isBase64Encoded: false);

        var response = await function.AnalyzeAsync(request, new TestLambdaContext());

        Assert.Equal((int)HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(service.Request);
        Assert.Equal("child_123", service.Request.ChildId);
        Assert.Equal("image.jpg", service.Request.FileName);
        Assert.Equal("image/jpeg", service.Request.ContentType);
        Assert.Equal(3, service.ImageBytes.Length);
    }

    [Fact]
    public async Task AnalyzeAsync_ParsesBase64MultipartRequest()
    {
        var service = new CapturingAiCameraService();
        var function = new AiCameraFunction(service);
        var request = BuildMultipartRequest(isBase64Encoded: true);

        var response = await function.AnalyzeAsync(request, new TestLambdaContext());

        Assert.Equal((int)HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("child_123", service.Request?.ChildId);
        Assert.Equal(new byte[] { 1, 2, 3 }, service.ImageBytes);
    }

    [Fact]
    public async Task AnalyzeAsync_WhenImageIsNotWaste_Returns422()
    {
        var service = new CapturingAiCameraService
        {
            InvalidImageException = new AiCameraInvalidImageException(
                "Hình ảnh không phải rác hoặc chưa đủ rõ để phân loại.",
                "not_waste_image",
                "Body Part",
                100)
        };
        var function = new AiCameraFunction(service);
        var request = BuildMultipartRequest(isBase64Encoded: true);

        var response = await function.AnalyzeAsync(request, new TestLambdaContext());

        Assert.Equal((int)HttpStatusCode.UnprocessableEntity, response.StatusCode);
        Assert.Contains("\"reason\":\"not_waste_image\"", response.Body);
        Assert.Contains("\"detectedLabel\":\"Body Part\"", response.Body);
        Assert.Contains("\"confidence\":100", response.Body);
    }

    [Fact]
    public async Task AnalyzeAsync_WhenRekognitionUnavailable_Returns503()
    {
        var service = new CapturingAiCameraService
        {
            DependencyUnavailableException = new AiCameraDependencyUnavailableException(
                "Dịch vụ nhận diện ảnh đang bận. Hãy thử lại sau ít phút.",
                "rekognition_unavailable",
                60)
        };
        var function = new AiCameraFunction(service);
        var request = BuildMultipartRequest(isBase64Encoded: true);

        var response = await function.AnalyzeAsync(request, new TestLambdaContext());

        Assert.Equal((int)HttpStatusCode.ServiceUnavailable, response.StatusCode);
        Assert.Equal("60", response.Headers["Retry-After"]);
        Assert.Contains("\"reason\":\"rekognition_unavailable\"", response.Body);
        Assert.Contains("\"retryAfterSeconds\":60", response.Body);
    }

    private static APIGatewayProxyRequest BuildMultipartRequest(bool isBase64Encoded)
    {
        const string boundary = "greenlens-boundary";
        var bodyText =
            $"--{boundary}\r\n" +
            "Content-Disposition: form-data; name=\"childId\"\r\n\r\n" +
            "child_123\r\n" +
            $"--{boundary}\r\n" +
            "Content-Disposition: form-data; name=\"image\"; filename=\"image.jpg\"\r\n" +
            "Content-Type: image/jpeg\r\n\r\n";

        var body = new List<byte>();
        body.AddRange(Encoding.UTF8.GetBytes(bodyText));
        body.AddRange(new byte[] { 1, 2, 3 });
        body.AddRange(Encoding.UTF8.GetBytes($"\r\n--{boundary}--\r\n"));

        return new APIGatewayProxyRequest
        {
            Headers = new Dictionary<string, string>
            {
                ["Content-Type"] = $"multipart/form-data; boundary={boundary}"
            },
            IsBase64Encoded = isBase64Encoded,
            Body = isBase64Encoded
                ? Convert.ToBase64String(body.ToArray())
                : Encoding.UTF8.GetString(body.ToArray())
        };
    }

    private sealed class CapturingAiCameraService : IAiCameraService
    {
        public AiCameraAnalyzeRequest? Request { get; private set; }
        public byte[] ImageBytes { get; private set; } = Array.Empty<byte>();
        public AiCameraInvalidImageException? InvalidImageException { get; init; }
        public AiCameraDependencyUnavailableException? DependencyUnavailableException { get; init; }

        public async Task<AiCameraAnalyzeResponse> AnalyzeAsync(
            AiCameraAnalyzeRequest request,
            CancellationToken cancellationToken = default)
        {
            Request = request;
            await using var imageCopy = new MemoryStream();
            await request.ImageStream.CopyToAsync(imageCopy, cancellationToken);
            ImageBytes = imageCopy.ToArray();

            if (InvalidImageException is not null)
            {
                throw InvalidImageException;
            }

            if (DependencyUnavailableException is not null)
            {
                throw DependencyUnavailableException;
            }

            return new AiCameraAnalyzeResponse(
                request.ChildId,
                "Bottle",
                96.7,
                "Recyclable",
                "Green",
                "Guide",
                "Reuse",
                "Impact",
                "uploads/2026/06/13/image.jpg",
                "https://example.test/image.jpg");
        }
    }

    private sealed class TestLambdaContext : ILambdaContext
    {
        public string AwsRequestId => "test-request";
        public IClientContext ClientContext => null!;
        public string FunctionName => "test-function";
        public string FunctionVersion => "1";
        public ICognitoIdentity Identity => null!;
        public string InvokedFunctionArn => "arn:aws:lambda:test";
        public ILambdaLogger Logger { get; } = new TestLambdaLogger();
        public string LogGroupName => "test-log-group";
        public string LogStreamName => "test-log-stream";
        public int MemoryLimitInMB => 256;
        public TimeSpan RemainingTime => TimeSpan.FromMinutes(1);
    }

    private sealed class TestLambdaLogger : ILambdaLogger
    {
        public void Log(string message)
        {
        }

        public void LogLine(string message)
        {
        }
    }
}
