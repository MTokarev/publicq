namespace PublicQ.Application.Models.Assignment;

/// <summary>
/// Data transfer object for updating an existing assignment.
/// </summary>
public class AssignmentUpdateDto : AssignmentBaseDto
{
    /// <summary>
    /// Gets or sets the unique identifier of the assignment to update.
    /// </summary>
    public Guid Id { get; set; }
}