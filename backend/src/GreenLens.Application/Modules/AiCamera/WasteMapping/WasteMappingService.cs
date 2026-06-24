using GreenLens.Application.Modules.AiCamera.DTOs;
using GreenLens.Application.Modules.AiCamera.Interfaces;
using GreenLens.Shared.Constants;

namespace GreenLens.Application.Modules.AiCamera.WasteMapping;

public sealed class WasteMappingService : IWasteMappingService
{
    private static readonly IReadOnlyList<string> HazardousLabels =
    [
        "Battery",
        "Medicine",
        "Pill",
        "Syringe",
        "Needle",
        "Chemical",
        "Paint",
        "Oil",
        "Glass",
        "Knife",
        "Blade",
        "Light Bulb",
        "Thermometer",
        "Electronic",
        "Phone",
        "Laptop",
        "Charger"
    ];

    private static readonly IReadOnlyDictionary<string, WasteCategoryDto> LabelMappings =
        new Dictionary<string, WasteCategoryDto>(StringComparer.OrdinalIgnoreCase)
        {
            ["Bottle"] = new(WasteCategories.Recyclable, "Green"),
            ["Plastic"] = new(WasteCategories.Recyclable, "Green"),
            ["Plastic Bag"] = new(WasteCategories.Recyclable, "Green"),
            ["Paper"] = new(WasteCategories.Recyclable, "Green"),
            ["Cardboard"] = new(WasteCategories.Recyclable, "Green"),
            ["Can"] = new(WasteCategories.Recyclable, "Green"),
            ["Aluminium"] = new(WasteCategories.Recyclable, "Green"),
            ["Aluminum"] = new(WasteCategories.Recyclable, "Green"),
            ["Carton"] = new(WasteCategories.Recyclable, "Green"),
            ["Newspaper"] = new(WasteCategories.Recyclable, "Green"),
            ["Envelope"] = new(WasteCategories.Recyclable, "Green"),
            ["Book"] = new(WasteCategories.Recyclable, "Green"),
            ["Food"] = new(WasteCategories.Organic, "Brown"),
            ["Banana"] = new(WasteCategories.Organic, "Brown"),
            ["Fruit"] = new(WasteCategories.Organic, "Brown"),
            ["Vegetable"] = new(WasteCategories.Organic, "Brown"),
            ["Leaf"] = new(WasteCategories.Organic, "Brown"),
            ["Peel"] = new(WasteCategories.Organic, "Brown"),
            ["Bread"] = new(WasteCategories.Organic, "Brown"),
            ["Egg"] = new(WasteCategories.Organic, "Brown"),
            ["Diaper"] = new(WasteCategories.NonRecyclable, "Gray"),
            ["Tissue"] = new(WasteCategories.NonRecyclable, "Gray"),
            ["Napkin"] = new(WasteCategories.NonRecyclable, "Gray"),
            ["Trash"] = new(WasteCategories.NonRecyclable, "Gray")
        };

    public WasteCategoryDto Map(string label)
    {
        if (string.IsNullOrWhiteSpace(label))
        {
            return DefaultCategory();
        }

        if (HazardousLabels.Any(hazardous => label.Contains(hazardous, StringComparison.OrdinalIgnoreCase)))
        {
            return new WasteCategoryDto(WasteCategories.Hazardous, "Red");
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
