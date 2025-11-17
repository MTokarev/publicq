using System.ComponentModel.DataAnnotations;
using PublicQ.Application.Models.Exam;
using PublicQ.Application.Models.Session;

namespace PublicQ.Infrastructure.Persistence.Entities.Module;

/// <summary>
/// Test module version entity.
/// It comprises a set of questions that can be used for testing purposes.
/// </summary>
/// <remarks>
/// When a test module is created and published, it becomes immutable.
/// If a contributor wants to change the content of the test module,
/// they must create a new version of the module.
/// </remarks>
public class AssessmentModuleVersionEntity
{
    /// <summary>
    /// Module version identifier.
    /// </summary>
    [Key]
    public Guid Id { get; set; }
    
    /// <summary>
    /// Optional: Title of the test module.
    /// </summary>
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty!;
    
    /// <summary>
    /// Normalized title for case-insensitive comparisons.
    /// </summary>
    [MaxLength(200)]
    public string NormalizedTitle { get; set; } = string.Empty!;
    
    /// <summary>
    /// Optional: Description of the test module.
    /// </summary>
    [MaxLength(5000)]
    public string Description { get; set; } = string.Empty!;

    /// <summary>
    /// Version number of the test module.
    /// </summary>
    public int Version { get; set; } = 1;
    
    /// <summary>
    /// Optional: Link to a static file associated with the test module.
    /// </summary>
    public ICollection<StaticFileEntity> AssociatedStaticFiles { get; set; } = new List<StaticFileEntity>();
    
    /// <summary>
    /// Indicates whether the test module is published and available for users.
    /// Contributors cannot change the module content once it is published.
    /// </summary>
    public bool IsPublished { get; set; }
    
    /// <summary>
    /// Minimum percentage of correct answers required to pass.
    /// </summary>
    public int PassingScorePercentage { get; set; }

    /// <summary>
    /// Duration in minutes. Represents how much time is allowed for the test.
    /// </summary>
    public int DurationInMinutes { get; set; }
    
    /// <summary>
    /// Created by user identifier.
    /// </summary>
    [MaxLength(200)]
    public string CreatedByUser { get; set; } = default!;

    /// <summary>
    /// Updated by user identifier.
    /// </summary>
    [MaxLength(200)]
    public string UpdatedByUser { get; set; } = string.Empty;

    /// <summary>
    /// Time when the test module was created.
    /// </summary>
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    
    /// <summary>
    /// Foreign key to the test module this version belongs to.
    /// </summary>
    [Required]
    public Guid AssessmentModuleId { get; set; }
    
    /// <summary>
    /// Navigation property to the test module this version belongs to.
    /// </summary>
    public AssessmentModuleEntity AssessmentModule { get; set; } = default!;
    
    /// <summary>
    /// Collection of questions that belong to this test module.
    /// </summary>
    public ICollection<QuestionEntity> Questions { get; set; } = new List<QuestionEntity>();

    /// <summary>
    /// Converts the entity to a Data Transfer Object (DTO).
    /// </summary>
    /// <returns>Return <see cref="AssessmentModuleVersionDto"/></returns>
    public AssessmentModuleVersionDto ConvertToDto()
    {
        return new AssessmentModuleVersionDto
        {
            Id = Id,
            AssessmentModuleId = AssessmentModuleId,
            Version = Version,
            Title = Title,
            Description = Description,
            IsPublished = IsPublished,
            PassingScorePercentage = PassingScorePercentage,
            DurationInMinutes = DurationInMinutes,
            CreatedByUser = CreatedByUser,
            UpdatedByUser = UpdatedByUser,
            CreatedAtUtc = CreatedAtUtc,
            StaticFileUrls = AssociatedStaticFiles.Select(f => f.FileUrl).ToHashSet(),
            StaticFileIds = AssociatedStaticFiles.Select(f => f.Id.ToString()).ToHashSet(),
            Questions = Questions.Select(q => q.ConvertToDto()).ToList()
        };
    }
    
    public ExamTakerModuleVersionDto ConvertToExamTakerDto()
    {
        return new ExamTakerModuleVersionDto
        {
            Id = Id,
            AssessmentModuleId = AssessmentModuleId,
            Version = Version,
            Title = Title,
            Description = Description,
            PassingScorePercentage = PassingScorePercentage,
            DurationInMinutes = DurationInMinutes,
            CreatedByUserId = CreatedByUser,
            CreatedAtUtc = CreatedAtUtc,
            StaticFileUrls = AssociatedStaticFiles.Select(f => f.FileUrl).ToHashSet(),
            StaticFileIds = AssociatedStaticFiles.Select(f => f.Id.ToString()).ToHashSet(),
            Questions = Questions.Select(q => q.ConvertToExamTakerDto()).ToList()
        };
    }
}