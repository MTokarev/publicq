using PublicQ.Application.Models.Group;

namespace PublicQ.Application.Models.Session;

/// <summary>
/// Contains necessary information to present the group state.
/// </summary>
public class GroupStateDto : GroupBaseDto
{
    /// <summary>
    /// Gets or sets the unique identifier of the group.
    /// </summary>
    public Guid Id { get; set; }
    
    /// <summary>
    /// Group member entities
    /// </summary>
    public HashSet<GroupMemberStateDto> GroupMembers { get; set; } = [];
}