namespace PublicQ.Application.Models.Exam;

/// <summary>
/// Represents a test module with its metadata.
/// </summary>
public class AssessmentModuleDto
{
    /// <summary>
    /// Identifier for the test module.
    /// </summary>
    public Guid Id { get; set; }
    
    /// <summary>
    /// Created by user, indicating who created the test module.
    /// </summary>
    public string CreatedByUser { get; set; } = string.Empty;
    
    /// <summary>
    /// Time when the test module was created.
    /// </summary>
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    
    /// <summary>
    /// Indicates whether the test module has any published versions.
    /// <remarks>
    /// If the latest version is not published, does not mean that the test module has no published versions.
    /// </remarks>
    /// </summary>
    public bool HasPublishedVersions { get; set; }
    
    /// <summary>
    /// Latest version of the test module.
    /// </summary>
    public AssessmentModuleVersionDto LatestVersion { get; set; }
}