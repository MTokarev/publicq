namespace PublicQ.Application.Models.Group;

/// <summary>
/// Group member creation data transfer object.
/// </summary>
public class GroupMemberCreateDto
{
    /// <summary>
    /// Gets or sets the order number of the member within the group.
    /// </summary>
    public int OrderNumber { get; set; }

    /// <summary>
    /// Assessment module identifier that this member is associated with.
    /// </summary>
    public Guid AssessmentModuleId { get; set; }
}