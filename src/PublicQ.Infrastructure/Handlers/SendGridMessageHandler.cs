using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using PublicQ.Application.Interfaces;
using PublicQ.Application.Models;
using PublicQ.Domain.Enums;
using PublicQ.Infrastructure.Options;
using PublicQ.Shared;
using SendGrid;
using SendGrid.Helpers.Mail;

namespace PublicQ.Infrastructure.Handlers;

/// <summary>
/// SendGrid message handler.
/// </summary>
public class SendGridMessageHandler(
    IOptionsMonitor<SendgridOptions> options, 
    ILogger<SendGridMessageHandler> logger)
    : IMessageHandler
{
    public MessageProvider Provider => MessageProvider.Sendgrid;

    public async Task<Response<GenericOperationStatuses>> SendAsync(
        Message message,
        CancellationToken cancellationToken)
    {
        logger.LogDebug("Message received by '{Provider}'.", Provider);

        Guard.AgainstNull(message, nameof(message));
        Guard.AgainstNullOrWhiteSpace(message.Sender, nameof(message.Sender));
        Guard.AgainstNullOrWhiteSpace(message.Recipients, nameof(message.Recipients));
        Guard.AgainstNullOrWhiteSpace(message.Body, nameof(message.Body));

        var msg = CompileEmailMessage(message);
        var recipientsString = string.Join(", ", message.Recipients);

        logger.LogInformation("Sending message from '{Sender}' to '{Recipients}' using '{Provider}'.",
            message.Sender,
            recipientsString,
            Provider);

        Response response;
        var client = new SendGridClient(options.CurrentValue.ApiKey);
        try
        {
            response = await client.SendEmailAsync(msg, cancellationToken);
        }
        // It is a critical part, hence catching all exceptions to properly log them
        catch (Exception ex)
        {
            logger.LogError(ex,
                "Failed to send message from '{Sender}' to '{Recipients}' using '{Provider}': '{Message}'",
                message.Sender,
                recipientsString,
                Provider,
                ex.Message);
            return Response<GenericOperationStatuses>.Failure(
                GenericOperationStatuses.Failed,
                $"Failed to send message to '{recipientsString}' recipients. Exception message: '{ex.Message}'.");
        }

        logger.LogDebug(
            "Handler processing completed with status code '{StatusCode}' for '{Sender}' to '{Recipients}' with the '{Subject}' subject.",
            response.StatusCode,
            message.Sender,
            recipientsString,
            message.Subject);

        if (response.IsSuccessStatusCode)
        {
            return Response<GenericOperationStatuses>.Success(GenericOperationStatuses.Completed,
                $"Message sent to '{recipientsString}'.");
        }

        return Response<GenericOperationStatuses>.Failure(GenericOperationStatuses.Failed,
            $"Unable to send message to '{recipientsString}'. Status code: '{response.StatusCode}'. " +
            $"Response body: '{await response.Body.ReadAsStringAsync(cancellationToken)}'.");
    }

    private SendGridMessage CompileEmailMessage(Message message)
    {
        logger.LogDebug("Converting message to SendGrid format for '{Provider}'.", Provider);
        var sender = new EmailAddress(message.Sender);
        var recipients = message
            .Recipients
            .Select(r => new EmailAddress(r))
            .ToList();
        string subject;

        if (string.IsNullOrWhiteSpace(message.Subject))
        {
            logger.LogDebug("Message subject is empty, using '{DefaultSubject}' default subject for '{Provider}'.",
                string.Empty,
                Provider);
            subject = string.Empty;
        }
        else
        {
            subject = message.Subject;
        }

        logger.LogDebug("Assembling SendGrid message for '{Provider}'.", Provider);

        var msg = new SendGridMessage();
        msg.SetFrom(sender);
        msg.AddReplyTo(sender);
        msg.AddTos(recipients);
        msg.AddContent(MimeType.Html, message.Body);
        msg.SetSubject(subject);

        logger.LogDebug("SendGrid message assembled for '{Provider}'.", Provider);
        return msg;
    }
}