using System.ComponentModel.DataAnnotations;
using PublicQ.Application.Models.Reporting;

namespace PublicQ.Infrastructure.Persistence.Entities.Assignment;

/// <summary>
/// Represents the assignment of a specific exam taker (student) to a specific assignment.
/// This entity creates the many-to-many relationship between assignments and students,
/// enabling multiple students to be assigned to the same assignment and tracking
/// each student's individual progress through the assigned modules.
/// </summary>
/// <remarks>
/// This entity serves as both a relationship table and a progress container:
/// - Links students to assignments (many-to-many relationship)
/// - Contains the student's progress through all modules in the assignment
/// - Tracks when the student was assigned
/// - Serves as the parent for all module progress tracking
/// 
/// Each ExamTakerAssignmentEntity represents one student's complete journey
/// through one assignment, including all modules they must complete.
/// </remarks>
public class ExamTakerAssignmentEntity
{
    /// <summary>
    /// Gets or sets the unique identifier for this exam taker assignment.
    /// </summary>
    /// <value>A GUID that uniquely identifies this student-assignment relationship.</value>
    [Key]
    public Guid Id { get; set; }
    
    // Foreign Keys
    /// <summary>
    /// Gets or sets the foreign key reference to the assignment.
    /// Links this student assignment to a specific assignment configuration.
    /// </summary>
    /// <value>A GUID referencing the <see cref="AssignmentEntity.Id"/> this student is assigned to.</value>
    /// <remarks>
    /// This establishes the many-to-one relationship from student assignments to assignments.
    /// Multiple students can be assigned to the same assignment through separate
    /// ExamTakerAssignmentEntity records.
    /// </remarks>
    [Required]
    public Guid AssignmentId { get; set; }
    
    /// <summary>
    /// Gets or sets the identifier of the exam taker (student) assigned to this assignment.
    /// References the student who must complete the assigned modules.
    /// </summary>
    /// <value>A string representing the unique identifier of the exam taker.</value>
    /// <remarks>
    /// This is typically the user ID from the identity system (e.g., ASP.NET Core Identity).
    /// The same student can have multiple ExamTakerAssignmentEntity records for different assignments.
    /// </remarks>
    [Required]
    public string ExamTakerId { get; set; } = default!;
    
    /// <summary>
    /// Exam taker's display name at the time of assignment.
    /// This redundantly stores the name to preserve historical accuracy,
    /// even if the user's name changes later or in case of user deletion in the identity system.
    /// </summary>
    [Required]
    public string ExamTakerDisplayName { get; set; } = string.Empty;
    
    // Navigation Properties
    /// <summary>
    /// Gets or sets the assignment entity this student is assigned to.
    /// Provides access to assignment configuration, timing, and module group.
    /// </summary>
    /// <value>The <see cref="AssignmentEntity"/> referenced by <see cref="AssignmentId"/>.</value>
    /// <remarks>
    /// Through this navigation property, you can access:
    /// - Assignment title, description, and configuration
    /// - Start and end dates for the assignment
    /// - The group of modules the student must complete
    /// - Assignment-level settings like randomization and result visibility
    /// </remarks>
    public AssignmentEntity Assignment { get; set; } = default!;
    
    /// <summary>
    /// Gets or sets the collection of module progress records for this student's assignment.
    /// Tracks the student's progress through each module in the assigned group.
    /// </summary>
    /// <value>A collection of <see cref="ModuleProgressEntity"/> instances representing module completion status.</value>
    /// <remarks>
    /// This collection contains one ModuleProgressEntity for each module in the assignment's group.
    /// Each ModuleProgressEntity tracks:
    /// - Whether the module has been started, is in progress, or completed
    /// - The student's score and pass/fail status for the module
    /// - Timing information (start, completion, duration)
    /// - Individual question responses within the module
    /// 
    /// The collection is populated when the student first accesses the assignment,
    /// creating progress tracking records for all modules they must complete.
    /// </remarks>
    public ICollection<ModuleProgressEntity> ModuleProgress { get; set; } = new List<ModuleProgressEntity>();
    
    /// <summary>
    /// Converts this entity to a data transfer object (DTO) for reporting purposes.
    /// </summary>
    /// <returns>Returns <see cref="IndividualUserReportDto"/></returns>
    public IndividualUserReportDto ConvertToDto()
    {
        return new IndividualUserReportDto
        {
            Id = Id,
            ExamTakerId = ExamTakerId,
            ExamTakerDisplayName = ExamTakerDisplayName
        };
    }
}