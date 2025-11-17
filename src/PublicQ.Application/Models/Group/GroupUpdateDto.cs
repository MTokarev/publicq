namespace PublicQ.Application.Models.Group;

/// <summary>
/// Data transfer object for updating an existing group.
/// </summary>
public class GroupUpdateDto : GroupBaseDto
{
    /// <summary>
    /// Gets or sets the unique identifier of the group.
    /// </summary>
    public Guid Id { get; set; }
}