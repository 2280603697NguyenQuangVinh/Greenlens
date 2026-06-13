using GreenLens.Application.Modules.AiCamera.DTOs;
using GreenLens.Application.Modules.AiCamera.Interfaces;
using GreenLens.Shared.Constants;

namespace GreenLens.Application.Modules.AiCamera.WasteMapping;

public sealed class WasteMappingService : IWasteMappingService
{
    private static readonly IReadOnlyDictionary<string, WasteCategoryDto> LabelMappings =
        new Dictionary<string, WasteCategoryDto>(StringComparer.OrdinalIgnoreCase)
        {
            ["Bottle"] = new(WasteCategories.Recyclable, "Green"),
            ["Plastic"] = new(WasteCategories.Recyclable, "Green"),
            ["Paper"] = new(WasteCategories.Recyclable, "Green"),
            ["Food"] = new(WasteCategories.Organic, "Brown"),
            ["Battery"] = new(WasteCategories.Hazardous, "Red"),
            ["Trash"] = new(WasteCategories.NonRecyclable, "Gray")
        };

    public WasteCategoryDto Map(string label)
    {
        if (string.IsNullOrWhiteSpace(label))
        {
            return DefaultCategory();
        }

        foreach (var mapping in LabelMappings)
        {
            if (label.Contains(mapping.Key, StringComparison.OrdinalIgnoreCase))
            {
                return mapping.Value;
            }
        }

        return DefaultCategory();
    }

    private static WasteCategoryDto DefaultCategory()
    {
        return new WasteCategoryDto(WasteCategories.NonRecyclable, "Gray");
    }
}
