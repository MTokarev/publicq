namespace PublicQ.Domain.Enums;

/// <summary>
/// Represents the email providers supported by the application.
/// </summary>
public enum MessageProvider
{
    /// <summary>
    /// SendGrid email provider.
    /// </summary>
    Sendgrid,
    
    /// <summary>
    /// SMTP email provider.
    /// </summary>
    Smtp
}