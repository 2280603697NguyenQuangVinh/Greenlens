namespace GreenLens.Api.Models;

public class UserProfile
{
    public string BadgeId { get; set; } = string.Empty;
    public int Gender { get; set; }
    public int Skin { get; set; }
    public int Hair { get; set; }
    public int Eyes { get; set; }
    public int Outfit { get; set; }
    public int XP { get; set; }
    public int Level { get; set; } = 1;
    public int Streak { get; set; } = 1;
    public int DailyScansCompleted { get; set; }
    public int DailyScansTarget { get; set; } = 3;
    public List<ActivityItem> RecentActivity { get; set; } = [];
}

public class ActivityItem
{
    public string Icon { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string XpLabel { get; set; } = string.Empty;
    public string TimeAgo { get; set; } = "just now";
}
