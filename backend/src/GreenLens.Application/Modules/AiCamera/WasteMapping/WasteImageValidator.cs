using GreenLens.Application.Modules.AiCamera.DTOs;
using GreenLens.Application.Modules.AiCamera.Interfaces;

namespace GreenLens.Application.Modules.AiCamera.WasteMapping;

public sealed class WasteImageValidator : IWasteImageValidator
{
    private const double WasteConfidenceThreshold = 70;
    private const double HandHeldWasteConfidenceThreshold = 50;
    private const double HazardousWasteConfidenceThreshold = 55;
    private const double BlockConfidenceThreshold = 80;
    private const string NotWasteReason = "not_waste_image";
    private const string UncertainReason = "uncertain_detection";

    private static readonly string[] AcceptedWasteLabels =
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
        "Charger",
        "Bottle",
        "Plastic Bottle",
        "Plastic Bag",
        "Plastic",
        "Paper",
        "Cardboard",
        "Tin",
        "Tin Can",
        "Can",
        "Aluminium",
        "Aluminum",
        "Carton",
        "Cup",
        "Container",
        "Jar",
        "Box",
        "Wrapper",
        "Packet",
        "Packaging",
        "Plastic Container",
        "Foil",
        "Newspaper",
        "Envelope",
        "Book",
        "Food",
        "Banana",
        "Fruit",
        "Vegetable",
        "Leaf",
        "Peel",
        "Bread",
        "Egg",
        "Diaper",
        "Tissue",
        "Napkin",
        "Trash",
        "Garbage",
        "Waste",
        "Rubbish"
    ];

    private static readonly string[] BlockedLabels =
    [
        "Person",
        "People",
        "Human",
        "Body",
        "Body Part",
        "Hand",
        "Finger",
        "Arm",
        "Leg",
        "Foot",
        "Face",
        "Head",
        "Skin",
        "Animal",
        "Pet",
        "Dog",
        "Cat",
        "Bird"
    ];

    public WasteImageValidationResult Validate(RekognitionDetectionDto detection)
    {
        var labels = detection.Labels
            .Where(label => !string.IsNullOrWhiteSpace(label.Label))
            .OrderByDescending(label => label.Confidence)
            .ToArray();

        var topLabel = labels.FirstOrDefault() ??
            (string.IsNullOrWhiteSpace(detection.Label)
                ? null
                : new DetectedLabelDto(detection.Label, detection.Confidence));

        if (topLabel is null)
        {
            return new WasteImageValidationResult(false, UncertainReason, null, null);
        }

        var wasteLabel = labels
            .Where(IsAcceptedWaste)
            .Where(label => label.Confidence >= GetRequiredConfidence(label))
            .OrderByDescending(label => label.Confidence)
            .FirstOrDefault();

        if (wasteLabel is not null)
        {
            return new WasteImageValidationResult(true, string.Empty, wasteLabel, topLabel);
        }

        var lowConfidenceWasteLabel = labels
            .Where(IsAcceptedWaste)
            .OrderByDescending(label => label.Confidence)
            .FirstOrDefault();

        if (IsBlocked(topLabel) &&
            topLabel.Confidence >= BlockConfidenceThreshold &&
            lowConfidenceWasteLabel is not null &&
            IsLikelyHandHeldWaste(topLabel, lowConfidenceWasteLabel))
        {
            return new WasteImageValidationResult(true, string.Empty, lowConfidenceWasteLabel, topLabel);
        }

        if (IsHumanOccluder(topLabel) &&
            topLabel.Confidence >= BlockConfidenceThreshold &&
            lowConfidenceWasteLabel is not null)
        {
            return new WasteImageValidationResult(false, UncertainReason, lowConfidenceWasteLabel, topLabel);
        }

        if (IsBlocked(topLabel) && topLabel.Confidence >= BlockConfidenceThreshold)
        {
            return new WasteImageValidationResult(false, NotWasteReason, null, topLabel);
        }

        return new WasteImageValidationResult(
            false,
            lowConfidenceWasteLabel is null ? NotWasteReason : UncertainReason,
            lowConfidenceWasteLabel,
            topLabel);
    }

    private static bool IsAcceptedWaste(DetectedLabelDto label)
    {
        return AcceptedWasteLabels.Any(accepted =>
            ContainsLabelPhrase(label.Label, accepted));
    }

    private static bool IsBlocked(DetectedLabelDto label)
    {
        return BlockedLabels.Any(blocked =>
            ContainsLabelPhrase(label.Label, blocked));
    }

    private static double GetRequiredConfidence(DetectedLabelDto label)
    {
        return IsHazardousWaste(label)
            ? HazardousWasteConfidenceThreshold
            : WasteConfidenceThreshold;
    }

    private static bool IsLikelyHandHeldWaste(DetectedLabelDto topLabel, DetectedLabelDto wasteLabel)
    {
        if (!IsHumanOccluder(topLabel))
        {
            return false;
        }

        var requiredConfidence = IsHazardousWaste(wasteLabel)
            ? HazardousWasteConfidenceThreshold
            : HandHeldWasteConfidenceThreshold;

        return wasteLabel.Confidence >= requiredConfidence;
    }

    private static bool IsHumanOccluder(DetectedLabelDto label)
    {
        return ContainsLabelPhrase(label.Label, "Person") ||
            ContainsLabelPhrase(label.Label, "People") ||
            ContainsLabelPhrase(label.Label, "Human") ||
            ContainsLabelPhrase(label.Label, "Body") ||
            ContainsLabelPhrase(label.Label, "Body Part") ||
            ContainsLabelPhrase(label.Label, "Hand") ||
            ContainsLabelPhrase(label.Label, "Finger") ||
            ContainsLabelPhrase(label.Label, "Arm") ||
            ContainsLabelPhrase(label.Label, "Skin");
    }

    private static bool IsHazardousWaste(DetectedLabelDto label)
    {
        return ContainsLabelPhrase(label.Label, "Battery") ||
            ContainsLabelPhrase(label.Label, "Medicine") ||
            ContainsLabelPhrase(label.Label, "Pill") ||
            ContainsLabelPhrase(label.Label, "Syringe") ||
            ContainsLabelPhrase(label.Label, "Needle") ||
            ContainsLabelPhrase(label.Label, "Chemical") ||
            ContainsLabelPhrase(label.Label, "Paint") ||
            ContainsLabelPhrase(label.Label, "Oil") ||
            ContainsLabelPhrase(label.Label, "Thermometer") ||
            ContainsLabelPhrase(label.Label, "Light Bulb");
    }

    private static bool ContainsLabelPhrase(string label, string phrase)
    {
        var index = label.IndexOf(phrase, StringComparison.OrdinalIgnoreCase);
        while (index >= 0)
        {
            var before = index == 0 || !char.IsLetterOrDigit(label[index - 1]);
            var afterIndex = index + phrase.Length;
            var after = afterIndex >= label.Length || !char.IsLetterOrDigit(label[afterIndex]);
            if (before && after)
            {
                return true;
            }

            index = label.IndexOf(phrase, index + 1, StringComparison.OrdinalIgnoreCase);
        }

        return false;
    }
}
