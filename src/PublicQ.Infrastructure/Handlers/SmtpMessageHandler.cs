using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit;
using PublicQ.Application.Interfaces;
using PublicQ.Application.Models;
using PublicQ.Domain.Enums;
using PublicQ.Infrastructure.Options;
using PublicQ.Shared;

namespace PublicQ.Infrastructure.Handlers;

/// <summary>
/// Smtp message handler.
/// <seealso cref="IMessageHandler"/>
/// </summary>
/// <param name="options"><see cref="SmtpOptions"/></param>
/// <param name="logger">Logger</param>
public class SmtpMessageHandler(
    IOptionsMonitor<SmtpOptions> options,
    ILogger<SmtpMessageHandler> logger) : IMessageHandler
{
    public MessageProvider Provider => MessageProvider.Smtp;
    
    /// <inheritdoc cref="IMessageHandler.SendAsync"/> 
    public async Task<Response<GenericOperationStatuses>> SendAsync(
        Message message, 
        CancellationToken cancellationToken)
    {
        logger.LogDebug("Message received by '{Provider}'.", Provider);
        
        Guard.AgainstNull(message, nameof(message));
        Guard.AgainstNullOrWhiteSpace(message.Sender, nameof(message.Sender));
        Guard.AgainstNullOrWhiteSpace(message.Recipients, nameof(message.Recipients));
        Guard.AgainstNullOrWhiteSpace(message.Body, nameof(message.Body));
        
        var mimeMessage = BuildMimeMessage(message);

        var currentOptions = options.CurrentValue;
        var recipientsString = string.Join(", ", message.Recipients);
        
        using var client = new SmtpClient();
        try
        {
            // Connect
            if (currentOptions.UseSsl)
            {
                logger.LogInformation("Connecting to {SmtpHost}:{Port} Using SSL.",
                    currentOptions.SmtpHost,
                    currentOptions.SmtpPort);
                await client.ConnectAsync(
                    currentOptions.SmtpHost,
                    currentOptions.SmtpPort,
                    SecureSocketOptions.SslOnConnect, cancellationToken);
            }
            else if (currentOptions.UseStartTls)
            {
                logger.LogInformation("Connecting to {SmtpHost}:{Port} Using STARTTLS if available.",
                    currentOptions.SmtpHost,
                    currentOptions.SmtpPort);
                await client.ConnectAsync(
                    currentOptions.SmtpHost,
                    currentOptions.SmtpPort,
                    SecureSocketOptions.StartTls,
                    cancellationToken);
            }
            else
            {
                logger.LogInformation("Connecting to {SmtpHost}:{Port} with no encryption.",
                    currentOptions.SmtpHost,
                    currentOptions.SmtpPort);
                await client.ConnectAsync(
                    currentOptions.SmtpHost,
                    currentOptions.SmtpPort,
                    SecureSocketOptions.None,
                    cancellationToken);
            }

            // Authenticate if credentials provided
            if (!string.IsNullOrEmpty(currentOptions.UserName))
            {
                logger.LogInformation("Authenticating as '{UserName}'.",
                    currentOptions.UserName);
                await client.AuthenticateAsync(
                    currentOptions.UserName,
                    currentOptions.Password ?? string.Empty,
                    cancellationToken);
            }

            logger.LogInformation("Sending message from '{Sender}' to '{@Recipients}' using '{Provider}'.",
                message.Sender,
                message.Recipients,
                Provider);

            // Send
            await client.SendAsync(mimeMessage, cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogError(ex,
                "Failed to send message from '{Sender}' to '{@Recipients}' using '{Provider}': '{Message}'",
                message.Sender,
                message.Recipients,
                Provider,
                ex.Message);
            return Response<GenericOperationStatuses>.Failure(
                GenericOperationStatuses.Failed,
                $"Failed to send message to '{recipientsString}' recipients. Exception message: '{ex.Message}'.");
        }
        finally
        {
            // Disconnect cleanly
            if (client.IsConnected)
            {
                await client.DisconnectAsync(quit: true, cancellationToken);
            }
        }
        
        return Response<GenericOperationStatuses>.Success(GenericOperationStatuses.Completed,
            $"Message sent to '{recipientsString}'.");
    }

    /// <summary>
    /// Builds a MimeMessage from the provided Message object.
    /// </summary>
    /// <param name="message"><see cref="Message"/></param>
    /// <returns>Returns <see cref="MimeMessage"/></returns>
    MimeMessage BuildMimeMessage(Message message)
    {
        var mimeMessage = new MimeMessage();
        mimeMessage.From.Add(MailboxAddress.Parse(message.Sender));
        
        foreach (var recipient in message.Recipients)
        {
            mimeMessage.To.Add(MailboxAddress.Parse(recipient));
        }
        
        mimeMessage.Subject = string.IsNullOrWhiteSpace(message.Subject) 
            ? string.Empty 
            : message.Subject;
        logger.LogDebug("Message subject set to '{Subject}'", mimeMessage.Subject);
        
        var bodyBuilder = new BodyBuilder
        {
            HtmlBody = message.Body
        };
        mimeMessage.Body = bodyBuilder.ToMessageBody();
        
        return mimeMessage;
    }
}