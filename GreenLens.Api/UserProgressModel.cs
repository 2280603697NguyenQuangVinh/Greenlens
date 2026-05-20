namespace GreenLens.Api;

public class UserProgressModel
{
	public string UserId { get; set; } = string.Empty;

	public int Xp { get; set; } = 0;

	public int Streak { get; set; } = 0;
}
