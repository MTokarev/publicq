using PublicQ.Shared.Enums;

namespace PublicQ.Application.Models.Exam;

/// <summary>
/// Possible answers for a question in a test module.
/// </summary>
public class PossibleAnswersCreateDto
{
    /// <summary>
    /// Associated question type for this possible answer.
    /// </summary>
    public QuestionType QuestionType { get; set; }
    
    /// <summary>
    /// Possible answers for a question in a test module.
    /// </summary>
    public IList<PossibleAnswerCreateDto> Answers { get; set; } = new List<PossibleAnswerCreateDto>();
}