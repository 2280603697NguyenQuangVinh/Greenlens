namespace GreenLens.Infrastructure.AWS.S3;

public sealed class S3BucketOptions
{
    public string BucketName { get; init; } = string.Empty;
    public string Region { get; init; } = "ap-southeast-1";
}
