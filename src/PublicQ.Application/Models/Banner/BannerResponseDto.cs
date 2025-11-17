namespace PublicQ.Application.Models.Banner;

/// <summary>
/// Banner create DTO model
/// </summary>
public class BannerResponseDto : BannerDto
{
    /// <summary>
    /// Banner Id
    /// </summary>
    public Guid Id { get; set; }
    
    /// <summary>
    /// Indicates who created the banner
    /// </summary>
    public string CreatedByUser { get; set; } = string.Empty;
    
    /// <summary>
    /// Updated by user
    /// </summary>
    public string UpdatedByUser { get; set; } = string.Empty;
    
    /// <summary>
    /// Created at timestamp
    /// </summary>
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    
    /// <summary>
    /// Updated at timestamp
    /// </summary>
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
}