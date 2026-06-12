namespace GreenLens.Api.Models;

public class AuthResult
{
    public string Token { get; set; } = string.Empty;
    public UserProfile Profile { get; set; } = new();
}
