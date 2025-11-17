using System.ComponentModel.DataAnnotations;

using PublicQ.Application.Models.Banner;

namespace PublicQ.Infrastructure.Persistence.Entities;

public class BannerEntity
{
    /// <summary>
    /// Banner Id
    /// </summary>
    [Key]
    public Guid Id { get; set; }
    
    /// <summary>
    /// Banner Type <see cref="BannerType"/>
    /// </summary>
    public BannerType Type { get; set; }
    
    /// <summary>
    /// Banner Title
    /// </summary>
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;
    
    /// <summary>
    /// Banner Content
    /// </summary>
    [MaxLength(5000)]
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
    /// Indicates who created the banner
    /// </summary>
    [MaxLength(200)]
    public string CreatedByUser { get; set; } = string.Empty;
    
    /// <summary>
    /// Updated by user
    /// </summary>
    [MaxLength(200)]
    public string UpdatedByUser { get; set; } = string.Empty;
    
    /// <summary>
    /// When the banner should start being displayed
    /// </summary>
    public DateTime StartDateUtc { get; set; } = DateTime.UtcNow;
    
    /// <summary>
    /// When the banner should stop being displayed
    /// </summary>
    public DateTime? EndDateUtc { get; set; }
    
    /// <summary>
    /// Created at timestamp
    /// </summary>
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    
    /// <summary>
    /// Updated at timestamp
    /// </summary>
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;

    public BannerResponseDto ToResponseDto()
    {
        return new BannerResponseDto
        {
            Id = Id,
            Type = Type,
            Title = Title,
            Content = Content,
            ShowToAuthenticatedUsersOnly = ShowToAuthenticatedUsersOnly,
            IsDismissible = IsDismissible,
            CreatedByUser = CreatedByUser,
            UpdatedByUser = UpdatedByUser,
            StartDateUtc = StartDateUtc,
            EndDateUtc = EndDateUtc,
            CreatedAtUtc = CreatedAtUtc,
            UpdatedAtUtc = UpdatedAtUtc
        };
    }
}