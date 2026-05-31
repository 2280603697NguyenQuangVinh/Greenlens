namespace GreenLens.Api.Models;

public class UserAvatar
{
    public string BadgeId { get; set; } = string.Empty;
    public string Gender { get; set; } = string.Empty;
    public string Skin { get; set; } = string.Empty;
    public string Hair { get; set; } = string.Empty;
    public string Outfit { get; set; } = string.Empty;
    public int XP { get; set; }
    public int Level { get; set; }
    public int Streak { get; set; }
}
