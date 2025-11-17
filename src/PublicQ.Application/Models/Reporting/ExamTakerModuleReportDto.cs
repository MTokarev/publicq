using PublicQ.Application.Models.Session;

namespace PublicQ.Application.Models.Reporting;

/// <summary>
/// Module report details for an exam taker
/// </summary>
public class ExamTakerModuleReportDto
{
    /// <summary>
    /// Module identifier
    /// </summary>
    public Guid ModuleId { get; set; }

    /// <summary>
    /// Module title
    /// </summary>
    public string ModuleTitle { get; set; } = string.Empty;

    /// <summary>
    /// Student's status for this module
    /// </summary>
    public ModuleStatus Status { get; set; } = ModuleStatus.NotStarted;

    /// <summary>
    /// Passing score for this module
    /// </summary>
    public decimal PassingScore { get; set; }
    
    /// <summary>
    /// Score achieved on this module
    /// </summary>
    public decimal? Score { get; set; }

    /// <summary>
    /// Whether the student passed this module
    /// </summary>
    public bool? Passed { get; set; }

    /// <summary>
    /// When the student started this module
    /// </summary>
    public DateTime? StartedAtUtc { get; set; }

    /// <summary>
    /// When the student completed this module
    /// </summary>
    public DateTime? CompletedAtUtc { get; set; }

    /// <summary>
    /// Time spent on this module (in minutes)
    /// </summary>
    public int TimeSpentMinutes { get; set; }

    /// <summary>
    /// Number of questions answered
    /// </summary>
    public int AnsweredQuestions { get; set; }

    /// <summary>
    /// Total number of questions in the module
    /// </summary>
    public int TotalQuestions { get; set; }
}