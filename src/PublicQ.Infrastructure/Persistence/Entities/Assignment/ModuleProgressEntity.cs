using System.ComponentModel.DataAnnotations;
using PublicQ.Application.Models.Session;
using PublicQ.Infrastructure.Persistence.Entities.Group;
using PublicQ.Infrastructure.Persistence.Entities.Module;

namespace PublicQ.Infrastructure.Persistence.Entities.Assignment;

/// <summary>
/// Represents a student's progress through a specific module within an assignment.
/// Tracks the completion status, scoring, and timing for one module of a student's assignment journey.
/// Each ModuleProgressEntity corresponds to one module from the assignment's group that the student must complete.
/// </summary>
/// <remarks>
/// This entity provides granular tracking of student progress through assignments:
/// - Links to both the student's assignment and the specific module being attempted
/// - Tracks completion status from not started through completed
/// - Records scoring information including percentage and pass/fail status
/// - Contains timing data for analytics and progress monitoring
/// - Serves as parent for individual question responses within the module
/// 
/// The relationship to GroupMemberEntity (rather than directly to AssessmentModuleEntity)
/// preserves the module's position within the group sequence and any group-specific
/// configuration like passing score requirements.
/// </remarks>
public class ModuleProgressEntity
{
    /// <summary>
    /// Gets or sets the unique identifier for this module progress record.
    /// </summary>
    /// <value>A GUID that uniquely identifies this student's progress on this specific module.</value>
    [Key]
    public Guid Id { get; set; }
    
    /// <summary>
    /// Randomization seed used for shuffling questions in this module instance.
    /// </summary>
    public Guid? QuestionRandomizationSeed { get; set; }
    
    /// <summary>
    /// Randomization seed used for shuffling answer options within questions in this module instance.
    /// </summary>
    public Guid? AnswerRandomizationSeed { get; set; }
    
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
    /// Returns null if module hasn't started or has no duration limit.
    /// Returns TimeSpan.Zero if time has expired.
    /// </summary>
    public TimeSpan? TimeRemaining
    {
        get
        {
            if (StartedAtUtc == null || DurationInMinutes == 0)
                return null;

            var endTime = StartedAtUtc.Value.AddMinutes(DurationInMinutes);
            var remaining = endTime - DateTime.UtcNow;
            
            return remaining > TimeSpan.Zero ? remaining : TimeSpan.Zero;
        }
    }
    
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
    /// IMPORTANT: This is a computed property and not stored in the database. Questions Responses
    /// must be loaded to calculate this value.
    /// </remarks>
    public decimal? ScorePercentage => QuestionResponses.Count(qr => qr.IsCorrect ?? false) /
        (decimal)(AssessmentModuleVersion.Questions.Count == 0 ? 1 : AssessmentModuleVersion.Questions.Count) * 100;
    
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
    /// IMPORTANT: This is a computed property and not stored in the database. Questions Responses
    /// must be loaded to calculate this value.
    /// </remarks>
    public bool? Passed => ScorePercentage >= AssessmentModuleVersion.PassingScorePercentage;
    
    /// <summary>
    /// Passing score percentage required to pass this module.
    /// <remarks>
    /// IMPORTANT: AssessmentModuleVersion is required to be loaded to access this property.
    /// </remarks>
    /// </summary>
    public decimal PassingScorePercentage => AssessmentModuleVersion.PassingScorePercentage;
    
    // Foreign Keys
    /// <summary>
    /// Gets or sets the foreign key reference to the exam taker assignment.
    /// Links this module progress to a specific student's assignment journey.
    /// </summary>
    /// <value>A GUID referencing the <see cref="ExamTakerAssignmentEntity.Id"/> this progress belongs to.</value>
    /// <remarks>
    /// This establishes the relationship between the student's overall assignment
    /// and their progress on individual modules within that assignment.
    /// Used to group all module progress records for a single student's assignment attempt.
    /// </remarks>
    [Required]
    public Guid ExamTakerAssignmentId { get; set; }
    
    /// <summary>
    /// Gets or sets the identifier of the exam taker (student) working on this module.
    /// Redundant with ExamTakerAssignmentId but useful for direct queries and indexing.
    /// </summary>
    /// <value>A string representing the unique identifier of the exam taker.</value>
    /// <remarks>
    /// While this information is accessible through the ExamTakerAssignment navigation property,
    /// having it directly on this entity improves query performance and simplifies
    /// common operations like finding all progress for a specific student.
    /// Maximum length follows system requirements for user identifiers.
    /// </remarks>
    [Required]
    public string ExamTakerId { get; set; } = default!;
    
    /// <summary>
    /// Gets or sets the foreign key reference to the specific group member.
    /// Links this progress to the module's position and configuration within the assignment's group.
    /// </summary>
    /// <value>A GUID referencing the <see cref="GroupMemberEntity.Id"/> for this module.</value>
    /// <remarks>
    /// By referencing GroupMemberEntity rather than AssessmentModuleEntity directly,
    /// this preserves important group-specific information such as:
    /// - The module's order within the group sequence
    /// - Group-specific passing score requirements
    /// - Module configuration within the context of this particular group
    /// This design allows the same module to have different requirements in different groups.
    /// </remarks>
    [Required]
    public Guid GroupMemberId { get; set; } // References the specific GroupMember
    
    /// <summary>
    /// The specific version of the assessment module that was used for this progress.
    /// Ensures consistency throughout the student's session even if new versions are published.
    /// </summary>
    [Required]
    public Guid AssessmentModuleVersionId { get; set; }
    
    // Navigation Properties
    /// <summary>
    /// Navigation property to the specific module version used.
    /// </summary>
    public AssessmentModuleVersionEntity AssessmentModuleVersion { get; set; } = default!;
    
    /// <summary>
    /// Gets or sets the exam taker assignment entity this progress belongs to.
    /// Provides access to the student's overall assignment context and configuration.
    /// </summary>
    /// <value>The <see cref="ExamTakerAssignmentEntity"/> referenced by <see cref="ExamTakerAssignmentId"/>.</value>
    /// <remarks>
    /// Through this navigation property, you can access:
    /// - The parent assignment configuration and timing
    /// - Other module progress records for the same student assignment
    /// - The student's overall progress through the complete assignment
    /// </remarks>
    public ExamTakerAssignmentEntity ExamTakerAssignment { get; set; } = default!;
    
    /// <summary>
    /// Gets or sets the group member entity representing this module within the assignment's group.
    /// Provides access to module sequencing, configuration, and the actual module content.
    /// </summary>
    /// <value>The <see cref="GroupMemberEntity"/> referenced by <see cref="GroupMemberId"/>.</value>
    /// <remarks>
    /// Through this navigation property, you can access:
    /// - The module's order and position within the group
    /// - Group-specific configuration like passing score requirements
    /// - The actual AssessmentModuleEntity with questions and content
    /// - Other modules in the same group for sequence planning
    /// </remarks>
    public GroupMemberEntity GroupMember { get; set; } = default!;
    
    /// <summary>
    /// Gets or sets the collection of individual question responses within this module.
    /// Contains the student's answers to each question in this module.
    /// </summary>
    /// <value>A collection of <see cref="QuestionResponseEntity"/> instances representing individual answers.</value>
    /// <remarks>
    /// This collection contains one QuestionResponseEntity for each question the student
    /// has answered within this module. Each response includes:
    /// - The student's actual answer (text or selected options)
    /// - Whether the answer was correct
    /// - Points awarded and timing information
    /// 
    /// Used for detailed grading, analytics, and providing feedback to students.
    /// The collection grows as the student progresses through questions in the module.
    /// </remarks>
    public ICollection<QuestionResponseEntity> QuestionResponses { get; set; } = new List<QuestionResponseEntity>();
    
    /// <summary>
    /// Converts the entity to a Data Transfer Object (DTO).
    /// </summary>
    /// <returns>Returns converted <see cref="ModuleProgressDto"/></returns>
    public ModuleProgressDto ConvertToDto()
    {
        return new ModuleProgressDto
        {
            Id = Id,
            HasStarted = HasStarted,
            DurationInMinutes = DurationInMinutes,
            StartedAtUtc = StartedAtUtc,
            CompletedAtUtc = CompletedAtUtc,
            TimeRemaining = TimeRemaining,
            ScorePercentage = ScorePercentage ?? 0,
            PassingScorePercentage = AssessmentModuleVersion.PassingScorePercentage,
            ExamTakerAssignmentId = ExamTakerAssignmentId,
            ExamTakerId = ExamTakerId,
            GroupMemberId = GroupMemberId,
            AssessmentModuleVersionId = AssessmentModuleVersionId,
            QuestionResponses = QuestionResponses.Select(qr => qr.ConvertToDto()).ToList()
        };
    }
}