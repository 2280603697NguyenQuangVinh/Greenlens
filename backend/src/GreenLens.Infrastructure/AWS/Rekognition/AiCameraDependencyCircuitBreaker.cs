namespace GreenLens.Infrastructure.AWS.Rekognition;

public sealed class AiCameraDependencyCircuitBreaker
{
    private readonly RekognitionOptions _options;
    private readonly Func<DateTimeOffset> _utcNow;
    private readonly object _lock = new();
    private int _failureCount;
    private DateTimeOffset? _openedUntil;

    public AiCameraDependencyCircuitBreaker(RekognitionOptions options)
        : this(options, () => DateTimeOffset.UtcNow)
    {
    }

    public AiCameraDependencyCircuitBreaker(
        RekognitionOptions options,
        Func<DateTimeOffset> utcNow)
    {
        _options = options;
        _utcNow = utcNow;
    }

    public bool CanExecute(out int retryAfterSeconds)
    {
        lock (_lock)
        {
            retryAfterSeconds = 0;
            if (_options.CircuitFailureThreshold <= 0 || _openedUntil is null)
            {
                return true;
            }

            var now = _utcNow();
            if (now >= _openedUntil.Value)
            {
                _openedUntil = null;
                return true;
            }

            retryAfterSeconds = Math.Max(1, (int)Math.Ceiling((_openedUntil.Value - now).TotalSeconds));
            return false;
        }
    }

    public void RecordSuccess()
    {
        lock (_lock)
        {
            _failureCount = 0;
            _openedUntil = null;
        }
    }

    public int RecordFailure()
    {
        lock (_lock)
        {
            if (_options.CircuitFailureThreshold <= 0)
            {
                return RetryAfterSeconds();
            }

            _failureCount++;
            if (_failureCount >= _options.CircuitFailureThreshold)
            {
                _openedUntil = _utcNow().AddSeconds(RetryAfterSeconds());
            }

            return RetryAfterSeconds();
        }
    }

    private int RetryAfterSeconds()
    {
        return Math.Max(1, _options.CircuitBreakSeconds);
    }
}
