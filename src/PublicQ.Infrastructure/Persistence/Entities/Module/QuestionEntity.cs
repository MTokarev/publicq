using System.ComponentModel.DataAnnotations;
using PublicQ.Application.Models.Exam;
using PublicQ.Application.Models.Session;
using PublicQ.Shared.Enums;

namespace PublicQ.Infrastructure.Persistence.Entities.Module;

/// <summary>
/// Represents a question in the exam system.
/// </summary>
public class QuestionEntity
{
    /// <summary>
    /// Identifier for the question.
    /// </summary>
    [Key]
    public Guid Id { get; set; }

    /// <summary>
    /// Optional: Text of the question. Can be attachment with static files for rich instead.
    /// </summary>
    [Required]
    [MaxLength(5000)]
    public string? Text { get; set; } = default!;
    
    /// <summary>
    /// Question order within the module.
    /// </summary>
    public int Order { get; set; }

    /// <summary>
    /// Optional: Link to a static file associated with the question.
    /// </summary>
    public ICollection<StaticFileEntity> AssociatedStaticFiles { get; set; } = new List<StaticFileEntity>();
    
    /// <summary>
    /// Question type, indicating how the question should be answered (e.g., single choice, multiple choice, free text).
    /// <seealso cref="QuestionType"/>
    /// </summary>
    [Required]
    public QuestionType Type { get; set; } // stored as enum

    /// <summary>
    /// A collection of possible answers for the question.
    /// </summary>
    public ICollection<PossibleAnswerEntity> PossibleAnswers { get; set; } = new List<PossibleAnswerEntity>();

    /// <summary>
    /// Foreign key to the test module this question belongs to.
    /// <seealso cref="AssessmentModuleVersion"/>
    /// </summary>
    [Required]
    public Guid AssessmentModuleVersionId { get; set; }
    
    /// <summary>
    /// Navigation property to the test module version this question belongs to.
    /// </summary>
    public AssessmentModuleVersionEntity AssessmentModuleVersion { get; set; } = default!;
    
    /// <summary>
    /// Converts the question entity to a DTO.
    /// </summary>
    /// <returns>Returns <see cref="QuestionDto"/></returns>
    public QuestionDto ConvertToDto()
    {
        return new QuestionDto
        {
            Id = Id,
            Text = Text,
            StaticFileUrls = AssociatedStaticFiles.Select(f => f.FileUrl).ToHashSet(),
            StaticFileIds = AssociatedStaticFiles.Select(f => f.Id).ToHashSet(),
            Type = Type,
            Answers = PossibleAnswers.Select(a => a.ConvertToDto()).ToList()
        };
    }
    
    /// <summary>
    /// Exam taker version of the question DTO.
    /// </summary>
    /// <returns>Returns <see cref="ExamTakerQuestionDto"/></returns>
    public ExamTakerQuestionDto ConvertToExamTakerDto()
    {
        return new ExamTakerQuestionDto
        {
            Id = Id,
            Text = Text,
            StaticFileUrls = AssociatedStaticFiles.Select(f => f.FileUrl).ToHashSet(),
            StaticFileIds = AssociatedStaticFiles.Select(f => f.Id).ToHashSet(),
            Type = Type,
            Answers = PossibleAnswers.Select(a => a.ConvertToExamTakerDto()).ToList()
        };
    }
}