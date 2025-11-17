using PublicQ.Application.Models;
using PublicQ.Application.Models.Exam;
using PublicQ.Application.Models.Session;

namespace PublicQ.Application.Interfaces;

/// <summary>
/// Represents a service for managing module's questions.
/// </summary>
public interface IQuestionService
{
    /// <summary>
    /// Creates a new question within a specific module version.
    /// </summary>
    /// <param name="createDto">Question DTO model <seealso cref="QuestionCreateDto"/></param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Created question DTO.</returns>
    Task<Response<QuestionDto, GenericOperationStatuses>> CreateQuestionAsync(
        QuestionCreateDto createDto,
        CancellationToken cancellationToken);
    
    /// <summary>
    /// Deletes a question by its ID.
    /// </summary>
    /// <param name="questionId">Question ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Deleted question DTO.</returns>
    Task<Response<QuestionDto, GenericOperationStatuses>> DeleteQuestionAsync(
        Guid questionId,
        CancellationToken cancellationToken);
    
    /// <summary>
    /// Update questin by its ID.
    /// </summary>
    /// <param name="updateDto">Updated question <seealso cref="QuestionCreateDto"/></param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Updated <see cref="QuestionDto"/> wrapped into <see cref="Response{TData, TStatus}"/>.</returns>
    Task<Response<QuestionDto, GenericOperationStatuses>> UpdateQuestionAsync(
        QuestionUpdateDto updateDto,
        CancellationToken cancellationToken);
    
    /// <summary>
    /// Checks if the provided answer to a question is correct.
    /// </summary>
    /// <param name="responseOperationDto"></param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>True if the answer is correct, otherwise false</returns>
    Task<Response<bool, GenericOperationStatuses>> CheckQuestionAnswerAsync(
        QuestionResponseOperationDto responseOperationDto,
        CancellationToken cancellationToken);
    
    /// <summary>
    /// Get the total count of questions in the system using the latest published versions.
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Number of questions wrapped into <see cref="Response{TData, TStatus}"/></returns>
    Task<Response<long, GenericOperationStatuses>> GetQuestionCountAsync(CancellationToken cancellationToken);
}