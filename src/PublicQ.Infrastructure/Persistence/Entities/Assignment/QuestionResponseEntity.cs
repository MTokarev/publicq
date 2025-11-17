using System.ComponentModel.DataAnnotations;
using PublicQ.Application.Models.Session;
using PublicQ.Infrastructure.Persistence.Entities.Module;
using PublicQ.Shared.Enums;

namespace PublicQ.Infrastructure.Persistence.Entities.Assignment;

/// <summary>
/// Represents a student's response to a specific question within a module during an assignment.
/// Captures the student's answer, correctness evaluation, and timing information for individual questions.
/// This entity provides the most granular level of tracking in the assignment system.
/// </summary>
/// <remarks>
/// This entity serves multiple purposes in the assignment system:
/// - Stores the student's actual response data (text answers, selected options)
/// - Records whether the response was correct for objective questions
/// - Tracks when the response was submitted for timing analytics
/// - Enables detailed feedback and review of student performance
/// - Supports different question types (multiple choice, essay, short answer, etc.)
/// 
/// The response data storage is flexible to accommodate various question types:
/// - Text responses for essay and short answer questions
/// - Selected answer IDs for multiple choice and multiple select questions
/// - Correctness evaluation for objective questions
/// - Points/scoring information for grading purposes
/// </remarks>
public class QuestionResponseEntity
{
    /// <summary>
    /// Gets or sets the unique identifier for this question response.
    /// </summary>
    /// <value>A GUID that uniquely identifies this student's response to this specific question.</value>
    [Key]
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
    /// Gets or sets whether this response is correct based on automated evaluation.
    /// Indicates if the student's answer matches the expected correct answer(s).
    /// </summary>
    /// <value>
    /// <c>true</c> if the response is correct;
    /// <c>false</c> if the response is incorrect;
    /// <c>null</c> if the response has not been evaluated yet or requires manual grading.
    /// </value>
    /// <remarks>
    /// For objective questions (multiple choice, true/false, etc.), this is calculated automatically
    /// by comparing the student's response against the defined correct answers.
    /// For subjective questions (essay, short answer), this may remain null until manual grading
    /// or may be set by automated scoring algorithms. Used for immediate feedback and scoring.
    /// </remarks>
    public bool? IsCorrect { get; set; }
    
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
    /// <value>A GUID referencing the <see cref="ModuleProgressEntity.Id"/> containing this response.</value>
    /// <remarks>
    /// This establishes the hierarchical relationship: Assignment → Module Progress → Question Responses.
    /// Used to group all responses for a student's work on a particular module and to
    /// calculate module-level scores and completion status.
    /// </remarks>
    [Required]
    public Guid ModuleProgressId { get; set; }
    
    /// <summary>
    /// Gets or sets the foreign key reference to the specific question being answered.
    /// Links this response to the question definition, content, and correct answers.
    /// </summary>
    /// <value>A GUID referencing the <see cref="QuestionEntity.Id"/> being answered.</value>
    /// <remarks>
    /// This relationship enables access to:
    /// - The question text and type (multiple choice, essay, etc.)
    /// - Correct answer definitions for automated scoring
    /// - Question configuration and metadata
    /// - Possible answer options for choice-based questions
    /// </remarks>
    [Required]
    public Guid QuestionId { get; set; }
    
    // Navigation Properties
    /// <summary>
    /// Gets or sets the module progress entity this response belongs to.
    /// Provides access to the student's overall progress through the module containing this question.
    /// </summary>
    /// <value>The <see cref="ModuleProgressEntity"/> referenced by <see cref="ModuleProgressId"/>.</value>
    /// <remarks>
    /// Through this navigation property, you can access:
    /// - The student's overall progress through the module
    /// - Other question responses within the same module
    /// - Module timing and completion information
    /// - The parent assignment and student context
    /// </remarks>
    public ModuleProgressEntity ModuleProgress { get; set; } = default!;
    
    /// <summary>
    /// Gets or sets the question entity being answered.
    /// Provides access to the question content, type, and correct answer definitions.
    /// </summary>
    /// <value>The <see cref="QuestionEntity"/> referenced by <see cref="QuestionId"/>.</value>
    /// <remarks>
    /// Through this navigation property, you can access:
    /// - The question text and instructions
    /// - Question type (multiple choice, essay, short answer, etc.)
    /// - Correct answer definitions for scoring
    /// - Possible answer options for choice-based questions
    /// - Question metadata and configuration
    /// </remarks>
    public QuestionEntity Question { get; set; } = default!;
    
    /// <summary>
    /// Converts the entity to a Data Transfer Object (DTO).
    /// </summary>
    /// <returns>Returns converted <see cref="QuestionResponseDto"/></returns>
    public QuestionResponseDto ConvertToDto()
    {
        return new QuestionResponseDto
        {
            Id = Id,
            SelectedAnswerIds = SelectedAnswerIds,
            TextResponse = TextResponse,
            QuestionType = QuestionType,
            RespondedAtUtc = RespondedAtUtc,
            ModuleProgressId = ModuleProgressId,
            QuestionId = QuestionId
        };
    }
}