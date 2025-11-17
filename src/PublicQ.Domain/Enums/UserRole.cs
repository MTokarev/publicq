namespace PublicQ.Domain.Enums;

/// <summary>
/// Enumeration of system roles.
/// </summary>
public enum UserRole
{
    /// <summary>
    /// The least privileged role, typically for regular users.
    /// </summary>
    ExamTaker,
    
    /// <summary>
    /// Analyst role, typically for users who can view and analyze data but have limited content management capabilities.
    /// </summary>
    Analyst,
    
    /// <summary>
    /// Contributor role, typically for users who can create and manage content but have limited administrative capabilities.
    /// </summary>
    Contributor,
    
    /// <summary>
    /// Manager role, typically for users who can oversee and manage teams or projects.
    /// </summary>
    Manager,
    
    /// <summary>
    /// Moderator role, typically for users who can moderate and approve content
    /// </summary>
    Moderator,
    
    /// <summary>
    /// Administrator role, typically for users who have full control over the system and can manage all aspects of it.
    /// </summary>
    Administrator
}