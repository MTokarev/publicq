using PublicQ.Application.Models.Session;

namespace PublicQ.Application.Models.Reporting;

/// <summary>
/// Exam taker assignment report details
/// </summary>
public class ExamTakerAssignmentReportDto
{
    /// <summary>
    /// Assignment identifier
    /// </summary>
    public Guid AssignmentId { get; set; }
    
    /// <summary>
    /// Gets or sets when students can start taking the assessment.
    /// Students cannot access the assignment before this date and time.
    /// </summary>
    /// <value>A UTC DateTime representing the earliest moment students can begin the assignment.</value>
    /// <remarks>
    /// All dates are stored in UTC to ensure consistent behavior across time zones.
    /// The application layer should handle timezone conversion for display purposes.
    /// </remarks>
    public DateTime AssignmentStartDateUtc { get; set; }
    
    /// <summary>
    /// Gets or sets when the assignment expires (students can't start new attempts).
    /// After this date, students can no longer begin the assignment, but can finish in-progress attempts.
    /// </summary>
    /// <value>A UTC DateTime representing when new assignment attempts are no longer permitted.</value>
    /// <remarks>
    /// Students who have already started before this deadline can typically continue,
    /// depending on business rules implemented in the service layer.
    /// </remarks>
    public DateTime AssignmentEndDateUtc { get; set; }

    /// <summary>
    /// Assignment title
    /// </summary>
    public string AssignmentTitle { get; set; } = string.Empty;

    /// <summary>
    /// When the student started this assignment
    /// </summary>
    public DateTime? StartedAtUtc { get; set; }

    /// <summary>
    /// When the student completed this assignment
    /// </summary>
    public DateTime? CompletedAtUtc { get; set; }

    /// <summary>
    /// Time spent on this assignment (in minutes)
    /// </summary>
    public int TimeSpentMinutes { get; set; }

    /// <summary>
    /// Number of modules completed
    /// </summary>
    public int CompletedModules { get; set; }

    /// <summary>
    /// Total number of modules in the assignment
    /// </summary>
    public int TotalModules { get; set; }

    /// <summary>
    /// Progress details for each module
    /// </summary>
    public HashSet<ExamTakerModuleReportDto> ModuleReports { get; set; } = [];
}