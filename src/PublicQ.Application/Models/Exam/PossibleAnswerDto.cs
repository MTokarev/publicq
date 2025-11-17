namespace PublicQ.Application.Models.Exam;

/// <summary>
/// Data transfer object representing a possible answer option for a question.
/// </summary>
public class PossibleAnswerDto
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
    
    /// <summary>
    /// Indicates whether this possible answer is correct or not.
    /// </summary>
    public bool IsCorrect { get; set; }
}