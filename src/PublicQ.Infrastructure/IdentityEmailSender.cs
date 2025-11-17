using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using PublicQ.Application.Interfaces;
using PublicQ.Application.Models;
using PublicQ.Shared;

namespace PublicQ.Infrastructure;

/// <summary>
/// This class is responsible for sending emails related to user identity operations.
/// </summary>
public class IdentityEmailSender(IMessageService messageService, ILogger<IdentityEmailSender> logger) : IEmailSender<ApplicationUser>
{
    /// <summary>
    /// Sends a confirmation link to the user's email address.
    /// </summary>  
    /// <param name="user">User to send</param>
    /// <param name="email">Email address</param>
    /// <param name="confirmationLink">Confirmation link</param>
    public async Task SendConfirmationLinkAsync(ApplicationUser user, string email, string confirmationLink)
    {
        var messageRequest = new SendMessageRequest
        {
            Recipients = new List<string>{ email },
            Subject = "Please confirm your email",
            Body = $"Please confirm your email by clicking on the following link: '{confirmationLink}'"
        };

        var response = await messageService.SendAsync(messageRequest, CancellationToken.None);

        if (!response.IsSuccess)
        {
            logger.LogError("Error sending confirmation link to '{Email}': '{response.Message}'", 
                email, 
                response.Message);
        }
        else
        {
            logger.LogDebug("Confirmation link sent to '{Email}' successfully.", email);
        }
    }

    /// <summary>
    /// Sends a reset link to the user's email address.
    /// </summary>
    /// <param name="user">User to send</param>
    /// <param name="email">Email address</param>
    /// <param name="resetLink">Reset link</param>
    public async Task SendPasswordResetLinkAsync(ApplicationUser user, string email, string resetLink)
    {
        Guard.AgainstNull(user, nameof(user));
        Guard.AgainstNullOrWhiteSpace(email, nameof(email));
        Guard.AgainstNullOrWhiteSpace(resetLink, nameof(resetLink));
        
        var messageRequest = new SendMessageRequest
        {
            TemplateId = Constants.DefaultForgetPasswordMessageTemplateId,
            Recipients = new List<string>{ email },
            Subject = "Password Reset Request",
            Placeholders = new Dictionary<string, string>
            {
                { "User", string.IsNullOrWhiteSpace(user.FullName) ? 
                    email.Split("@")[0] : 
                    user.FullName },
                { "ResetLink", resetLink }
            }
        };

        var response = await messageService.SendAsync(messageRequest, CancellationToken.None);

        if (!response.IsSuccess)
        {
            logger.LogError("Error sending password reset link to '{Email}': '{response.Message}'", 
                email, 
                response.Message);
        }
        else
        {
            logger.LogInformation("Password reset link sent to '{Email}' successfully.", email);
        }
    }

    /// <summary>
    /// Sends a password reset code to the user's email address.
    /// </summary>
    /// <param name="user">User to send</param>
    /// <param name="email">Email address</param>
    /// <param name="resetCode">Reset code</param>
    public async Task SendPasswordResetCodeAsync(ApplicationUser user, string email, string resetCode)
    {
        var messageRequest = new SendMessageRequest
        {
            Recipients = new List<string>{ email },
            Subject = "Password Reset Code",
            Body = $"Your password reset code is: '{resetCode}'"
        };

        var response = await messageService.SendAsync(messageRequest, CancellationToken.None);

        if (!response.IsSuccess)
        {
            logger.LogError("Error sending password reset code to '{Email}': '{response.Message}'", 
                email, 
                response.Message);
        }
        else
        {
            logger.LogDebug("Password reset code sent to '{Email}' successfully.", email);
        }
    }
}