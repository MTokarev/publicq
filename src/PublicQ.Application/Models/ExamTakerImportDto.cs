namespace PublicQ.Application.Models;

/// <summary>
/// Exam taker DTO
/// <remarks>
/// This DTO is used to do a bulk import and assign students to the
/// assignment.
/// </remarks>
/// </summary>
public class ExamTakerImportDto
{
    /// <summary>
    /// Full name
    /// </summary>
    public required string Name { get; set; }
    
    /// <summary>
    /// Exam taker ID
    /// </summary>
    public required string Id { get; set; }
    
    /// <summary>
    /// Optional: Email address
    /// </summary>
    public string? Email { get; set; }
    
    /// <summary>
    /// Optional: Date of birth of the user.
    /// </summary>
    public DateTime? DateOfBirth { get; set; }
    
    /// <summary>
    /// Optional: Assignment ID
    /// </summary>
    public Guid? AssignmentId { get; set; }
}