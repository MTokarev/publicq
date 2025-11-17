using System.ComponentModel.DataAnnotations;
using PublicQ.Application.Models.Exam;

namespace PublicQ.Infrastructure.Persistence.Entities.Module;

/// <summary>
/// Associated static file entity for a module.
/// </summary>
public class StaticFileEntity
{
    /// <summary>
    /// Unique identifier for the static file entity.
    /// </summary>
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// File URL where the static file is stored.
    /// </summary>
    [Required]
    [MaxLength(500)]
    public string FileUrl { get; set; } = default!;

    /// <summary>
    /// Shared module key (same for all versions of the same module).
    /// </summary>
    [Required]
    [MaxLength(200)]
    public Guid AssessmentModuleId { get; set; }
    
    /// <summary>
    /// Navigation property to the test module this static file is associated with.
    /// </summary>
    public AssessmentModuleEntity AssessmentModule { get; set; } = default!;

    /// <summary>
    /// Optional description or tag (e.g. "question-1-image")
    /// </summary>
    public string? Label { get; set; }

    /// <summary>
    /// Uploaded date and time in UTC.
    /// </summary>
    public DateTime UploadedAtUtc { get; set; } = DateTime.UtcNow;
    
    /// <summary>
    /// Indicates if the file is associated at the module level (true) or question/answer level (false).
    /// </summary>
    public bool IsModuleLevelFile { get; set; }

    /// <summary>
    /// Navigation property to the question this static file is associated with.
    /// </summary>
    public ICollection<QuestionEntity> Questions { get; set; } = new List<QuestionEntity>();
    
    /// <summary>
    /// Navigation property to the possible answer this static file is associated with.
    /// </summary>
    public ICollection<PossibleAnswerEntity> PossibleAnswers { get; set; } = new List<PossibleAnswerEntity>();
    
    /// <summary>
    /// Converts the entity to a Data Transfer Object (DTO).
    /// </summary>
    /// <returns>Returns <see cref="StaticFileDto"/></returns>
    public StaticFileDto ConvertToDto()
    {
        return new StaticFileDto
        {
            Id = Id,
            FileUrl = FileUrl,
            AssessmentModuleId = AssessmentModuleId,
            Label = Label,
            UploadedAtUtc = UploadedAtUtc,
            IsModuleLevelFile = IsModuleLevelFile,
            QuestionIds = Questions.Select(q => q.Id).ToList(),
            PossibleAnswersIds = PossibleAnswers.Select(a => a.Id).ToList()
        };
    }
}