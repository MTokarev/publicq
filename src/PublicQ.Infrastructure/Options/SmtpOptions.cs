namespace PublicQ.Infrastructure.Options;

/// <summary>
/// SMTP configuration
/// </summary>
public class SmtpOptions
{
    /// <summary>
    /// SMTP host address.
    /// </summary>
    public string SmtpHost { get; set; } = string.Empty;
    
    /// <summary>
    /// Smtp port number.
    /// </summary>
    public int SmtpPort { get; set; }
    
    /// <summary>
    /// Optional: username for SMTP authentication.
    /// </summary>
    public string? UserName { get; set; }
    
    /// <summary>
    /// Optional: password for SMTP authentication.
    /// </summary>
    public string? Password { get; set; }
    
    /// <summary>
    /// Use STARTTLS if the server supports it.
    /// </summary>
    public bool UseStartTls { get; set; }
    
    /// <summary>
    /// Use SSL to connect to the SMTP server.
    /// </summary>
    public bool UseSsl { get; set; }
}