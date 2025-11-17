namespace PublicQ.Application.Models.Assignment;

/// <summary>
/// Assignment base data transfer object (DTO) containing common properties for creating or updating assignments.
/// </summary>
public abstract class AssignmentBaseDto
{
    /// <summary>
    /// Gets or sets the title/name of the assignment.
    /// This is the display name shown to students and administrators.
    /// </summary>
    /// <value>A string representing the assignment title. Cannot be null or empty.</value>
    /// <example>"Week 3 Math Assessment"</example>
    public string Title { get; set; } = string.Empty;
    
    /// <summary>
    /// Gets or sets the optional description/instructions for students.
    /// Provides detailed information about what students should expect or prepare for.
    /// </summary>
    /// <value>A string containing assignment instructions or null if no description is provided.</value>
    /// <example>"Complete all modules in order"</example>
    public string? Description { get; set; }
    
    /// <summary>
    /// Gets or sets when students can start taking the assessment.
    /// Students cannot access the assignment before this date and time.
    /// </summary>
    /// <value>A UTC DateTime representing the earliest moment students can begin the assignment.</value>
    /// <remarks>
    /// All dates are stored in UTC to ensure consistent behavior across time zones.
    /// The application layer should handle timezone conversion for display purposes.
    /// </remarks>
    public DateTime StartDateUtc { get; set; }
    
    /// <summary>
    /// Gets or sets when the assignment expires (students can't start new attempts).
    /// After this date, students can no longer begin the assignment, but can finish in-progress attempts.
    /// </summary>
    /// <value>A UTC DateTime representing when new assignment attempts are no longer permitted.</value>
    /// <remarks>
    /// Students who have already started before this deadline can typically continue,
    /// depending on business rules implemented in the service layer.
    /// </remarks>
    public DateTime EndDateUtc { get; set; }
    
    /// <summary>
    /// Gets or sets whether to show results immediately after completion.
    /// Controls student access to their scores and feedback upon assignment completion.
    /// </summary>
    /// <value>
    /// <c>true</c> if students see results immediately upon completion;
    /// <c>false</c> if results are withheld until manually released by instructors.
    /// Default is <c>true</c>.
    /// </value>
    /// <remarks>
    /// When false, instructors must manually release results through the admin interface.
    /// This is useful for assignments requiring manual grading or delayed result publication.
    /// </remarks>
    public bool ShowResultsImmediately { get; set; } = true;
    
    /// <summary>
    /// Gets or sets whether to randomize question order within modules.
    /// When enabled, questions are presented in random order to reduce cheating opportunities.
    /// </summary>
    /// <value>
    /// <c>true</c> to randomize question order for each student;
    /// <c>false</c> to present questions in their defined sequence.
    /// Default is <c>false</c>.
    /// </value>
    /// <remarks>
    /// Randomization occurs per student and per module. The same student will see
    /// consistent ordering across sessions, but different students see different orders.
    /// </remarks>
    public bool RandomizeQuestions { get; set; }
    
    /// <summary>
    /// Gets or sets whether to randomize answers' order within question.
    /// When enabled, answers are presented in random order to reduce cheating opportunities.
    /// </summary>
    public bool RandomizeAnswers { get; set; }
    
    /// <summary>
    /// Gets the server's current UTC time.
    /// Used by clients to make date comparisons without relying on potentially manipulated local clocks.
    /// </summary>
    /// <value>The current UTC DateTime from the server.</value>
    /// <remarks>
    /// This prevents clock manipulation vulnerabilities where users could access assignments
    /// outside their availability window by changing their local system time.
    /// Clients should use this value instead of `new Date()` for all date comparisons.
    /// </remarks>
    public DateTime ServerUtcNow { get; set; } = DateTime.UtcNow;
}