namespace PublicQ.Application.Models.Assignment;

/// <summary>
/// Exam taker assignment data transfer object.
/// </summary>
public class ExamTakerAssignmentDto : AssignmentBaseDto
{
    /// <summary>
    /// Gets or sets the unique identifier of the exam taker assignment.
    /// </summary>
    public Guid Id { get; set; }
 
    /// <summary>
    /// Exam taker assignment that associates Assignments and Exam Takers.
    /// </summary>
    public Guid ExamTakerAssignmentId { get; set; }
    
    /// <summary>
    /// Indicates whether the assignment is published and visible to students.
    /// </summary>
    public bool IsPublished { get; set; }
    
    /// <summary>
    /// Group identifier containing the assessment modules.
    /// </summary>
    public Guid GroupId { get; set; }
  
    /// <summary>
    /// Gets or sets the name of the group containing the assessment modules.
    /// </summary>
    public string GroupTitle { get; set; }
}