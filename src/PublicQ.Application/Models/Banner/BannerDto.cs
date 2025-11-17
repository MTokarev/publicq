namespace PublicQ.Application.Models.Banner;

/// <summary>
/// DTO model for Banner
/// </summary>
public class BannerDto
{
    /// <summary>
    /// Banner Type <see cref="BannerType"/>
    /// </summary>
    public BannerType Type { get; set; }
    
    /// <summary>
    /// Banner Title
    /// </summary>
    public string Title { get; set; } = string.Empty;
    
    /// <summary>
    /// Banner Content
    /// </summary>
    public string Content { get; set; } = string.Empty;
    
    /// <summary>
    /// Show banner to authenticated users only
    /// </summary>
    public bool ShowToAuthenticatedUsersOnly { get; set; } = false;

    /// <summary>
    /// Can the banner be dismissed by the user
    /// </summary>
    public bool IsDismissible { get; set; } = true;
    
    /// <summary>
    /// When the banner should start being displayed
    /// </summary>
    public DateTime StartDateUtc { get; set; } = DateTime.Now;
    
    /// <summary>
    /// When the banner should stop being displayed
    /// </summary>
    public DateTime? EndDateUtc { get; set; }
}