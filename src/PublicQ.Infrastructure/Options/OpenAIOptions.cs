namespace PublicQ.Infrastructure.Options;

/// <summary>
/// OpenAI configuration options.
/// </summary>
public class OpenAIOptions
{
    /// <summary>
    /// API key for accessing OpenAI services.
    /// </summary>
    public string ApiKey { get; set; } = default!;
    
    /// <summary>
    /// Model to be used for OpenAI interactions.
    /// <remarks>
    /// This parameter hasn't any constraints here, but you should ensure that the model you specify
    /// is supported by OpenAI and compatible with your usage scenario.
    /// </remarks>
    /// </summary>
    public string Model { get; set; } = "gpt-4";
    
    /// <summary>
    /// Maximum number of tokens for the OpenAI model.
    /// </summary>
    public int MaxTokens { get; set; } = 4096;
    
    /// <summary>
    /// Model response temperature setting.
    /// </summary>
    public double Temperature { get; set; } = 0.7;
}