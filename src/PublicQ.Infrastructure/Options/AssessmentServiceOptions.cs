namespace PublicQ.Infrastructure.Options;

/// <summary>
/// Assessment service options.
/// </summary>
public class AssessmentServiceOptions
{
    /// <summary>
    /// Maximum page size for user queries.
    /// </summary>
    public int MaxPageSize { get; set; } = 100;
}