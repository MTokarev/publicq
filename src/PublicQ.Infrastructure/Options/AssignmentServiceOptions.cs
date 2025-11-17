namespace PublicQ.Infrastructure.Options;

/// <summary>
/// Assignment service options.
/// </summary>
public class AssignmentServiceOptions
{
    /// <summary>
    /// Maximum page size for user queries.
    /// </summary>
    public int MaxPageSize { get; set; } = 100;
}