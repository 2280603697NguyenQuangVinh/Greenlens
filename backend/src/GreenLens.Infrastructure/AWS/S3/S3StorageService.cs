using Amazon.S3;
using Amazon.S3.Model;
using GreenLens.Application.Modules.AiCamera.DTOs;
using GreenLens.Application.Modules.AiCamera.Interfaces;

namespace GreenLens.Infrastructure.AWS.S3;

public sealed class S3StorageService : IImageStorageService
{
    private readonly IAmazonS3 _s3Client;
    private readonly S3BucketOptions _options;
    private readonly S3KeyBuilder _keyBuilder;

    public S3StorageService(
        IAmazonS3 s3Client,
        S3BucketOptions options,
        S3KeyBuilder keyBuilder)
    {
        _s3Client = s3Client;
        _options = options;
        _keyBuilder = keyBuilder;
    }

    public async Task<S3UploadResultDto> UploadImageAsync(
        Stream imageStream,
        string fileName,
        string contentType,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_options.BucketName))
        {
            throw new InvalidOperationException("AI_CAMERA_BUCKET_NAME is not configured.");
        }

        if (imageStream.CanSeek)
        {
            imageStream.Position = 0;
        }

        var key = _keyBuilder.BuildUploadKey(fileName);
        var request = new PutObjectRequest
        {
            BucketName = _options.BucketName,
            Key = key,
            InputStream = imageStream,
            ContentType = string.IsNullOrWhiteSpace(contentType) ? "image/jpeg" : contentType
        };

        await _s3Client.PutObjectAsync(request, cancellationToken);

        return new S3UploadResultDto(key, BuildS3Url(key));
    }

    private string BuildS3Url(string key)
    {
        var encodedKey = Uri.EscapeDataString(key).Replace("%2F", "/", StringComparison.Ordinal);
        return $"https://{_options.BucketName}.s3.{_options.Region}.amazonaws.com/{encodedKey}";
    }
}
