using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PublicQ.API.Helpers;
using PublicQ.Application.Interfaces;
using PublicQ.Application.Models;
using PublicQ.Application.Models.Exam;
using PublicQ.Shared;

namespace PublicQ.API.Controllers;

/// <summary>
/// Controller for managing assessment questions.
/// </summary>
[ApiController]
[Authorize]
[Route($"{Constants.ControllerRoutePrefix}/[controller]")]
public class AssessmentQuestionsController(IQuestionService questionService): ControllerBase
{
    /// <summary>
    /// Creates a question within a module version.
    /// </summary>
    /// <param name="request">The question creation DTO.</param>
    /// <param name="validator">Validator for the request.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>HTTP response with the created question.</returns>
    [Authorize(Constants.ContributorsPolicy)]
    [HttpPost]
    public async Task<IActionResult> CreateQuestionsAsync(
        [FromBody] QuestionCreateDto request,
        [FromServices] IValidator<QuestionCreateDto> validator,
        CancellationToken cancellationToken)
    {
        var validationResult = await validator.ValidateAsync(request, cancellationToken);
        
        if (!validationResult.IsValid)
        {
            return Response<QuestionCreateDto, GenericOperationStatuses>
                .Failure(GenericOperationStatuses.BadRequest,
                    "Validation failed.",
                    validationResult.Errors.Select(e => e.ErrorMessage).ToList())
                .ToActionResult();
        }

        var response = await questionService.CreateQuestionAsync(request, cancellationToken);

        if (response.IsSuccess)
        {
            response.Data.ToAbsoluteUrls($"{Request.Scheme}://{Request.Host}");
        }
        
        return response.ToActionResult();
    }

    /// <summary>
    /// Deletes a question from an assessment module version.
    /// </summary>
    /// <param name="id">Question to delete</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>HTTP response with the operation status.</returns>
    [Authorize(Constants.ContributorsPolicy)]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteQuestionAsync(Guid id, CancellationToken cancellationToken)
    {
        if (id == Guid.Empty)
        {
            return Response<GenericOperationStatuses>
                .Failure(GenericOperationStatuses.BadRequest, "Question ID cannot be empty.")
                .ToActionResult();
        }
        
        var response = await questionService.DeleteQuestionAsync(id, cancellationToken);
        
        return response.ToActionResult();
    }
    
    /// <summary>
    /// Creates a question within a module version.
    /// </summary>
    /// <param name="request">The question creation DTO.</param>
    /// <param name="validator">Validator for the request.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>HTTP response with the created question.</returns>
    [Authorize(Constants.ContributorsPolicy)]
    [HttpPut]
    public async Task<IActionResult> UpdateQuestionsAsync(
        [FromBody] QuestionUpdateDto request,
        [FromServices] IValidator<QuestionUpdateDto> validator,
        CancellationToken cancellationToken)
    {
        var validationResult = await validator.ValidateAsync(request, cancellationToken);
        
        if (!validationResult.IsValid)
        {
            return Response<QuestionCreateDto, GenericOperationStatuses>
                .Failure(GenericOperationStatuses.BadRequest,
                    "Validation failed.",
                    validationResult.Errors.Select(e => e.ErrorMessage).ToList())
                .ToActionResult();
        }

        var response = await questionService.UpdateQuestionAsync(request, cancellationToken);
        
        // Convert relative URLs to absolute URLs
        if (response.IsSuccess)
        {
            response.Data.ToAbsoluteUrls($"{Request.Scheme}://{Request.Host}");
        }
        
        return response.ToActionResult();
    }
    
    /// <summary>
    /// Gets the total count of questions in the system.
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns total count of questions wrapped into <see cref="Response{TData, TStatus}"/></returns>
    [HttpGet("total")]
    public async Task<IActionResult> GetQuestionCountAsync(CancellationToken cancellationToken)
    {
        var response = await questionService.GetQuestionCountAsync(cancellationToken);
        
        return response.ToActionResult();
    }
}