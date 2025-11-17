using PublicQ.Application.Models;

namespace PublicQ.Application.Interfaces;

/// <summary>
/// Represents token service interface.
/// </summary>
// TODO: 1. Implement refresh tokens
// TODO: 2. Revoke refresh tokens
public interface ITokenService
{
    /// <summary>
    /// Issues a token for the given user identifier and unique name.
    /// </summary>
    /// <param name="identifier">User Identifier</param>
    /// <param name="uniqueName">Unique user name</param>
    /// <param name="fullName">User full name</param>
    /// <param name="roles">User roles</param>
    /// <returns>Returns a response with the operation result <seealso cref="Response{TData,TStatus}"/></returns>
    Response<string, GenericOperationStatuses> IssueToken(
        string identifier, 
        string uniqueName, 
        string fullName, 
        IList<string>? roles = null);
}