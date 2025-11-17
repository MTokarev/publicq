namespace PublicQ.Application.Models.Exam;

/// <summary>
/// Question to be presented in a test module.
/// </summary>
public class QuestionDto : QuestionBase
{
    /// <summary>
    /// Optional: list of static file URLs (e.g., images, diagrams) associated with the question.
    /// </summary>
    public HashSet<string>? StaticFileUrls { get; set; }
    
    /// <summary>
    /// List of possible answers for the question. Each answer can be marked as correct or not.
    /// <see cref="PossibleAnswerDto"/>
    /// </summary>
    public List<PossibleAnswerDto> Answers { get; set; } = new();
}