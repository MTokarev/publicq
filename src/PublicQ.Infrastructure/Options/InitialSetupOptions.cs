namespace PublicQ.Infrastructure.Options;

/// <summary>
/// Configuration model for initial application initialization
/// </summary>
public class InitialSetupOptions
{
    /// <summary>
    /// Application will be configured only if this property is set to true
    /// </summary>
    public bool IsInitialized { get; set; }

    public string Test { get; set; }
}