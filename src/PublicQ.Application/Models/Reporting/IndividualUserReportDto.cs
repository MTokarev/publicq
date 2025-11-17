namespace PublicQ.Application.Models.Reporting;

/// <summary>
/// Individual user report details
/// </summary>
public class IndividualUserReportDto
{
    /// <summary>
    /// Gets or sets the unique identifier for this exam taker assignment.
    /// </summary>
    /// <value>A GUID that uniquely identifies this student-assignment relationship.</value>
    public Guid Id { get; set; }
    
    /// <summary>
    /// Gets or sets the identifier of the exam taker (student) assigned to this assignment.
    /// References the student who must complete the assigned modules.
    /// </summary>
    /// <value>A string representing the unique identifier of the exam taker.</value>
    /// <remarks>
    /// This is typically the user ID from the identity system (e.g., ASP.NET Core Identity).
    /// The same student can have multiple ExamTakerAssignmentEntity records for different assignments.
    /// </remarks>
    public string ExamTakerId { get; set; }
    
    /// <summary>
    /// Exam taker's display name at the time of assignment.
    /// This redundantly stores the name to preserve historical accuracy,
    /// even if the user's name changes later or in case of user deletion in the identity system.
    /// </summary>
    public string ExamTakerDisplayName { get; set; }
}