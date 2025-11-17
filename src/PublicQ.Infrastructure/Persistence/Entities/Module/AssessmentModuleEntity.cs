using System.ComponentModel.DataAnnotations;
using PublicQ.Application.Models.Exam;
using PublicQ.Infrastructure.Persistence.Entities.Group;

namespace PublicQ.Infrastructure.Persistence.Entities.Module;

/// <summary>
/// Test module entity that represents a collection of versions of a test module.
/// </summary>
/// <remarks>
/// The module becomes available for users only after at least one version is published.
/// If a new version is created, but it is not published:
///   - The previous version remains available for users.
///   - If there is no published version, the module is not available for users.
/// </remarks>
public class AssessmentModuleEntity
{
    /// <summary>
    /// Unique Identifier for the test module.
    /// </summary>
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    
    /// <summary>
    /// All module versions belong to the same module.
    /// </summary>
    public ICollection<AssessmentModuleVersionEntity> Versions { get; set; } = new List<AssessmentModuleVersionEntity>();
    
    /// <summary>
    /// Navigation property for associated static files.
    /// </summary>
    /// <remarks>
    /// It is necessary to store static files that are associated with the module to control file lifecycle.
    /// </remarks>
    public ICollection<StaticFileEntity> AssociatedStaticFiles { get; set; } = new List<StaticFileEntity>();
    
    /// <summary>
    /// Created by user (Name).
    /// </summary>
    [Required]
    [MaxLength(200)]
    public string CreatedByUser { get; set; } = default!;
    
    /// <summary>
    /// Time when the test module was created.
    /// </summary>
    [Required]
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    
    /// <summary>
    /// Navigation property to group members that reference this assessment module.
    /// One module can belong to multiple groups through GroupMemberEntity.
    /// </summary>
    public HashSet<GroupMemberEntity> GroupMembers { get; set; } = [];
    
    /// <summary>
    /// Converts the entity to a Data Transfer Object (DTO).
    /// </summary>
    /// <returns>Returns <see cref="AssessmentModuleDto"/></returns>
    public AssessmentModuleDto ConvertToDto()
    {
        var latestVersion = Versions
            .OrderByDescending(v => v.Version)
            .FirstOrDefault();
        
        return new AssessmentModuleDto
        {
            Id = Id,
            CreatedByUser = CreatedByUser,
            CreatedAtUtc = CreatedAtUtc,
            HasPublishedVersions = Versions.Any(v => v.IsPublished),
            LatestVersion = latestVersion?.ConvertToDto() ?? new AssessmentModuleVersionDto()
        };
    }
}