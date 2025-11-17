using PublicQ.Application.Models.Pages.Parts;

namespace PublicQ.Application.Models.Pages;

/// <summary>
/// Contact Page Data Transfer Object
/// </summary>
public class ContactPageDto : PageDto
{
    /// <summary>
    /// Contact Page Parts
    /// </summary>
    public ContactPageParts Parts { get; set; } = new ();
}