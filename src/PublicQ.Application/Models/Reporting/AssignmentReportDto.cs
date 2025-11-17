using PublicQ.Application.Models.Assignment;
using PublicQ.Shared;

namespace PublicQ.Application.Models.Reporting;

/// <summary>
/// Report details for an assignment
/// </summary>
public class AssignmentReportDto
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
    /// Exam taker progress details for this assignment
    /// </summary>
    public IList<ExamTakerReportDto> ExamTakerReports { get; set; } = [];
    
    /// <summary>
    /// Creates an assignment report from the provided data.
    /// </summary>
    /// <param name="assignment"><see cref="AssignmentDto"/></param>
    /// <param name="examTakerReports">Array of <see cref="ExamTakerAssignmentReportDto"/></param>
    /// <returns>Returns <see cref="AssignmentReportDto"/></returns>
    public static AssignmentReportDto CreateReportFromData(
        AssignmentDto assignment, 
        IList<ExamTakerReportDto> examTakerReports)
    {
        Guard.AgainstNull(assignment, nameof(assignment));
        Guard.AgainstNull(examTakerReports, nameof(examTakerReports));
        
        var averageScore = examTakerReports
            .SelectMany(eta => eta.AssignmentProgress.SelectMany(x => x.ModuleReports))
            .Where(etm => etm.CompletedAtUtc != null)
            .Average(mp => (double?)mp.Score) ?? 0;
        
        var assignmentCompletionTimes = examTakerReports
            .Select(eta => eta.AssignmentProgress
                .Where(ap => ap.ModuleReports.All(mr => mr.CompletedAtUtc != null))
                .Select(ap => ap.ModuleReports
                    .Where(mr => mr is { CompletedAtUtc: not null, StartedAtUtc: not null })
                    .Sum(mr => (mr.CompletedAtUtc!.Value - mr.StartedAtUtc!.Value).TotalMinutes))
                .FirstOrDefault())
            .Where(time => time > 0)
            .ToList();
        var completedStudents = examTakerReports
            .Count(eta => eta.AssignmentProgress
                .All(ap => ap.ModuleReports.All(mr => mr.CompletedAtUtc != null)));

        return new AssignmentReportDto
        {
            AssignmentId = assignment.Id,
            AssignmentTitle = assignment.Title,
            AssignmentDescription = assignment.Description ?? string.Empty,
            StartDateUtc = assignment.StartDateUtc,
            EndDateUtc = assignment.EndDateUtc,
            IsActive = assignment.EndDateUtc > DateTime.UtcNow,
            TotalStudents = examTakerReports.Count,
            CompletedStudents = examTakerReports.Sum(atr => atr.CompletedAssignments),
            InProgressStudents = examTakerReports.Sum(atr => atr.InProgressAssignments),
            NotStartedStudents = examTakerReports.Sum(atr => atr.NotStartedAssignments),
            AverageScore = averageScore,
            AverageCompletionTimeMinutes = assignmentCompletionTimes.Any()
            ? assignmentCompletionTimes.Average()
            : null,

            CompletionRate = completedStudents > 0
            ? (double)completedStudents / examTakerReports.Count * 100
            : 0,
            ExamTakerReports = examTakerReports
        };
    }
}