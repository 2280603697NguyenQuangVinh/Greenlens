namespace GreenLens.Application.Modules.AiCamera.Services;

public sealed class AiCameraQuotaExceededException : Exception
{
    public AiCameraQuotaExceededException(string message)
        : base(message)
    {
    }
}
