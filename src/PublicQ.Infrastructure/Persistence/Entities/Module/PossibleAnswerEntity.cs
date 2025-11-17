using System.ComponentModel.DataAnnotations;
using PublicQ.Application.Models.Exam;
using PublicQ.Application.Models.Session;

namespace PublicQ.Infrastructure.Persistence.Entities.Module;

/// <summary>
/// Possible answer entity that represents an answer option for a question in the exam system.
/// <seealso cref="QuestionEntity"/>
/// </summary>
public class PossibleAnswerEntity
{
    /// <summary>
    /// Identifier for the possible answer.
    /// </summary>
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    
    /// <summary>
    /// Answer order within the question.
    /// </summary>
    public int Order { get; set; }

    /// <summary>
    /// Answer text that represents the content of the possible answer.
    /// </summary>
    [Required]
    [MaxLength(1000)]
    public string Text { get; set; } = default!;

    /// <summary>
    /// Optional: Link to an image associated with the possible answer.
    /// </summary>
    public ICollection<StaticFileEntity> AssociatedStaticFiles { get; set; } = new List<StaticFileEntity>();

    /// <summary>
    /// Represents whether this possible answer is correct or not.
    /// </summary>
    public bool IsCorrect { get; set; } // only applicable to some question types

    /// <summary>
    /// Foreign key to the question this possible answer belongs to.
    /// <seealso cref="QuestionEntity.Id"/>
    /// </summary>
    [Required]
    public Guid QuestionId { get; set; }
    
    /// <summary>
    /// Navigation property to the question this possible answer belongs to.
    /// </summary>
    public QuestionEntity Question { get; set; } = default!;
    
    /// <summary>
    /// Converts the possible answer entity to a DTO.
    /// </summary>
    /// <returns>Returns <see cref="PossibleAnswerDto"/></returns>
    public PossibleAnswerDto ConvertToDto()
    {
        return new PossibleAnswerDto
        {
            Id = Id,
            Text = Text,
            StaticFileUrls = AssociatedStaticFiles.Select(f => f.FileUrl).ToHashSet(),
            StaticFileIds = AssociatedStaticFiles.Select(f => f.Id).ToHashSet(),
            IsCorrect = IsCorrect
        };
    }
    
    /// <summary>
    /// Converts the possible answer entity to a DTO suitable for exam takers.
    /// </summary>
    /// <returns>Returns <see cref="ExamTakerPossibleAnswersDto"/></returns>
    public ExamTakerPossibleAnswersDto ConvertToExamTakerDto()
    {
        return new ExamTakerPossibleAnswersDto
        {
            Id = Id,
            Text = Text,
            StaticFileUrls = AssociatedStaticFiles.Select(f => f.FileUrl).ToHashSet(),
            StaticFileIds = AssociatedStaticFiles.Select(f => f.Id).ToHashSet()
        };
    }
}