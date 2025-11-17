namespace PublicQ.Application;

/// <summary>
/// Cacheable attribute to mark methods whose results should be cached.
/// </summary>
public class CacheableAttribute : Attribute
{
    /// <summary>
    /// Custom cache key. If not provided, a key will be generated based on method name and parameters.
    /// </summary>
    public string? CustomKey { get; set; }
    
    /// <summary>
    /// Tags associated with the cache entry.
    /// </summary>
    public string? Tags { get; set; } // For cache invalidation by tag
    
    /// <summary>
    /// Bypass cache and always execute the method.
    /// </summary>
    public bool BypassCache { get; set; } = false;
    
    /// <summary>
    /// Default constructor.
    /// </summary>
    public CacheableAttribute() { }
    
    /// <summary>
    /// Constructor with custom cache key.
    /// </summary>
    /// <param name="customKey"></param>
    public CacheableAttribute(string customKey)
    {
        CustomKey = customKey;
    }
}