using System.Text.Json;

namespace PublicQ.Application.Models.Pages;

/// <summary>
/// Page Data Transfer Object
/// </summary>
public class PageDto
{
    /// <summary>
    /// Page type
    /// <see cref="PageType"/>
    /// </summary>
    public PageType Type { get; set; }
    
    /// <summary>
    /// Page title
    /// </summary>
    public string Title { get; set; } = string.Empty;
    
    /// <summary>
    /// Page body
    /// </summary>
    public string Body { get; set; } = string.Empty;
    
    /// <summary>
    /// Page JSON data
    /// Can be used to store additional information related to the page
    /// </summary>
    public string JsonData { get; set; } = string.Empty;
    
    /// <summary>
    /// When the entity was created (in UTC)
    /// </summary>
    public DateTime? CreatedAtUtc { get; set; }
    
    /// <summary>
    /// Created by user identifier
    /// </summary>
    public string CreatedBy { get; set; } = string.Empty;
    
    /// <summary>
    /// Updated by user identifier
    /// </summary>
    public string? UpdatedBy { get; set; }
    
    /// <summary>
    /// Update timestamp (in UTC)
    /// </summary>
    public DateTime? UpdatedAtUtc { get; set; }
}