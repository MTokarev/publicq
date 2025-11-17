namespace PublicQ.Application.Models.Exam;

/// <summary>
/// Represents the data required to create a version of an assessment module,
/// including its questions, possible answers, and associated static files.
/// </summary>
public class AssessmentModuleVersionDto
{
    /// <summary>
    /// Module version identifier.
    /// </summary>
    public Guid Id { get; set; }
    
    /// <summary>
    /// Parent module identifier.
    /// </summary>
    public Guid AssessmentModuleId { get; set; }
    
    /// <summary>
    /// Module version number.
    /// </summary>
    public int Version { get; set; }
    
    /// <summary>
    /// Indicates whether this version should be published immediately.
    /// </summary>
    public bool IsPublished { get; set; }

    /// <summary>
    /// Minimum percentage of correct answers required to pass the assessment.
    /// </summary>
    public int PassingScorePercentage { get; set; }

    /// <summary>
    /// Time allowed to complete the assessment, in minutes.
    /// </summary>
    public int DurationInMinutes { get; set; }

    /// <summary>
    /// Time when the test module was created.
    /// </summary>
    public DateTime CreatedAtUtc { get; set; }
    
    /// <summary>
    /// User ID of the creator.
    /// </summary>
    public string CreatedByUser { get; set; }
    
    /// <summary>
    /// Updated by user identifier.
    /// </summary>
    public string UpdatedByUser { get; set; } = default!;
    
    /// <summary>
    /// Optional: Title of the test module.
    /// </summary>
    public string Title { get; set; } = string.Empty!;
    
    /// <summary>
    /// Optional: Description of the test module.
    /// </summary>
    public string Description { get; set; } = string.Empty!;

    /// <summary>
    /// Optional list of static file URLs to associate with this version (e.g., module-level images or documents).
    /// </summary>
    public HashSet<string>? StaticFileUrls { get; set; }
    
    /// <summary>
    /// Optional list of static file IDs to associate with this version (e.g., module-level images or documents).
    /// </summary>
    public HashSet<string>? StaticFileIds { get; set; }

    /// <summary>
    /// A list of questions included in this assessment module version.
    /// </summary>
    public List<QuestionDto> Questions { get; set; } = [];
}