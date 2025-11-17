namespace PublicQ.Application.Models.Exam;

/// <summary>
/// Contains information required to create a new test module.
/// </summary>
public class AssessmentModuleCreateDto
{
    /// <summary>
    /// Optional: Module title that will be displayed to users.
    /// </summary>
    public string Title { get; set; } = string.Empty!;
    
    /// <summary>
    /// Optional: Model description that provides additional context or instructions for users.
    /// </summary>
    public string Description { get; set; } = string.Empty!;
    
    /// <summary>
    /// Passing score percentage required to pass the assessment.
    /// </summary>
    public int PassingScorePercentage { get; set; }
    
    /// <summary>
    /// Optional: Time allowed to complete the assessment, in minutes.
    /// If not specified, the module will not have a time limit.
    /// </summary>
    public int DurationInMinutes { get; set; }
    
    /// <summary>
    /// Created by user, indicating who created the test module.
    /// </summary>
    public string CreatedByUser { get; set; } = string.Empty;
}