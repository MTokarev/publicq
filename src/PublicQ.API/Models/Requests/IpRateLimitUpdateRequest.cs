namespace PublicQ.API.Models.Requests;

/// <summary>
/// Update request model for IP rate limiting settings.
/// </summary>
public class IpRateLimitUpdateRequest
{
    /// <summary>
    /// Indicates whether IP rate limiting is enabled.
    /// </summary>
    public bool Enabled { get; set; }
    
    /// <summary>
    /// A list of IP addresses (v4 and v6) that are exempt from rate limiting.
    /// </summary>
    public List<string> IpWhitelist { get; set; } = [];
    
    /// <summary>
    /// Header used to determine the real client IP when behind a proxy.
    /// </summary>
    public string RealIpHeader { get; set; } = "X-Real-IP";
    
    /// <summary>
    /// API calls limit for the specified period.
    /// </summary>
    public int Limit { get; set; }
    
    /// <summary>
    /// Period for the rate limit in seconds.
    /// </summary>
    public int PeriodInSeconds { get; set; } = default!;
}