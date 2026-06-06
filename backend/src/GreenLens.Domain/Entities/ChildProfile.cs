namespace GreenLens.Domain.Entities;

public sealed class ChildProfile
{
    public string ChildId { get; set; } = string.Empty;
    public string CharacterName { get; set; } = string.Empty;
    public string Gender { get; set; } = string.Empty;
    public string Hair { get; set; } = string.Empty;
    public string Eyes { get; set; } = string.Empty;
    public string Outfit { get; set; } = string.Empty;
    public string AvatarPreview { get; set; } = string.Empty;
    public int Xp { get; set; }
    public int Level { get; set; }
    public int Streak { get; set; }
    public List<string> Badges { get; set; } = [];
    public List<string> Rewards { get; set; } = [];
    public DateTime CreatedAt { get; set; }
}
