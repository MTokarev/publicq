using PublicQ.Shared.Enums;

namespace PublicQ.Application.Models.Exam;

/// <summary>
/// Possible answer for a question in a test module.
/// </summary>
public class PossibleAnswerCreateDto
{
    /// <summary>
    /// A possible answer text for a question.
    /// </summary>
    public string Text { get; set; } = default!;
    
    /// <summary>
    /// Answer order within the question.
    /// </summary>
    public int Order { get; set; }
    
    /// <summary>
    /// Optional list of static file IDs (e.g., answer illustrations).
    /// </summary>
    public HashSet<Guid> StaticFileIds { get; set; } = new ();
    
    /// <summary>
    /// Indicates whether this possible answer is correct or not.
    /// </summary>
    public bool IsCorrect { get; set; }
}