namespace PublicQ.Application.Models.Ai;

/// <summary>
/// Character roles in AI interactions.
/// </summary>
public enum ChatRole
{
    /// <summary>
    /// User role.
    /// </summary>
    User,
    
    /// <summary>
    /// Assistant role.
    /// </summary>
    Assistant,
    
    /// <summary>
    /// Tool role.
    /// </summary>
    Tool,
    
    /// <summary>
    /// System role.
    /// </summary>
    System 
}