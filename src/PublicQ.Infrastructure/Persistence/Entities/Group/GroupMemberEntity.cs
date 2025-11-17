using System.ComponentModel.DataAnnotations;
using PublicQ.Application.Models.Exam;
using PublicQ.Application.Models.Group;
using PublicQ.Infrastructure.Persistence.Entities.Module;

namespace PublicQ.Infrastructure.Persistence.Entities.Group;

/// <summary>
/// Represents a member within a group, including its association and ordering.
/// </summary>
public class GroupMemberEntity
{
    /// <summary>
    /// Gets or sets the unique identifier of the group member.
    /// </summary>
    [Key]
    public Guid Id { get; set; }
    
    /// <summary>
    /// Gets or sets the identifier of the group this member belongs to.
    /// </summary>
    [Required]
    public Guid GroupId { get; set; }
    
    /// <summary>
    /// Navigation property to the group this member belongs to.
    /// </summary>
    public GroupEntity Group { get; set; }
    
    /// <summary>
    /// Gets or sets the order number of the member within the group.
    /// </summary>
    [Required]
    public int OrderNumber { get; set; }

    /// <summary>
    /// Assessment module identifier that this member is associated with.
    /// </summary>
    public Guid AssessmentModuleId { get; set; }
    
    /// <summary>
    /// Navigation property to the group this member belongs to.
    /// </summary>
    [Required]
    public AssessmentModuleEntity AssessmentModule { get; set; }

    /// <summary>
    /// Helps convert the GroupMemberEntity to a GroupMemberDto.
    /// </summary>
    public GroupMemberDto ToGroupMemberDto()
    {
        var latestVersion = AssessmentModule
            .Versions
            .OrderByDescending(v => v.Version)
            .FirstOrDefault();
        
        return new GroupMemberDto
        {
            Id = Id,
            GroupId = GroupId,
            OrderNumber = OrderNumber,
            AssessmentModuleTitle = latestVersion?.Title ?? string.Empty,
            StaticFileUrls = latestVersion?.AssociatedStaticFiles
                .Where(sf => sf.IsModuleLevelFile)
                .Select(sf => sf.FileUrl)
                .ToHashSet() ?? [],
            AssessmentModuleDescription = latestVersion?.Description ?? string.Empty,
            AssessmentModuleId = AssessmentModuleId
        };
    }
}