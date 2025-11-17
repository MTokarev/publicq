using PublicQ.Domain.Enums;

namespace PublicQ.Infrastructure.Options;

/// <summary>
/// LLM integration options.
/// </summary>
public class LlmIntegrationOptions
{
    /// <summary>
    /// Indicates whether LLM integration is enabled.
    /// </summary>
    public bool Enabled { get; set; }
 
    /// <summary>
    /// Choice of LLM provider.
    /// <see cref="LlmProvider"/>
    /// </summary>
    public LlmProvider Provider { get; set; }
}