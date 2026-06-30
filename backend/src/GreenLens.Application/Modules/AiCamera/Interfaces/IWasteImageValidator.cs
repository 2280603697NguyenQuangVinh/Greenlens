using GreenLens.Application.Modules.AiCamera.DTOs;

namespace GreenLens.Application.Modules.AiCamera.Interfaces;

public interface IWasteImageValidator
{
    WasteImageValidationResult Validate(RekognitionDetectionDto detection);
}
