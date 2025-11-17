namespace PublicQ.Application.Models.Exam;

/// <summary>
/// Assessment module version update data transfer object.
/// </summary>
public class AssessmentModuleVersionUpdateDto
{
    /// <summary>
    /// Module version identifier to update.
    /// </summary>
    public Guid Id { get; set; }
    
    /// <summary>
    /// Optional: Title of the test module.
    /// </summary>
    public string Title { get; set; } = string.Empty!;
    
    /// <summary>
    /// Optional: Description of the test module.
    /// </summary>
    public string Description { get; set; } = string.Empty!;
    
    /// <summary>
    /// Optional list of static file IDs to associate with this version (e.g., module-level images or documents).
    /// </summary>
    public HashSet<Guid>? StaticFileIds { get; set; }
    
    /// <summary>
    /// Passing score percentage required to pass the assessment.
    /// </summary>
    public int PassingScorePercentage { get; set; }

    /// <summary>
    /// Time allowed to complete the assessment, in minutes.
    /// </summary>
    public int DurationInMinutes { get; set; }
}