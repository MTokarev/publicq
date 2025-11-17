using PublicQ.Shared.Enums;

namespace PublicQ.Application.Models.Session;

/// <summary>
/// Question response data transfer object (DTO) used when a student submits their answer to a question.
/// </summary>
public class QuestionResponseOperationDto
{
    /// <summary>
    /// Question ID that this response corresponds to
    /// </summary>
    public Guid QuestionId { get; set; }
    
    /// <summary>
    /// For multiple choice/select questions: selected answer IDs.
    /// </summary>
    public ICollection<Guid> SelectedAnswerIds { get; set; } = new List<Guid>();
    
    /// <summary>
    /// Stores the question type at the time of response for validation.
    /// </summary>
    public QuestionType QuestionType { get; set; }

    /// <summary>
    /// For text-based questions: the user's text response.
    /// </summary>
    public string? TextResponse { get; set; }
    
    /// <summary>
    /// Gets or sets when the response was submitted by the student.
    /// Records the exact moment the student provided their answer to this question.
    /// </summary>
    /// <value>A UTC DateTime representing when the student submitted their response.</value>
    /// <remarks>
    /// This timestamp is crucial for:
    /// - Determining question-level timing and pace analytics
    /// - Enforcing time limits on individual questions or modules
    /// - Audit trails for academic integrity purposes
    /// - Understanding student response patterns and behavior
    /// All timestamps are stored in UTC for consistency across time zones.
    /// </remarks>
    public DateTime RespondedAtUtc { get; set; }
}