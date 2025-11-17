namespace PublicQ.Infrastructure.Options;

/// <summary>
/// User service options.
/// </summary>
public class UserServiceOptions
{
    /// <summary>
    /// Self-service registration enabled flag.
    /// </summary>
    public bool SelfServiceRegistrationEnabled { get; set; }
    
    /// <summary>
    /// Maximum page size for user queries.
    /// </summary>
    public int MaxPageSize { get; set; } = 100;
    
    /// <summary>
    /// Maximum import size for bulk user imports.
    /// </summary>
    public int MaxImportSize { get; set; } = 500;
}