namespace PublicQ.Application.Models.Assignment;

/// <summary>
/// Assignment data transfer object (DTO) that represents an assignment of a group of modules to a user.
/// </summary>
public class AssignmentDto : AssignmentBaseDto
{
  /// <summary>
  /// Unique identifier for the assignment
  /// </summary>
  public Guid Id { get; set; }

  /// <summary>
  /// Gets or sets the username who updated the group.
  /// </summary>
  public string? UpdatedByUser { get; set; }

  /// <summary>
  /// Indicates whether the assignment is published and visible to students.
  /// </summary>
  public bool IsPublished { get; set; }

  /// <summary>
  /// Gets or sets the UTC timestamp when the group was updated.
  /// </summary>
  public DateTime? UpdatedAtUtc { get; set; }

  /// <summary>
  /// Gets or sets the username who created the group.
  /// </summary>
  public string CreatedByUser { get; set; }

  /// <summary>
  /// Gets or sets the UTC timestamp when the group was created.
  /// </summary>
  public DateTime CreatedAtUtc { get; set; }
  /// <summary>
  /// Gets or sets the foreign key reference to the group containing the assessment modules.
  /// Links this assignment to a specific group of modules that students must complete.
  /// </summary>
  /// <remarks>
  /// The group defines the sequence and configuration of modules students must complete.
  /// Changing this reference effectively changes the entire content of the assignment.
  /// </remarks>
  public Guid GroupId { get; set; }
  
  /// <summary>
  /// Gets or sets the name of the group containing the assessment modules.
  /// </summary>
  public string GroupTitle { get; set; }
}