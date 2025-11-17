namespace PublicQ.Infrastructure.Options;

/// <summary>
/// Model for IP rate limiting options.
/// It has to be in sync with AspNetCoreRateLimit nuget package.
/// </summary>
public class IpRateLimitOptions
{
    /// <summary>
    /// Array of <see cref="GeneralRules"/>
    /// </summary>
    public List<GeneralRule> GeneralRules { get; set; } = [];
    
    /// <summary>
    /// Array of IP addresses (v4 and v6) that are exempt from rate limiting.
    /// </summary>
    public List<string> IpWhitelist { get; set; } = [];
    
    /// <summary>
    /// Real IP header to use when behind a proxy.
    /// </summary>
    public string RealIpHeader { get; set; } = "X-Real-IP";
}

/// <summary>
/// General rule for rate limiting.
/// </summary>
public class GeneralRule
{
    /// <summary>
    /// Endpoint to which the rule applies. Use "*" to apply to all endpoints.
    /// </summary>
    public string Endpoint { get; set; } = default!;
    
    /// <summary>
    /// API calls limit for the specified period.
    /// </summary>
    public int Limit { get; set; }
    
    /// <summary>
    /// Period for the rate limit (e.g., "5s" for 5 seconds, "1m" for 1 minute).
    /// </summary>
    public string Period { get; set; } = default!;
}

