using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using PublicQ.Application.Models.Pages;
using PublicQ.Application.Models.Pages.Parts;

namespace PublicQ.Infrastructure.Persistence.Entities;

/// <summary>
/// Represents Contact Page entity in the database
/// </summary>
public class PageEntity
{
    /// <summary>
    /// Unique identifier
    /// </summary>
    [Key]
    public Guid Id { get; set; }
    
    /// <summary>
    /// Page type
    /// <see cref="PageType"/>
    /// </summary>
    public PageType Type { get; set; }
    
    /// <summary>
    /// Page title
    /// </summary>
    [MaxLength(256)]
    public string Title { get; set; } = string.Empty;
    
    /// <summary>
    /// Page body
    /// </summary>
    [MaxLength(20480)]
    public string Body { get; set; } = string.Empty;
    
    /// <summary>
    /// Page JSON data
    /// Can be used to store additional information related to the page
    /// </summary>
    [MaxLength(20480)]
    public string JsonData { get; set; } = string.Empty;
    
    /// <summary>
    /// When the entity was created (in UTC)
    /// </summary>
    public DateTime CreatedAtUtc { get; set; }
    
    /// <summary>
    /// Created by user identifier
    /// </summary>
    [Required]
    [MaxLength(200)]
    public string CreatedBy { get; set; } = string.Empty;
    
    /// <summary>
    /// Updated by user identifier
    /// </summary>
    [MaxLength(200)]
    public string? UpdatedBy { get; set; }
    
    /// <summary>
    /// Update timestamp (in UTC)
    /// </summary>
    public DateTime UpdatedAtUtc { get; set; }
    
    /// <summary>
    /// Converts the PageEntity to a PageDto of type T
    /// </summary>
    public PageDto ConvertToDto()
    {
        return new PageDto()
        {
            Title = Title,
            Body = Body,
            JsonData = JsonData,
            CreatedAtUtc = CreatedAtUtc,
            CreatedBy = CreatedBy,
            UpdatedBy = UpdatedBy,
            UpdatedAtUtc = UpdatedAtUtc
        };
    }

    /// <summary>
    /// Converts the PageEntity to a ContactPageDto
    /// </summary>
    /// <returns>Returns <see cref="ConvertToContactDto"/></returns>
    public ContactPageDto ConvertToContactDto()
    {
        return new ContactPageDto()
        {
            Title = Title,
            Body = Body,
            JsonData = JsonData,
            CreatedAtUtc = CreatedAtUtc,
            CreatedBy = CreatedBy,
            UpdatedBy = UpdatedBy,
            UpdatedAtUtc = UpdatedAtUtc,
            Parts = string.IsNullOrWhiteSpace(JsonData)
                ? new ContactPageParts()
                : JsonSerializer.Deserialize<ContactPageParts>(JsonData) ?? new ContactPageParts()

        };
    }
}