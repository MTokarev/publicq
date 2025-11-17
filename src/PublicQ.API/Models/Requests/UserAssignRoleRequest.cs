using PublicQ.Domain.Enums;

namespace PublicQ.API.Models.Requests;

/// <summary>
/// User role assignment request
/// </summary>
public class UserAssignRoleRequest
{
    /// <summary>
    /// User identifier
    /// </summary>
    public string UserId { get; set; }
 
    /// <summary>
    /// User role to assign
    /// <see cref="UserRole"/>
    /// </summary>
    public UserRole Role { get; set; }
}