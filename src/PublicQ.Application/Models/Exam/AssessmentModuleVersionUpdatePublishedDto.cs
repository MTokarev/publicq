namespace PublicQ.Application.Models.Exam;

/// <summary>
/// Data transfer object for updating published assessment module versions.
/// Published modules have limited updateable fields compared to draft modules.
/// </summary>
public class AssessmentModuleVersionUpdatePublishedDto
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
    /// Time allowed to complete the assessment, in minutes.
    /// </summary>
    public int DurationInMinutes { get; set; }
}