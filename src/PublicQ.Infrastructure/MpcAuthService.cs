using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using PublicQ.Application.Interfaces;
using PublicQ.Application.Models;
using PublicQ.Domain.Enums;
using PublicQ.Shared;

namespace PublicQ.Infrastructure;

/// <inheritdoc cref="IMcpAuthService"/>
public class MpcAuthService(
    IHttpContextAccessor contextAccessor, 
    IApiKeyService apiKeyService, 
    ILogger<MpcAuthService> logger) : IMcpAuthService
{
    /// <inheritdoc cref="IMcpAuthService.IsInContributorPolicy"/>/>
    public Response<bool, GenericOperationStatuses> IsInContributorPolicy()
    {
        if (CheckApiKey())
        {
            return Response<bool, GenericOperationStatuses>.Success(true, GenericOperationStatuses.Completed, 
                "Authorization succeeded using API key");
        }

        var user = contextAccessor.HttpContext?.User;
        if (user?.Identity?.IsAuthenticated == true)
        {
            var userName = UserClaimParser.GetUserDisplayName(user.Claims);
            logger.LogDebug("User {UserName} is authenticated...", userName);
            var userClaims = user.Claims.ToList();

            var isInRole = IsUserInRole(UserRole.Contributor, userClaims) ||
                IsUserInRole(UserRole.Moderator, userClaims) ||
                IsUserInRole(UserRole.Administrator, userClaims);
            if (!isInRole)
            {
                logger.LogDebug("User {UserName} is not in role.", userName);
                return Response<bool, GenericOperationStatuses>.Failure(
                    GenericOperationStatuses.Unauthorized,
                    "User is not authorized to perform this action"); 
            }
        }
        else
        {
            logger.LogDebug("User is not authenticated.");
            return Response<bool, GenericOperationStatuses>.Failure(
                GenericOperationStatuses.Unauthorized,
                "User is not authorized to perform this action");
        }
        
        
        return Response<bool, GenericOperationStatuses>.Success(true, GenericOperationStatuses.Completed, 
            "Authorization succeeded using user roles");
    }

    /// <inheritdoc cref="IMcpAuthService.IsInAnalystPolicy"/>/>
    public Response<bool, GenericOperationStatuses> IsInAnalystPolicy()
    {
        if (CheckApiKey())
        {
            return Response<bool, GenericOperationStatuses>.Success(true, GenericOperationStatuses.Completed, 
                "Authorization succeeded using API key");
        }
        
        var user = contextAccessor.HttpContext?.User;
        if (user?.Identity?.IsAuthenticated == true)
        {
            var userName = UserClaimParser.GetUserDisplayName(user.Claims);
            logger.LogDebug("User {UserName} is authenticated...", userName);
            var userClaims = user.Claims.ToList();

            var isInRole = IsUserInRole(UserRole.Analyst, userClaims) ||
                           IsUserInRole(UserRole.Administrator, userClaims);
            
            if (!isInRole)
            {
                logger.LogDebug("User {UserName} is not in role.", userName);
                return Response<bool, GenericOperationStatuses>.Failure(
                    GenericOperationStatuses.Unauthorized,
                    "User is not authorized to perform this action"); 
            }
        }
        else
        {
            logger.LogDebug("User is not authenticated.");
            return Response<bool, GenericOperationStatuses>.Failure(
                GenericOperationStatuses.Unauthorized,
                "User is not authorized to perform this action");
        }
        
        return Response<bool, GenericOperationStatuses>.Success(true, GenericOperationStatuses.Completed, 
            "Authorization succeeded using user roles");
    }

    /// <summary>
    /// Checks if the user has the specified role.
    /// </summary>
    /// <param name="roleToCheck">Role to check</param>
    /// <param name="userClaims">Array of user roles</param>
    /// <returns>True if user has requested role. Otherwise, false.</returns>
    private static bool IsUserInRole(UserRole roleToCheck, IEnumerable<Claim> userClaims)
    {
        
        var roles = userClaims
            .Where(c => c.Type == ClaimTypes.Role)
            .Select(c => c.Value);

        return roles.Contains(roleToCheck.ToString(), StringComparer.OrdinalIgnoreCase);
    }

    /// <summary>
    /// Check for API key in header and validate it.
    /// </summary>
    /// <returns>True if Key id valid> Otherwise, False.</returns>
    private bool CheckApiKey()
    {
        var apiKey = contextAccessor.HttpContext?.Request.Headers[Constants.ApiHeaderName].FirstOrDefault();
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            return false;
        }
        
        logger.LogDebug("API Key has been provided via header {HeaderName}", Constants.ApiHeaderName);
        
        var apiKeyValidation = apiKeyService.ValidateKey(apiKey);
        if (!apiKeyValidation.Data)
        {
            return false;
        }

        return true;
    }
}