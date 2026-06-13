using GreenLens.Application.Modules.AiCamera.DTOs;

namespace GreenLens.Application.Modules.AiCamera.Interfaces;

public interface IWasteMappingService
{
    WasteCategoryDto Map(string label);
}
