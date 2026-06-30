namespace GreenLens.Application.Modules.AiCamera.Services;

public sealed class AiCameraDependencyUnavailableException : Exception
{
    public AiCameraDependencyUnavailableException(
        string message,
        string reason,
        int retryAfterSeconds,
        Exception? innerException = null)
        : base(message, innerException)
    {
        Reason = reason;
        RetryAfterSeconds = retryAfterSeconds;
    }

    public string Reason { get; }

    public int RetryAfterSeconds { get; }
}
