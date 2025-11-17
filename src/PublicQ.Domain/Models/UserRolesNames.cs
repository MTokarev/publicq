using PublicQ.Domain.Enums;

namespace PublicQ.Domain.Models;

/// <summary>
/// Available user roles in the system.
/// </summary>
public static class UserRolesNames
{
    /// <summary>
    /// <see cref="UserRole.ExamTaker"/>
    /// </summary>
    public const string ExamTaker = nameof(UserRole.ExamTaker);
    
    /// <summary>
    /// Analyst role, typically for users who can view and analyze data but have limited content management capabilities.
    /// </summary>
    public const string Analyst = nameof(UserRole.Analyst);
    
    /// <summary>
    /// <see cref="UserRole.Contributor"/>
    /// </summary>
    public const string Contributor = nameof(UserRole.Contributor);
    
    /// <summary>
    /// <see cref="UserRole.Manager"/>
    /// </summary>
    public const string Manager = nameof(UserRole.Manager);
    
    /// <summary>
    /// <see cref="UserRole.Moderator"/>
    /// </summary>
    public const string Moderator = nameof(UserRole.Moderator);
    
    /// <summary>
    /// <see cref="UserRole.Administrator"/>
    /// </summary>
    public const string Administrator = nameof(UserRole.Administrator);
    
    /// <summary>
    /// Helper array containing all user roles in the system.
    /// </summary>
    public static readonly string[] All = [Administrator, Analyst, Manager, Moderator, Contributor, ExamTaker];

}