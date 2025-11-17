using System.ComponentModel.DataAnnotations;
using PublicQ.Application.Models.Group;
using PublicQ.Infrastructure.Persistence.Entities.Assignment;
using PublicQ.Infrastructure.Persistence.Entities.Module;

namespace PublicQ.Infrastructure.Persistence.Entities.Group;

/// <summary>
/// Represents a group entity that organizes members and manages module completion settings.
/// </summary>
public class GroupEntity
{
    /// <summary>
    /// Gets or sets the unique identifier of the group.
    /// </summary>
    [Key]
    public Guid Id { get; set; }
    
    /// <summary>
    /// Gets or sets the title of the group.
    /// </summary>
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;
    
    /// <summary>
    /// Normalized title for case-insensitive comparisons.
    /// </summary>
    [MaxLength(200)]
    public string NormalizedTitle { get; set; } = string.Empty;
    
    /// <summary>
    /// Gets or sets the description of the group.
    /// </summary>
    [MaxLength(5000)]
    public string Description { get; set; } = string.Empty;
    
    /// <summary>
    /// Gets or sets a value indicating whether module completion is required 
    /// before progressing in the group context.
    /// </summary>
    public bool WaitModuleCompletion { get; set; }
    
    /// <summary>
    /// Indicates whether the order of group members is locked.
    /// If it is locked, exam takers cannot launch modules out of order.
    /// </summary>
    public bool IsMemberOrderLocked { get; set; }
    
    /// <summary>
    /// Gets or sets the collection of group members associated with this group.
    /// </summary>
    [Required]
    public HashSet<GroupMemberEntity> GroupMemberEntities { get; set; } = [];

    /// <summary>
    /// Gets or sets the identifier of the user who updated the group.
    /// </summary>
    [MaxLength(200)]
    public string UpdatedByUserId { get; set; } = string.Empty;
    
    /// <summary>
    /// Gets or sets the UTC timestamp when the group was updated.
    /// </summary>
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
    
    /// <summary>
    /// Gets or sets the name of the user who created the group.
    /// </summary>
    [Required]
    [MaxLength(200)]
    public string CreatedByUser { get; set; }
    
    /// <summary>
    /// Gets or sets the UTC timestamp when the group was created.
    /// </summary>
    [Required]
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    
    /// <summary>
    /// Navigation property for assignments associated with this group.
    /// </summary>
    public ICollection<AssignmentEntity> Assignments { get; set; } = new List<AssignmentEntity>();
    
    public GroupDto ToGroupDto()
    {
        return new GroupDto
        {
            Id = Id,
            Title = Title,
            Description = Description,
            WaitModuleCompletion = WaitModuleCompletion,
            IsMemberOrderLocked = IsMemberOrderLocked,
            GroupMembers = GroupMemberEntities.Select(member => member.ToGroupMemberDto()).ToHashSet(),
            CreatedByUser = CreatedByUser,
            CreatedAtUtc = CreatedAtUtc,
            UpdatedByUserId = UpdatedByUserId,
            UpdatedAtUtc = UpdatedAtUtc
        };
    }
}