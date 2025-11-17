namespace PublicQ.Application.Models.Group;

/// <summary>
/// Data transfer object for swapping the order of two group members.
/// </summary>
public class GroupMemberOrderSwapDto
{
    /// <summary>
    /// Gets or sets the identifier of the group containing the members.
    /// </summary>
    public Guid GroupId { get; set; }
    
    /// <summary>
    /// Gets or sets the identifier of the first member to swap.
    /// </summary>
    public Guid FirstMemberId { get; set; }
    
    /// <summary>
    /// Gets or sets the identifier of the second member to swap.
    /// </summary>
    public Guid SecondMemberId { get; set; }
}