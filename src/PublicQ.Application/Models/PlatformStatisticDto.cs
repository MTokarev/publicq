namespace PublicQ.Application.Models;

/// <summary>
/// Platform statistics model.
/// </summary>
public class PlatformStatisticDto
{
    /// <summary>
    /// Total number of users in the platform.
    /// </summary>
    public long TotalUsers { get; set; }

    /// <summary>
    /// Total number of groups in the platform.
    /// </summary>
    public long TotalGroups { get; set; }

    /// <summary>
    /// Total number of courses in the platform.
    /// </summary>
    public long TotalAssignments { get; set; }

    /// <summary>
    /// Total number of modules in the platform.
    /// </summary>
    public long TotalModules { get; set; }

    /// <summary>
    /// Total number of questions in the platform.
    /// </summary>
    public long TotalQuestions { get; set; }
}