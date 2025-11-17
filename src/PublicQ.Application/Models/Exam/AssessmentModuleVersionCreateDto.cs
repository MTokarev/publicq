namespace PublicQ.Application.Models.Exam;

/// <summary>
/// Represents the data required to create a version of an assessment module,
/// including its questions, possible answers, and associated static files.
/// </summary>
public class AssessmentModuleVersionCreateDto
{
    /// <summary>
    /// Foreign key to the assessment module this version belongs to.
    /// </summary>
    public Guid ModuleId { get; set; }
    
    /// <summary>
    /// Optional: Title of the test module.
    /// </summary>
    public string Title { get; set; } = string.Empty;
    
    /// <summary>
    /// Optional: Description of the test module.
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Minimum percentage of correct answers required to pass the assessment.
    /// </summary>
    public int PassingScorePercentage { get; set; }

    /// <summary>
    /// Time allowed to complete the assessment, in minutes.
    /// </summary>
    public int DurationInMinutes { get; set; }

    /// <summary>
    /// Optional list of static file IDs to associate with this version (e.g., module-level images or documents).
    /// </summary>
    public HashSet<Guid> StaticFileIds { get; set; } = [];

    /// <summary>
    /// User name of the creator.
    /// </summary>
    public string CreatedByUser { get; set; } = string.Empty;
}