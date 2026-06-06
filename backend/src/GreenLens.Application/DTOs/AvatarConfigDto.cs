using System.ComponentModel.DataAnnotations;

namespace GreenLens.Application.DTOs;

public sealed class AvatarConfigDto
{
    [Required]
    public string CharacterName { get; set; } = string.Empty;

    [Required]
    public string Gender { get; set; } = string.Empty;

    [Required]
    public string Hair { get; set; } = string.Empty;

    [Required]
    public string Eyes { get; set; } = string.Empty;

    [Required]
    public string Outfit { get; set; } = string.Empty;

    [Required]
    public string AvatarPreview { get; set; } = string.Empty;
}
