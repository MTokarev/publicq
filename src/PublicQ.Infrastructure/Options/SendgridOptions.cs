namespace PublicQ.Infrastructure.Options;

/// <summary>
/// Sendgrid configuration model.
/// </summary>
public class SendgridOptions
{
    /// <summary>
    /// API key for Sendgrid service.
    /// </summary>
    public string ApiKey { get; set; } = string.Empty;
}