namespace PublicQ.Application.Models.Group;

/// <summary>
/// Exam group data transfer object (DTO) that represents a group of modules
/// </summary>
public class GroupDto : GroupBaseDto
{
    /// <summary>
    /// Gets or sets the unique identifier of the group.
    /// </summary>
    public Guid Id { get; set; }
    
    /// <summary>
    /// Gets or sets the identifier of the user who updated the group.
    /// </summary>
    public string UpdatedByUserId { get; set; } = string.Empty;
    
    /// <summary>
    /// Group member entities
    /// </summary>
    public HashSet<GroupMemberDto> GroupMembers { get; set; } = [];
    
    /// <summary>
    /// Gets or sets the UTC timestamp when the group was updated.
    /// </summary>
    public DateTime UpdatedAtUtc { get; set; }
    
    /// <summary>
    /// Gets or sets the name of the user who created the group.
    /// </summary>
    public string CreatedByUser { get; set; } = string.Empty;
    
    /// <summary>
    /// Gets or sets the UTC timestamp when the group was created.
    /// </summary>
    public DateTime CreatedAtUtc { get; set; }
}