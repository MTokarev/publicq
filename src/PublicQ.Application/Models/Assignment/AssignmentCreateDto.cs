namespace PublicQ.Application.Models.Assignment;

/// <summary>
/// Data Transfer Object for creating a new assignment, extending the base assignment properties.
/// </summary>
public class AssignmentCreateDto : AssignmentBaseDto
{
    /// <summary>
    /// Gets or sets the collection of student assignments linking specific exam takers to this assignment.
    /// Represents which students have been assigned to complete this assessment.
    /// </summary>
    public HashSet<string> ExamTakerIds { get; set; } = [];
    
    /// <summary>
    /// Gets or sets the foreign key reference to the group containing the assessment modules.
    /// Links this assignment to a specific group of modules that students must complete.
    /// </summary>
    /// <remarks>
    /// The group defines the sequence and configuration of modules students must complete.
    /// Changing this reference effectively changes the entire content of the assignment.
    /// </remarks>
    public Guid GroupId { get; set; }
}