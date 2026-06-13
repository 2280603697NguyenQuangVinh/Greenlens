using GreenLens.Shared.Constants;

namespace GreenLens.Infrastructure.AWS.S3;

public sealed class S3KeyBuilder
{
    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg",
        ".jpeg",
        ".png",
        ".webp"
    };

    public string BuildUploadKey(string fileName, DateTimeOffset? now = null)
    {
        var timestamp = now ?? DateTimeOffset.UtcNow;
        var extension = Path.GetExtension(fileName);

        if (string.IsNullOrWhiteSpace(extension) || !AllowedExtensions.Contains(extension))
        {
            extension = ".jpg";
        }

        return string.Join(
            '/',
            S3Folders.Uploads,
            timestamp.ToString("yyyy"),
            timestamp.ToString("MM"),
            timestamp.ToString("dd"),
            $"{Guid.NewGuid():N}{extension.ToLowerInvariant()}");
    }
}
