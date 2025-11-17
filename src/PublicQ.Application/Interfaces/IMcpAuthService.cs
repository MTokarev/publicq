using System.Security.Claims;
using PublicQ.Application.Models;

namespace PublicQ.Application.Interfaces;

/// <summary>
/// MCP authentication service interface
/// </summary>
public interface IMcpAuthService
{
    /// <summary>
    /// Checks if the user is in the contributor policy.
    /// </summary>
    /// <returns>Returns <see cref="Response{TData, TStatus}"/></returns>
    Response<bool, GenericOperationStatuses> IsInContributorPolicy();
    
    /// <summary>
    /// Checks if the user is in the analyst policy.
    /// </summary>
    /// <returns>Returns <see cref="Response{TData, TStatus}"/></returns>
    Response<bool, GenericOperationStatuses> IsInAnalystPolicy();
}