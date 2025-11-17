using PublicQ.Application.Models.Exam;
using PublicQ.Shared.Enums;

namespace PublicQ.Application.Models.Session;

/// <summary>
/// Data transfer object representing a question for exam takers during assessment execution.
/// </summary>
public class ExamTakerQuestionDto
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
    
    /// <summary>
    /// Optional: list of static file URLs (e.g., images, diagrams) associated with the question.
    /// </summary>
    public HashSet<string>? StaticFileUrls { get; set; }
    
    /// <summary>
    /// List of possible answers for the question. Each answer can be marked as correct or not.
    /// <see cref="ExamTakerPossibleAnswersDto"/>
    /// </summary>
    public List<ExamTakerPossibleAnswersDto> Answers { get; set; } = new();
}