using GreenLens.Application.Modules.AiCamera.WasteMapping;
using Xunit;

namespace GreenLens.UnitTests.AiCamera;

public sealed class WasteMappingServiceTests
{
    [Theory]
    [InlineData("Bottle", "Recyclable", "Green")]
    [InlineData("Plastic Bottle", "Recyclable", "Green")]
    [InlineData("Paper", "Recyclable", "Green")]
    [InlineData("Cardboard Box", "Recyclable", "Green")]
    [InlineData("Tin Can", "Recyclable", "Green")]
    [InlineData("Candy Wrapper", "Recyclable", "Green")]
    [InlineData("Plastic Container", "Recyclable", "Green")]
    [InlineData("Food", "Organic", "Brown")]
    [InlineData("Fallen Leaf", "Organic", "Brown")]
    [InlineData("Battery", "Hazardous", "Red")]
    [InlineData("Glass Bottle", "Hazardous", "Red")]
    [InlineData("Medicine Bottle", "Hazardous", "Red")]
    [InlineData("Mobile Phone", "Hazardous", "Red")]
    [InlineData("Trash", "Non-Recyclable", "Gray")]
    [InlineData("Sneaker", "Non-Recyclable", "Gray")]
    public void Map_ReturnsExpectedCategory(string label, string expectedCategory, string expectedBinColor)
    {
        var service = new WasteMappingService();

        var result = service.Map(label);

        Assert.Equal(expectedCategory, result.Category);
        Assert.Equal(expectedBinColor, result.BinColor);
    }
}
