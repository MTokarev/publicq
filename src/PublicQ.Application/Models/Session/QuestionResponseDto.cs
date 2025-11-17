using PublicQ.Shared.Enums;

namespace PublicQ.Application.Models.Session;

/// <summary>
/// Question response data transfer object (DTO).
/// </summary>
public class QuestionResponseDto
{
     /// <summary>
    /// Gets or sets the unique identifier for this question response.
    /// </summary>
    /// <value>A GUID that uniquely identifies this student's response to this specific question.</value>
    public Guid Id { get; set; }
    
    /// <summary>
    /// For multiple choice/select questions: selected answer IDs.
    /// </summary>
    public ICollection<Guid> SelectedAnswerIds { get; set; } = new List<Guid>();

    /// <summary>
    /// For text-based questions: the user's text response.
    /// </summary>
    public string? TextResponse { get; set; }

    /// <summary>
    /// Stores the question type at the time of response for validation.
    /// </summary>
    public QuestionType QuestionType { get; set; }
    
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
    
    // Foreign Keys
    /// <summary>
    /// Gets or sets the foreign key reference to the module progress this response belongs to.
    /// Links this individual response to the student's progress through a specific module.
    /// </summary>
    /// <value>A GUID referencing the module progress ID containing this response.</value>
    /// <remarks>
    /// This establishes the hierarchical relationship: Assignment → Module Progress → Question Responses.
    /// Used to group all responses for a student's work on a particular module and to
    /// calculate module-level scores and completion status.
    /// </remarks>
    public Guid ModuleProgressId { get; set; }
    
    /// <summary>
    /// Gets or sets the foreign key reference to the specific question being answered.
    /// Links this response to the question definition, content, and correct answers.
    /// </summary>
    /// <value>A GUID referencing the question ID being answered.</value>
    /// <remarks>
    /// This relationship enables access to:
    /// - The question text and type (multiple choice, essay, etc.)
    /// - Correct answer definitions for automated scoring
    /// - Question configuration and metadata
    /// - Possible answer options for choice-based questions
    /// </remarks>
    public Guid QuestionId { get; set; }
}