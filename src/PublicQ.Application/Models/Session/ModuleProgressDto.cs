using PublicQ.Application.Models.Exam;

namespace PublicQ.Application.Models.Session;

/// <summary>
/// Represents the progress of a student through a specific module within an assignment.
/// </summary>
public class ModuleProgressDto
{

    /// <summary>
    /// Module progress identifier.
    /// </summary>
    public Guid Id { get; set; }
    
    /// <summary>
    /// Indicates whether the student has started working on this module.
    /// </summary>
    public bool HasStarted { get; set; }
    
    /// <summary>
    /// Duration in minutes. Represents how much time is allowed for the test.
    /// </summary>
    public int DurationInMinutes { get; set; }
    
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
    /// Gets the remaining time for this module.
    /// Server-calculated to prevent client-side clock manipulation.
    /// </summary>
    /// <value>
    /// TimeSpan representing remaining time, or null if module hasn't started or has no duration limit.
    /// Returns TimeSpan.Zero if time has expired.
    /// </value>
    public TimeSpan? TimeRemaining { get; set; }
    
    /// <summary>
    /// Gets or sets the score achieved on this module as a percentage.
    /// Represents the student's performance on this module's assessment content.
    /// </summary>
    /// <value>
    /// A decimal value between 0 and 100 representing the percentage score,
    /// or null if the module has not been scored yet.
    /// </value>
    /// <remarks>
    /// Calculated based on the student's responses to questions within the module.
    /// Used for determining pass/fail status, assignment grading, and progress reporting.
    /// Percentage allows for consistent scoring across modules with different question counts.
    /// </remarks>
    public decimal ScorePercentage { get; set; }
    
    /// <summary>
    /// Minimum percentage of correct answers required to pass.
    /// </summary>
    public int PassingScorePercentage { get; set; }
    
    /// <summary>
    /// Gets or sets whether this module attempt passed based on the module's passing criteria.
    /// Indicates if the student met the minimum requirements for module completion.
    /// </summary>
    /// <value>
    /// <c>true</c> if the student passed the module;
    /// <c>false</c> if the student failed the module;
    /// <c>null</c> if the module has not been completed or scored yet.
    /// </value>
    /// <remarks>
    /// Determined by comparing the ScorePercentage against the passing score defined
    /// in the GroupMemberEntity or module configuration. Used for progression logic
    /// and determining if the student can advance to subsequent modules.
    /// </remarks>
    public bool? Passed => ScorePercentage >= PassingScorePercentage;
    
    // Foreign Keys
    /// <summary>
    /// Gets or sets the foreign key reference to the exam taker assignment.
    /// Links this module progress to a specific student's assignment journey.
    /// </summary>
    /// <remarks>
    /// This establishes the relationship between the student's overall assignment
    /// and their progress on individual modules within that assignment.
    /// Used to group all module progress records for a single student's assignment attempt.
    /// </remarks>
    public Guid ExamTakerAssignmentId { get; set; }
    
    /// <summary>
    /// Gets or sets the identifier of the exam taker (student) working on this module.
    /// Redundant with ExamTakerAssignmentId but useful for direct queries and indexing.
    /// </summary>
    /// <value>A string representing the unique identifier of the exam taker.</value>
    public string ExamTakerId { get; set; } = default!;
    
    /// <summary>
    /// Gets or sets the foreign key reference to the specific group member.
    /// Links this progress to the module's position and configuration within the assignment's group.
    /// </summary>
    public Guid GroupMemberId { get; set; } // References the specific GroupMember
    
    /// <summary>
    /// Assessment module version details.
    /// This version of the module that the student is working on.
    /// Once users start a module, the version is fixed for that attempt.
    /// </summary>
    public Guid AssessmentModuleVersionId { get; set; } = default!;
    
    /// <summary>
    /// Gets or sets the collection of individual question responses within this module.
    /// Contains the student's answers to each question in this module.
    /// </summary>
    /// <value>A collection of <see cref="QuestionResponseDto"/> instances representing individual answers.</value>
    /// <remarks>
    /// This collection contains one QuestionResponseDto for each question the student
    /// has answered within this module. Each response includes:
    /// - The student's actual answer (text or selected options)
    /// - Whether the answer was correct
    /// Used for detailed grading, analytics, and providing feedback to students.
    /// The collection grows as the student progresses through questions in the module.
    /// </remarks>
    public ICollection<QuestionResponseDto> QuestionResponses { get; set; } = new List<QuestionResponseDto>();
}