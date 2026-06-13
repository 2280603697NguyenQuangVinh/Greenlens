using GreenLens.Infrastructure.AWS.S3;
using Xunit;

namespace GreenLens.UnitTests.AiCamera;

public sealed class S3KeyBuilderTests
{
    [Fact]
    public void BuildUploadKey_UsesUploadDateFoldersAndPreservesSafeExtension()
    {
        var builder = new S3KeyBuilder();

        var key = builder.BuildUploadKey("plastic-bottle.PNG", new DateTimeOffset(2026, 6, 13, 1, 2, 3, TimeSpan.Zero));

        Assert.StartsWith("uploads/2026/06/13/", key);
        Assert.EndsWith(".png", key);
    }

    [Fact]
    public void BuildUploadKey_DefaultsUnsafeExtensionToJpg()
    {
        var builder = new S3KeyBuilder();

        var key = builder.BuildUploadKey("payload.exe", new DateTimeOffset(2026, 6, 13, 1, 2, 3, TimeSpan.Zero));

        Assert.EndsWith(".jpg", key);
    }
}
