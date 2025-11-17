using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PublicQ.API.Helpers;
using PublicQ.API.Models.Validators;
using PublicQ.Application.Interfaces;
using PublicQ.Application.Models;
using PublicQ.Application.Models.Banner;
using PublicQ.Shared;

namespace PublicQ.API.Controllers;

/// <summary>
/// Controller for managing banners.
/// </summary>
[ApiController]
[Route($"{Constants.ControllerRoutePrefix}/[controller]")]
public class BannersController(IBannerService bannerService) : ControllerBase
{
    /// <summary>
    /// Gets all banners.
    /// </summary>
    /// <param name="cancellationToken">Cancellation Token</param>
    /// <returns>Returns <see cref="Response{TData, TStatus}"/></returns>
    [HttpGet]
    [Authorize(Constants.ManagersPolicy)]
    public async Task<IActionResult> GetAllAsync(CancellationToken cancellationToken)
    {
        var response = await bannerService.GetAllAsync(cancellationToken);
        return response.ToActionResult();
    }
    
    /// <summary>
    /// Gets active banners.
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns <see cref="Response{TData, TStatus}"/></returns>
    [HttpGet("active")]
    public async Task<IActionResult> GetActiveAsync(CancellationToken cancellationToken)
    {
        var isUserAuthenticated = User?.Identity?.IsAuthenticated ?? false;
        
        var response = await bannerService.GetActiveAsync(
            showOnlyForAuthenticatedUsers: isUserAuthenticated, 
            cancellationToken);
        return response.ToActionResult();
    }
    
    /// <summary>
    /// Creates a new banner.
    /// </summary>
    /// <param name="bannerCreateRequest"><see cref="BannerDto"/></param>
    /// <param name="validator"><see cref="BannerDtoValidator"/></param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns <see cref="Response{TData, TStatus}"/></returns>
    [HttpPost]
    [Authorize(Constants.ManagersPolicy)]
    public async Task<IActionResult> CreateAsync(
        [FromBody] BannerDto bannerCreateRequest,
        [FromServices] IValidator<BannerDto> validator,
        CancellationToken cancellationToken)
    {
        
        var validationResult = await validator.ValidateAsync(bannerCreateRequest, cancellationToken);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors
                .Select(e => e.ErrorMessage)
                .ToList();
            return Response<BannerDto, GenericOperationStatuses>.Failure(
                GenericOperationStatuses.BadRequest,
                "Validation failed.",
                errors).ToActionResult();
        }
        
        var createdByUser = UserClaimParser.GetUserDisplayName(User.Claims);
        var response = await bannerService.CreateAsync(
            createdByUser,
            bannerCreateRequest,
            cancellationToken);
        
        return response.ToActionResult();
    }

    /// <summary>
    /// Returns a list of all banners.
    /// </summary>
    /// <param name="id">Banner ID</param>
    /// <param name="bannerUpdateRequest"><see cref="BannerDto"/></param>
    /// <param name="validator"><see cref="BannerDtoValidator"/></param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns <see cref="Response{TStatus}"/></returns>
    [HttpPatch("{id:guid}")]
    [Authorize(Constants.ManagersPolicy)]
    public async Task<IActionResult> UpdateAsync(
        Guid id,
        [FromBody] BannerDto bannerUpdateRequest,
        [FromServices] IValidator<BannerDto> validator,
        CancellationToken cancellationToken)
    {
        var validationResult = await validator.ValidateAsync(bannerUpdateRequest, cancellationToken);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors
                .Select(e => e.ErrorMessage)
                .ToList();
            return Response<BannerDto, GenericOperationStatuses>.Failure(
                GenericOperationStatuses.BadRequest,
                "Validation failed.",
                errors).ToActionResult();
        }
        
        var updatedByUser = UserClaimParser.GetUserDisplayName(User.Claims);
        var response = await bannerService.UpdateAsync(
            id,
            updatedByUser,
            bannerUpdateRequest,
            cancellationToken);
        
        return response.ToActionResult();
    }

    /// <summary>
    /// Deletes a banner by ID.
    /// </summary>
    /// <param name="id">Banner to delete ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns <see cref="Response{TStatus}"/></returns>
    [HttpDelete("{id:guid}")]
    [Authorize(Constants.ManagersPolicy)]
    public async Task<IActionResult> DeleteAsync(
        Guid id,
        CancellationToken cancellationToken)
    {
        var response = await bannerService.DeleteAsync(id, cancellationToken);
        return response.ToActionResult();
    }
}