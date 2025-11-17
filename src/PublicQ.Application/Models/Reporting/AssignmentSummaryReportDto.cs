namespace PublicQ.Application.Models.Reporting;

/// <summary>
/// Assignment summary report details
/// </summary>
public class AssignmentSummaryReportDto
{
    /// <summary>
    /// The unique identifier of the assignment
    /// </summary>
    public Guid AssignmentId { get; set; }

    /// <summary>
    /// The title/name of the assignment
    /// </summary>
    public string AssignmentTitle { get; set; } = string.Empty;
    
    /// <summary>
    /// The description of the assignment
    /// </summary>
    public string AssignmentDescription { get; set; } = string.Empty;

    /// <summary>
    /// Total number of students assigned to this assignment
    /// </summary>
    public int TotalStudents { get; set; }

    /// <summary>
    /// Number of students who have completed all modules
    /// </summary>
    public int CompletedStudents { get; set; }

    /// <summary>
    /// Number of students currently working on the assignment
    /// </summary>
    public int InProgressStudents { get; set; }

    /// <summary>
    /// Number of students who haven't started yet
    /// </summary>
    public int NotStartedStudents { get; set; }

    /// <summary>
    /// Completion rate as a percentage (0-100)
    /// </summary>
    public double CompletionRate { get; set; }

    /// <summary>
    /// Average score across all completed modules
    /// </summary>
    public double? AverageScore { get; set; }

    /// <summary>
    /// Average time taken to complete the assignment (in minutes)
    /// </summary>
    public double? AverageCompletionTimeMinutes { get; set; }

    /// <summary>
    /// When the assignment starts
    /// </summary>
    public DateTime StartDateUtc { get; set; }

    /// <summary>
    /// When the assignment ends
    /// </summary>
    public DateTime EndDateUtc { get; set; }

    /// <summary>
    /// Whether the assignment is currently active
    /// </summary>
    public bool IsActive { get; set; }

    /// <summary>
    /// Progress data for individual modules within this assignment
    /// </summary>
    public List<ModuleSummaryReportDto> ModuleReports { get; set; } = new();
}