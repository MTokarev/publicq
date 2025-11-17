using PublicQ.Shared.Enums;

namespace PublicQ.Application.Models.Exam;

/// <summary>
/// Represents a question to be created in a test module.
/// </summary>
public class QuestionCreateDto
{
    /// <summary>
    /// Module identifier to which this question belongs.
    /// </summary>
    public Guid ModuleId { get; set; }
    
    /// <summary>
    /// Question order within the module.
    /// </summary>
    public int Order { get; set; }
    
    /// <summary>
    /// Assessment module version identifier to which this question belongs.
    /// </summary>
    public Guid ModuleVersionId { get; set; }
    
    /// <summary>
    /// Question text that will be presented to the user.
    /// </summary>
    public string Text { get; set; } = default!;
    
    /// <summary>
    /// Optional: list of static file URLs (e.g., images, diagrams) associated with the question.
    /// </summary>
    public HashSet<Guid> StaticFileIds { get; set; } = new ();
    
    /// <summary>
    /// Question type, indicating how the question should be answered (e.g., single choice, multiple choice, free text).
    /// <see cref="QuestionType"/>
    /// </summary>
    public QuestionType Type { get; set; }
    
    /// <summary>
    /// Possible answers for the question in a test module.
    /// </summary>
    public IList<PossibleAnswerCreateDto> Answers { get; set; } = new List<PossibleAnswerCreateDto>();
}