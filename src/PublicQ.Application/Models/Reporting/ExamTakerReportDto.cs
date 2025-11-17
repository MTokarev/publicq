namespace PublicQ.Application.Models.Reporting;

/// <summary>
/// Exam taker progress report details
/// </summary>
public class ExamTakerReportDto
{
    /// <summary>
    /// The unique identifier of the student
    /// </summary>
    public string StudentId { get; set; } = string.Empty;

    /// <summary>
    /// Student's display name
    /// </summary>
    public string DisplayName { get; set; } = string.Empty;

    /// <summary>
    /// Total number of assignments assigned to this student
    /// </summary>
    public int TotalAssignments { get; set; }

    /// <summary>
    /// Number of assignments completed by this student
    /// </summary>
    public int CompletedAssignments { get; set; }

    /// <summary>
    /// Number of assignments in progress
    /// </summary>
    public int InProgressAssignments { get; set; }

    /// <summary>
    /// Number of assignments not yet started
    /// </summary>
    public int NotStartedAssignments { get; set; }

    /// <summary>
    /// Overall average score across all assignments
    /// </summary>
    public decimal? OverallAverageScore { get; set; }

    /// <summary>
    /// Total time spent on all assignments (in minutes)
    /// </summary>
    public int TotalTimeSpentMinutes { get; set; }
    
    /// <summary>
    /// Detailed progress for each assignment
    /// </summary>
    public List<ExamTakerAssignmentReportDto> AssignmentProgress { get; set; } = [];
}