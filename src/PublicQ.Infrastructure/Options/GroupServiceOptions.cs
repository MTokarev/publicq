using PublicQ.Infrastructure.Services;

namespace PublicQ.Infrastructure.Options;

/// <summary>
/// Group service options.
/// <seealso cref="GroupService"/>
/// </summary>
public class GroupServiceOptions
{
    /// <summary>
    /// Maximum page size for user queries.
    /// </summary>
    public int MaxPageSize { get; set; } = 100;
}