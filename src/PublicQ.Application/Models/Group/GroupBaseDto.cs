namespace PublicQ.Application.Models.Group;

/// <summary>
/// GroupBaseDto serves as a base class for group-related data transfer objects.
/// </summary>
public class GroupBaseDto
{
    /// <summary>
    /// Gets or sets the title of the group.
    /// </summary>
    public string Title { get; set; } = string.Empty;
    
    /// <summary>
    /// Gets or sets the description of the group.
    /// </summary>
    public string Description { get; set; } = string.Empty;
    
    /// <summary>
    /// Gets or sets a value indicating whether module completion is required 
    /// before progressing in the group context.
    /// </summary>
    public bool WaitModuleCompletion { get; set; }
    
    /// <summary>
    /// Indicates whether the order of group members is locked.
    /// If it is locked, exam takers cannot launch modules out of order.
    /// </summary>
    public bool IsMemberOrderLocked { get; set; }
}