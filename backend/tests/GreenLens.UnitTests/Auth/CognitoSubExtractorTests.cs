using System.Text;
using System.Text.Json;
using GreenLens.Api.Auth;
using Xunit;

namespace GreenLens.UnitTests.Auth;

public sealed class CognitoSubExtractorTests
{
    [Fact]
    public void ExtractFromAuthorizationHeader_ReturnsSubForValidBearerJwt()
    {
        var token = BuildUnsignedJwt("child-sub", DateTimeOffset.UtcNow.AddMinutes(10));
        var extractor = new CognitoSubExtractor();

        var sub = extractor.ExtractFromAuthorizationHeader($"Bearer {token}");

        Assert.Equal("child-sub", sub);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("Basic token")]
    [InlineData("Bearer not-a-jwt")]
    public void ExtractFromAuthorizationHeader_ReturnsNullForMissingOrInvalidBearerJwt(string? authorizationHeader)
    {
        var extractor = new CognitoSubExtractor();

        var sub = extractor.ExtractFromAuthorizationHeader(authorizationHeader);

        Assert.Null(sub);
    }

    [Fact]
    public void ExtractFromAuthorizationHeader_ReturnsNullForExpiredJwt()
    {
        var token = BuildUnsignedJwt("child-sub", DateTimeOffset.UtcNow.AddMinutes(-1));
        var extractor = new CognitoSubExtractor();

        var sub = extractor.ExtractFromAuthorizationHeader($"Bearer {token}");

        Assert.Null(sub);
    }

    private static string BuildUnsignedJwt(string sub, DateTimeOffset expiresAt)
    {
        var header = Base64UrlEncode(JsonSerializer.SerializeToUtf8Bytes(new
        {
            alg = "none",
            typ = "JWT"
        }));

        var payload = Base64UrlEncode(JsonSerializer.SerializeToUtf8Bytes(new
        {
            sub,
            exp = expiresAt.ToUnixTimeSeconds()
        }));

        return $"{header}.{payload}.signature";
    }

    private static string Base64UrlEncode(byte[] value)
    {
        return Convert.ToBase64String(value)
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');
    }
}
