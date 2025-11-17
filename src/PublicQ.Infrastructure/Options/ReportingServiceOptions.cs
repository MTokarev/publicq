namespace PublicQ.Infrastructure.Options;

/// <summary>
/// Reporting service options.
/// </summary>
public class ReportingServiceOptions
{
    /// <summary>
    /// Maximum page size for user queries.
    /// </summary>
    public int MaxPageSize { get; set; } = 100;
}