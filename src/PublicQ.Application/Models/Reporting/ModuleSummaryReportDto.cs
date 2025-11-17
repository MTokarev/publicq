namespace PublicQ.Application.Models.Reporting;

/// <summary>
/// Module summary report details
/// </summary>
public class ModuleSummaryReportDto
{
    /// <summary>
    /// The unique identifier of the module
    /// </summary>
    public Guid ModuleId { get; set; }

    /// <summary>
    /// The title/name of the module
    /// </summary>
    public string ModuleTitle { get; set; } = string.Empty;

    /// <summary>
    /// Description of the module
    /// </summary>
    public string? ModuleDescription { get; set; }

    /// <summary>
    /// Completion rate as a percentage (0-100)
    /// </summary>
    public double CompletionRate { get; set; }

    /// <summary>
    /// Average score for this module
    /// </summary>
    public double? AverageScore { get; set; }

    /// <summary>
    /// Highest score achieved for this module
    /// </summary>
    public double? HighestScore { get; set; }

    /// <summary>
    /// Lowest score achieved for this module
    /// </summary>
    public double? LowestScore { get; set; }

    /// <summary>
    /// Average time to complete this module (in minutes)
    /// </summary>
    public double? AverageCompletionTimeMinutes { get; set; }

    /// <summary>
    /// Total number of questions in this module
    /// </summary>
    public int TotalQuestions { get; set; }
}