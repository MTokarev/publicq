using PublicQ.Shared.Enums;

namespace PublicQ.Application.Models.Exam;

/// <summary>
/// Abstract base class for question data transfer objects.
/// </summary>
public abstract class QuestionBase
{
    /// <summary>
    /// Question identifier.
    /// </summary>
    public Guid Id { get; set; }
    
    /// <summary>
    /// Question text that will be presented to the user.
    /// </summary>
    public string Text { get; set; } = default!;
    
    /// <summary>
    /// Question type, indicating how the question should be answered (e.g., single choice, multiple choice, free text).
    /// <see cref="QuestionType"/>
    /// </summary>
    public QuestionType Type { get; set; }
    
    /// <summary>
    /// Optional: list of static file IDs (e.g., images, diagrams) associated with the question.
    /// </summary>
    public HashSet<Guid>? StaticFileIds { get; set; }
}