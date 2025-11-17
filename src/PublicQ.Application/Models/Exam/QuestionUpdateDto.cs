namespace PublicQ.Application.Models.Exam;

/// <summary>
/// Question update model used to modify existing questions in a test module.
/// </summary>
public class QuestionUpdateDto : QuestionBase
{
    /// <summary>
    /// List of possible answers for the question. Each answer can be marked as correct or not.
    /// <see cref="PossibleAnswerDto"/>
    /// </summary>
    public List<PossibleAnswerCreateDto> Answers { get; set; } = new();
}