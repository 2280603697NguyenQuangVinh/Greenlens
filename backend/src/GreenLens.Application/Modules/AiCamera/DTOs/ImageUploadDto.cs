namespace GreenLens.Application.Modules.AiCamera.DTOs;

public sealed record AiCameraAnalyzeRequest(
    string ChildId,
    Stream ImageStream,
    string FileName,
    string ContentType);

public sealed record S3UploadResultDto(
    string S3ImageKey,
    string S3Url);
