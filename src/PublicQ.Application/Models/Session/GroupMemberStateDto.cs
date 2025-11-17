using PublicQ.Application.Models.Group;

namespace PublicQ.Application.Models.Session;

/// <summary>
/// Represents a group member along with their current module status.
/// </summary>
public class GroupMemberStateDto : GroupMemberDto
{
    /// <summary>
    /// Member's current module status.
    /// <seealso cref="ModuleStatus"/>
    /// </summary>
    public ModuleStatus Status { get; set; }
    
    /// <summary>
    /// Gets or sets when the student started this module.
    /// Tracks the beginning of the student's work on this specific module.
    /// </summary>
    /// <value>
    /// A UTC DateTime representing when the student first accessed this module,
    /// or null if the module has not yet been started.
    /// </value>
    /// <remarks>
    /// This timestamp is set when the student first navigates to or begins working on the module.
    /// Used for progress tracking, analytics, and determining time spent on modules.
    /// All timestamps are stored in UTC for consistency across time zones.
    /// </remarks>
    public DateTime? StartedAtUtc { get; set; }
    
    /// <summary>
    /// Whether the student passed this module
    /// </summary>
    public bool? Passed { get; set; }
    
    /// <summary>
    /// Passing score for the module, if applicable
    /// </summary>
    public decimal? PassingScorePercentage { get; set; }
    
    /// <summary>
    /// Score achieved on this module
    /// </summary>
    public decimal? ScorePercentage { get; set; }
    
    /// <summary>
    /// Gets or sets when the module was completed by the student.
    /// Marks the successful completion of all requirements for this module.
    /// </summary>
    /// <value>
    /// A UTC DateTime representing when the student completed this module,
    /// or null if the module is not yet completed.
    /// </value>
    /// <remarks>
    /// This timestamp is set when the student finishes the module, typically after
    /// answering all questions and meeting any completion criteria.
    /// Used for progress tracking, completion reporting, and calculating completion duration.
    /// </remarks>
    public DateTime? CompletedAtUtc { get; set; }
    
    /// <summary>
    /// Duration in minutes. Represents how much time is allowed for the test.
    /// </summary>
    public int? DurationInMinutes { get; set; }
    
    /// <summary>
    /// Gets the remaining time for this module.
    /// Server-calculated to prevent client-side clock manipulation.
    /// </summary>
    /// <value>
    /// TimeSpan representing remaining time, or null if module hasn't started or has no duration limit.
    /// Returns TimeSpan.Zero if time has expired.
    /// </value>
    public TimeSpan? TimeRemaining { get; set; }
}