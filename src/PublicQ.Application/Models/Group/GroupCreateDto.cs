namespace PublicQ.Application.Models.Group;

/// <summary>
/// GroupCreateDto is a data transfer object used for creating new groups.
/// </summary>
public class GroupCreateDto : GroupBaseDto
{
    /// <summary>
    /// Group member entities
    /// </summary>
    public HashSet<GroupMemberCreateDto> GroupMembers { get; set; } = [];
}