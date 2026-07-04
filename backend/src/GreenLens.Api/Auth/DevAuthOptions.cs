namespace GreenLens.Api.Auth;

public sealed class DevAuthOptions
{
    public string DefaultAdminUsername { get; init; } = "admin";

    public string DefaultAdminPassword { get; init; } = "Admin@123";

    public bool EnableDefaultAdmin { get; init; } = true;
}
