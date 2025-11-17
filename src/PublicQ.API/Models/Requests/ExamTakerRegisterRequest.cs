namespace PublicQ.API.Models.Requests;

/// <summary>
/// Exam taker registration request model.
/// </summary>
public class ExamTakerRegisterRequest
{
    /// <summary>
    /// Optional: User unique identifier.
    /// <remarks>
    /// System will generate a new ID if not provided.
    /// </remarks>
    /// </summary>
    public string? Id { get; set; }
    
    /// <summary>
    /// Optional: Email address of the exam taker.
    /// </summary>
    public string? Email { get; set; }
    
    /// <summary>
    /// Optional: Date of birth of the user.
    /// </summary>
    public DateTime? DateOfBirth { get; set; }
    
    /// <summary>
    /// Exam taker full name.
    /// </summary>
    public string FullName { get; set; }
}