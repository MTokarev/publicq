using System.ComponentModel.DataAnnotations;

namespace PublicQ.Application.Models.Exam;

/// <summary>
/// Data transfer object for creating static files associated with modules or questions.
/// </summary>
public class StaticFileCreateDto
{
    /// <summary>
    /// File URL where the static file is stored.
    /// </summary>
    [Required]
    public string FileUrl { get; set; } = default!;

    /// <summary>
    /// Shared module key (same for all versions of the same module).
    /// </summary>
    public Guid AssessmentModuleId { get; set; }

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
    public ICollection<Guid> QuestionIds { get; set; } = new List<Guid>();

    /// <summary>
    /// Navigation property to the possible answer this static file is associated with.
    /// </summary>
    public ICollection<Guid> PossibleAnswersIds { get; set; } = new List<Guid>();
}