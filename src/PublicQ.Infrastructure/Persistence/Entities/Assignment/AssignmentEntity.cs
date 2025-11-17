using System.ComponentModel.DataAnnotations;
using PublicQ.Application.Models.Assignment;
using PublicQ.Infrastructure.Persistence.Entities.Group;

namespace PublicQ.Infrastructure.Persistence.Entities.Assignment;

/// <summary>
/// Represents an assignment of a group (containing modules) to students.
/// An assignment is a time-bound allocation of assessment modules from a group to specific exam takers.
/// It controls when students can access and complete assessments, tracks their progress,
/// and manages result visibility and configuration options.
/// </summary>
/// <remarks>
/// The assignment serves as the central control entity for:
/// - Scheduling assessment availability (start/end dates)
/// - Configuring assessment behavior (randomization, navigation, results)
/// - Managing publication status (draft vs published)
/// - Linking groups of modules to specific students
/// - Tracking overall assignment completion and progress
/// </remarks>
public class AssignmentEntity
{
    /// <summary>
    /// Gets or sets the unique identifier for this assignment.
    /// </summary>
    /// <value>A GUID that uniquely identifies the assignment across the system.</value>
    [Key]
    public Guid Id { get; set; }
    
    /// <summary>
    /// Gets or sets the title/name of the assignment.
    /// This is the display name shown to students and administrators.
    /// </summary>
    /// <value>A string representing the assignment title. Cannot be null or empty.</value>
    /// <example>"Week 3 Math Assessment" or "Final Programming Exam"</example>
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;
    
    /// <summary>
    /// Normalized title for case-insensitive comparisons and searches.
    /// This is typically the uppercase version of <see cref="Title"/>.
    /// </summary>
    [MaxLength(200)]
    public string NormalizedTitle { get; set; } = string.Empty;
    
    /// <summary>
    /// Gets or sets the optional description/instructions for students.
    /// Provides detailed information about what students should expect or prepare for.
    /// </summary>
    /// <value>A string containing assignment instructions or null if no description is provided.</value>
    /// <example>"Complete all modules in order. You have 2 hours total. Calculator allowed."</example>
    [MaxLength(5000)]
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
    public bool RandomizeQuestions { get; set; } = false;
    
    /// <summary>
    /// Gets or sets whether to randomize answers' order within question.
    /// When enabled, answers are presented in random order to reduce cheating opportunities.
    /// </summary>
    public bool RandomizeAnswers { get; set; } = false;

    /// <summary>
    /// Gets or sets the assignment status, indicating whether it's published and visible to students.
    /// Controls the assignment lifecycle from draft creation to student availability.
    /// </summary>
    /// <value>
    /// <c>true</c> if the assignment is published and visible to assigned students;
    /// <c>false</c> if the assignment is in draft status and only visible to administrators.
    /// Default is <c>false</c> (draft).
    /// </value>
    /// <remarks>
    /// Draft assignments allow administrators to configure and test before making them available.
    /// Only published assignments appear in student dashboards and can be attempted.
    /// </remarks>
    public bool IsPublished { get; set; }
    
    // Foreign Keys
    /// <summary>
    /// Gets or sets the foreign key reference to the group containing the assessment modules.
    /// Links this assignment to a specific group of modules that students must complete.
    /// </summary>
    /// <value>A GUID referencing the <see cref="GroupEntity.Id"/> containing the assigned modules.</value>
    /// <remarks>
    /// The group defines the sequence and configuration of modules students must complete.
    /// Changing this reference effectively changes the entire content of the assignment.
    /// </remarks>
    [Required]
    public Guid GroupId { get; set; }
    
    /// <summary>
    /// Gets or sets the username of the administrator who created this assignment.
    /// Tracks assignment ownership for audit and permission purposes.
    /// </summary>
    /// <value>A string representing the user ID of the assignment creator.</value>
    [Required]
    [MaxLength(256)]
    public string CreatedByUser { get; set; } = default!;
    
    /// <summary>
    /// Gets or sets the user username of the administrator who updated this assignment.
    /// Tracks assignment ownership for audit and permission purposes.
    /// </summary>
    [MaxLength(256)]
    public string? UpdatedByUser { get; set; } = string.Empty;
    
    /// <summary>
    /// Gets or sets when this assignment was created.
    /// Provides audit trail information for assignment lifecycle tracking.
    /// </summary>
    /// <value>A UTC DateTime representing when the assignment was first created.</value>
    /// <remarks>
    /// Set automatically upon entity creation. Used for sorting, filtering, and audit purposes.
    /// All timestamps are stored in UTC for consistency across time zones.
    /// </remarks>
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    
    /// <summary>
    /// Gets or sets when this assignment was last updated.
    /// Tracks the most recent modification for audit and synchronization purposes.
    /// </summary>
    /// <value>A UTC DateTime representing the last modification time, or null if never updated.</value>
    /// <remarks>
    /// Should be updated whenever any assignment property changes.
    /// Used for optimistic concurrency control and change tracking.
    /// </remarks>
    public DateTime? UpdatedAtUtc { get; set; }
    
    // Navigation Properties
    /// <summary>
    /// Gets or sets the group entity containing the assessment modules for this assignment.
    /// Provides access to the module sequence and configuration assigned to students.
    /// </summary>
    /// <value>The <see cref="GroupEntity"/> referenced by <see cref="GroupId"/>.</value>
    /// <remarks>
    /// This navigation property enables access to the complete module structure
    /// including order, passing requirements, and individual module details.
    /// </remarks>
    public GroupEntity? Group { get; set; }
    
    /// <summary>
    /// Gets or sets the collection of student assignments linking specific exam takers to this assignment.
    /// Represents which students have been assigned to complete this assessment.
    /// </summary>
    /// <value>A collection of <see cref="ExamTakerAssignmentEntity"/> instances.</value>
    /// <remarks>
    /// This many-to-many relationship through ExamTakerAssignmentEntity allows:
    /// - Tracking which students are assigned to each assignment
    /// - Recording when each student was assigned
    /// - Managing individual student progress and module completion
    /// Each ExamTakerAssignmentEntity contains the student's progress through all modules.
    /// </remarks>
    public ICollection<ExamTakerAssignmentEntity> ExamTakerAssignments { get; set; } = new List<ExamTakerAssignmentEntity>();
    
    /// <summary>
    /// Converts the entity to a Data Transfer Object (DTO).
    /// </summary>
    /// <returns>Returns <see cref="AssignmentDto"/></returns>
    public AssignmentDto ConvertToDto()
    {
        return new AssignmentDto
        {
            Id = Id,
            Title = Title,
            Description = Description,
            StartDateUtc = StartDateUtc,
            EndDateUtc = EndDateUtc,
            ShowResultsImmediately = ShowResultsImmediately,
            RandomizeQuestions = RandomizeQuestions,
            RandomizeAnswers = RandomizeAnswers,
            IsPublished = IsPublished,
            GroupId = GroupId,
            GroupTitle = Group?.Title ?? string.Empty,
            CreatedByUser = CreatedByUser,
            UpdatedByUser = UpdatedByUser,
            CreatedAtUtc = CreatedAtUtc,
            UpdatedAtUtc = UpdatedAtUtc
        };
    }
    
    /// <summary>
    /// Converts the entity to an ExamTakerAssignmentDto.
    /// </summary>
    /// <param name="examTakerAssignmentId">Exam taker assignment ID</param>
    /// <returns>Returns <see cref="ExamTakerAssignmentDto"/></returns>
    public ExamTakerAssignmentDto ConvertToExamTakerAssignmentDto(Guid examTakerAssignmentId)
    {
        return new ExamTakerAssignmentDto
        {
            Id = Id,
            Title = Title,
            Description = Description,
            StartDateUtc = StartDateUtc,
            EndDateUtc = EndDateUtc,
            IsPublished = IsPublished,
            ShowResultsImmediately = ShowResultsImmediately,
            RandomizeQuestions = RandomizeQuestions,
            RandomizeAnswers = RandomizeAnswers,
            GroupId = GroupId,
            GroupTitle = Group?.Title ?? string.Empty,
            ExamTakerAssignmentId = examTakerAssignmentId
        };
    }

    /// <summary>
    /// Overrides the default Equals method to compare assignments based on their unique identifier (Id).
    /// </summary>
    /// <param name="obj"><see cref="AssignmentEntity"/></param>
    /// <returns>Returns true if ID is the same.</returns>
    public override bool Equals(object obj)
    {
        if (obj is not AssignmentEntity assignment)
        {
            return false;
        }
        
        return Id == assignment.Id;
    }
    
    /// <summary>
    /// Overrides the default GetHashCode method to provide a hash code based on the unique identifier (Id).
    /// </summary>
    public override int GetHashCode()
    {
        return Id.GetHashCode();
    }
}
