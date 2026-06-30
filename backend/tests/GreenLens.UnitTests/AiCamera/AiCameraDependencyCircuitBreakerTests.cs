using GreenLens.Infrastructure.AWS.Rekognition;
using Xunit;

namespace GreenLens.UnitTests.AiCamera;

public sealed class AiCameraDependencyCircuitBreakerTests
{
    [Fact]
    public void CanExecute_AfterFailureThreshold_ReturnsFalseUntilBreakWindowExpires()
    {
        var now = new DateTimeOffset(2026, 6, 30, 10, 0, 0, TimeSpan.Zero);
        var breaker = new AiCameraDependencyCircuitBreaker(
            new RekognitionOptions
            {
                CircuitFailureThreshold = 3,
                CircuitBreakSeconds = 60
            },
            () => now);

        Assert.True(breaker.CanExecute(out var retryAfterBeforeFailure));
        Assert.Equal(0, retryAfterBeforeFailure);

        breaker.RecordFailure();
        breaker.RecordFailure();
        Assert.True(breaker.CanExecute(out var retryAfterBeforeOpen));
        Assert.Equal(0, retryAfterBeforeOpen);

        var retryAfter = breaker.RecordFailure();
        Assert.Equal(60, retryAfter);

        Assert.False(breaker.CanExecute(out var retryAfterOpen));
        Assert.Equal(60, retryAfterOpen);

        now = now.AddSeconds(61);

        Assert.True(breaker.CanExecute(out var retryAfterAfterWindow));
        Assert.Equal(0, retryAfterAfterWindow);
    }

    [Fact]
    public void RecordSuccess_ResetsFailureCount()
    {
        var now = new DateTimeOffset(2026, 6, 30, 10, 0, 0, TimeSpan.Zero);
        var breaker = new AiCameraDependencyCircuitBreaker(
            new RekognitionOptions
            {
                CircuitFailureThreshold = 3,
                CircuitBreakSeconds = 60
            },
            () => now);

        breaker.RecordFailure();
        breaker.RecordFailure();
        breaker.RecordSuccess();
        breaker.RecordFailure();

        Assert.True(breaker.CanExecute(out var retryAfter));
        Assert.Equal(0, retryAfter);
    }
}
