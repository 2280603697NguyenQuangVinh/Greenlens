namespace GreenLens.Api.Models;

/// <summary>Avatar indices from the React UI (0-based).</summary>
public class AvatarConfigDto
{
    public int Gender { get; set; }
    public int Skin { get; set; }
    public int Hair { get; set; }
    public int Eyes { get; set; }
    public int Outfit { get; set; }
}
