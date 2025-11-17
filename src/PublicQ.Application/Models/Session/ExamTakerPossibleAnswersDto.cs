namespace PublicQ.Application.Models.Session;

/// <summary>
/// Students safe possible answer to be presented in an exam session.
/// <remarks>
/// This DTO is intended for use by exam takers and excludes any sensitive information
/// like whether the answer is correct or not.
/// </remarks>
/// </summary>
public class ExamTakerPossibleAnswersDto
{
    /// <summary>
    /// Question possible answer identifier.
    /// </summary>
    public Guid Id { get; set; }
    
    /// <summary>
    /// A possible answer text for a question.
    /// </summary>
    public string Text { get; set; } = default!;
    
    /// <summary>
    /// Optional list of static file URLs (e.g., answer illustrations).
    /// </summary>
    public HashSet<string>? StaticFileUrls { get; set; }
    
    /// <summary>
    /// Optional list of static file IDs (e.g., answer illustrations).
    /// </summary>
    public HashSet<Guid>? StaticFileIds { get; set; }
}