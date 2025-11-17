namespace PublicQ.Application.Models.Group;

/// <summary>
/// Group member details
/// </summary>
public class GroupMemberDto
{
    /// <summary>
    /// Gets or sets the unique identifier of the group member.
    /// </summary>
    public Guid Id { get; set; }
    
    /// <summary>
    /// Gets or sets the identifier of the group this member belongs to.
    /// </summary>
    public Guid GroupId { get; set; }
    
    /// <summary>
    /// Gets or sets the order number of the member within the group.
    /// </summary>
    public int OrderNumber { get; set; }
    
    /// <summary>
    /// A title for the assessment module
    /// </summary>
    public string AssessmentModuleTitle { get; set; }

    /// <summary>
    /// Assessment module description
    /// </summary>
    public string AssessmentModuleDescription { get; set; }

    /// <summary>
    /// Optional list of static file URLs to associate with this version (e.g., module-level images or documents).
    /// </summary>
    public HashSet<string>? StaticFileUrls { get; set; } = [];
    
    /// <summary>
    /// Assessment module identifier that this member is associated with.
    /// </summary>
    public Guid AssessmentModuleId { get; set; }
}