using FluentValidation.Results;
using Microsoft.AspNetCore.Mvc;
using PublicQ.Application.Models;

namespace PublicQ.API.Helpers;

/// <summary>
/// Helper class for converting response objects to ActionResult instances.
/// </summary>
public static class ResponseActionResultHelper
{
    /// <summary>
    /// Converts a Response with generic operation statuses to an ActionResult.
    /// </summary>
    /// <param name="response">The response to convert</param>
    /// <param name="createdAtRoute">Optional route name for created responses</param>
    /// <returns>An ActionResult based on the response status</returns>
    public static IActionResult ToActionResult(this Response<GenericOperationStatuses> response, string? createdAtRoute = default)
    {
        if (response.IsSuccess && !string.IsNullOrWhiteSpace(createdAtRoute))
        {
            return new CreatedAtRouteResult(createdAtRoute, response);
        }
        return response.IsSuccess
            ? new OkObjectResult(response)
            : MapFailureToActionResult(response);
    }

    /// <summary>
    /// Converts a Response with typed data and generic operation statuses to an ActionResult.
    /// </summary>
    /// <typeparam name="TData">The type of data in the response</typeparam>
    /// <param name="response">The response to convert</param>
    /// <returns>An ActionResult based on the response status</returns>
    public static IActionResult ToActionResult<TData>(this Response<TData, GenericOperationStatuses> response)
        where TData : class
    {
        if (response.IsSuccess && response.Status != GenericOperationStatuses.NotAllowed)
        {
            return response.Status == GenericOperationStatuses.PartiallyCompleted
                ? new ObjectResult(response) { StatusCode = StatusCodes.Status206PartialContent }
                : new OkObjectResult(response);
        }

        return MapFailureToActionResult(response);
    }

    private static IActionResult MapFailureToActionResult(Response<GenericOperationStatuses> response)
    {
        return response.Status switch
        {
            GenericOperationStatuses.NotFound => new NotFoundObjectResult(response),
            GenericOperationStatuses.NotAllowed => new ObjectResult(response)
            {
                StatusCode = StatusCodes.Status405MethodNotAllowed
            },
            GenericOperationStatuses.Forbidden => new ObjectResult(response)
            {
                StatusCode = StatusCodes.Status403Forbidden
            },
            GenericOperationStatuses.Conflict => new ConflictObjectResult(response),
            GenericOperationStatuses.Unauthorized => new UnauthorizedObjectResult(response),
            GenericOperationStatuses.BadRequest => new BadRequestObjectResult(response),
            GenericOperationStatuses.Cancelled => new StatusCodeResult(StatusCodes.Status499ClientClosedRequest),
            _ => new BadRequestObjectResult(response),
        };
    }
}