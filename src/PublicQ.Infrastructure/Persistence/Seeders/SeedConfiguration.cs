using Microsoft.EntityFrameworkCore;
using PublicQ.Application.Interfaces;
using PublicQ.Domain.Enums;
using PublicQ.Infrastructure.Entities;
using PublicQ.Infrastructure.Options;
using PublicQ.Infrastructure.Persistence.Entities;
using PublicQ.Shared;

namespace PublicQ.Infrastructure.Persistence.Seeders;

/// <summary>
/// Seed configuration data for the application.
/// </summary>
public static class SeedConfiguration
{
    /// <summary>
    /// Seeds initial configuration data into the model builder.
    /// </summary>
    public static void Seed(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<SystemSettings>().HasData(
            new SystemSettings($"{nameof(DbLoggerOptions)}:{nameof(DbLoggerOptions.Enabled)}", "true"),
            new SystemSettings($"{nameof(DbLoggerOptions)}:{nameof(DbLoggerOptions.LogLevel)}", "Error"),
            new SystemSettings($"{nameof(DbLoggerOptions)}:{nameof(DbLoggerOptions.MaxPageSize)}", "100"),
            new SystemSettings($"{nameof(DbLoggerOptions)}:{nameof(DbLoggerOptions.RetentionPeriodInDays)}", "90"),
            new SystemSettings($"{nameof(DbLoggerOptions)}:{nameof(DbLoggerOptions.ExcludedCategories)}:0", "PublicQ.Infrastructure.DynamicJwtBearerHandler"),
            new SystemSettings($"{nameof(DbLoggerOptions)}:{nameof(DbLoggerOptions.ExcludedCategories)}:1", "Microsoft"),
            new SystemSettings($"{nameof(DbLoggerOptions)}:{nameof(DbLoggerOptions.ExcludedCategories)}:2", "System"));
        
        modelBuilder.Entity<SystemSettings>().HasData(
            new SystemSettings($"{nameof(IpRateLimitOptions)}:{nameof(IpRateLimitOptions.IpWhitelist)}:0", "127.0.0.1"),
            new SystemSettings($"{nameof(IpRateLimitOptions)}:{nameof(IpRateLimitOptions.IpWhitelist)}:1", "::1"),
            new SystemSettings($"{nameof(IpRateLimitOptions)}:{nameof(IpRateLimitOptions.RealIpHeader)}", "X-Forwarded-For"),
            new SystemSettings($"{nameof(IpRateLimitOptions)}:{nameof(IpRateLimitOptions.GeneralRules)}:0:{nameof(GeneralRule.Endpoint)}", "*"),
            new SystemSettings($"{nameof(IpRateLimitOptions)}:{nameof(IpRateLimitOptions.GeneralRules)}:0:{nameof(GeneralRule.Period)}", "10s"),
            new SystemSettings($"{nameof(IpRateLimitOptions)}:{nameof(IpRateLimitOptions.GeneralRules)}:0:{nameof(GeneralRule.Limit)}", "100"));
        
        modelBuilder.Entity<SystemSettings>().HasData(
            new SystemSettings($"{nameof(InitialSetupOptions)}:{nameof(InitialSetupOptions.IsInitialized)}", "false"));
        
        modelBuilder.Entity<SystemSettings>().HasData(
            new SystemSettings($"{nameof(LlmIntegrationOptions)}:{nameof(LlmIntegrationOptions.Enabled)}", "false"),
            new SystemSettings($"{nameof(LlmIntegrationOptions)}:{nameof(LlmIntegrationOptions.Provider)}", nameof(LlmProvider.OpenAI)));
       
        modelBuilder.Entity<SystemSettings>().HasData(
            new SystemSettings($"{nameof(FileStorageOptions)}:{nameof(FileStorageOptions.StaticContentPath)}", "static"),
            new SystemSettings($"{nameof(FileStorageOptions)}:{nameof(FileStorageOptions.MaxUploadFileSizeInKilobytes)}", "5120"));
        
        modelBuilder.Entity<SystemSettings>().HasData(
            new SystemSettings($"{nameof(SendgridOptions)}:{nameof(SendgridOptions.ApiKey)}", "<Your Sendgrid API Key>"));

        modelBuilder.Entity<SystemSettings>().HasData(
            new SystemSettings($"{nameof(SmtpOptions)}:{nameof(SmtpOptions.SmtpHost)}", "localhost"),
            new SystemSettings($"{nameof(SmtpOptions)}:{nameof(SmtpOptions.SmtpPort)}", "25"),
            new SystemSettings($"{nameof(SmtpOptions)}:{nameof(SmtpOptions.UseSsl)}", "false"),
            new SystemSettings($"{nameof(SmtpOptions)}:{nameof(SmtpOptions.UseStartTls)}", "false"));
        
        modelBuilder.Entity<SystemSettings>().HasData(
            new SystemSettings($"{nameof(UserServiceOptions)}:{nameof(UserServiceOptions.SelfServiceRegistrationEnabled)}", "true"),
            new SystemSettings($"{nameof(UserServiceOptions)}:{nameof(UserServiceOptions.MaxPageSize)}", "100"),
            new SystemSettings($"{nameof(UserServiceOptions)}:{nameof(UserServiceOptions.MaxImportSize)}", "500"));
        
        modelBuilder.Entity<SystemSettings>().HasData(
            new SystemSettings($"{nameof(GroupServiceOptions)}:{nameof(GroupServiceOptions.MaxPageSize)}", "100"));
        
        modelBuilder.Entity<SystemSettings>().HasData(
            new SystemSettings($"{nameof(AssessmentServiceOptions)}:{nameof(AssessmentServiceOptions.MaxPageSize)}", "100"));
        
        modelBuilder.Entity<SystemSettings>().HasData(
            new SystemSettings($"{nameof(AssignmentServiceOptions)}:{nameof(AssignmentServiceOptions.MaxPageSize)}", "100"));
        
        modelBuilder.Entity<SystemSettings>().HasData(
            new SystemSettings($"{nameof(ReportingServiceOptions)}:{nameof(ReportingServiceOptions.MaxPageSize)}", "100"));
        
        modelBuilder.Entity<SystemSettings>().HasData(
            new SystemSettings($"{nameof(RedisOptions)}:{nameof(RedisOptions.Enabled)}", "false"),
            new SystemSettings($"{nameof(RedisOptions)}:{nameof(RedisOptions.ConnectionString)}", "redis:6379"),
            new SystemSettings($"{nameof(RedisOptions)}:{nameof(RedisOptions.KeyPrefix)}", "PublicQ:"),
            new SystemSettings($"{nameof(RedisOptions)}:{nameof(RedisOptions.DefaultDurationInMinutes)}", "60"),
            new SystemSettings($"{nameof(RedisOptions)}:{nameof(RedisOptions.ServiceDurationsInMinutes)}:{nameof(IReportingService)}", "60"),
            new SystemSettings($"{nameof(RedisOptions)}:{nameof(RedisOptions.AbortOnConnectFail)}", "false"));
        
        modelBuilder.Entity<SystemSettings>().HasData(
            new SystemSettings($"{nameof(EmailOptions)}:{nameof(EmailOptions.MessageProvider)}",
                nameof(MessageProvider.Sendgrid)),
            new SystemSettings($"{nameof(EmailOptions)}:{nameof(EmailOptions.SendFrom)}", "change-me@publiq.local"));
        
        modelBuilder.Entity<SystemSettings>().HasData(
            new SystemSettings($"{nameof(PasswordPolicyOptions)}:{nameof(PasswordPolicyOptions.RequiredLength)}", "8"),
            new SystemSettings($"{nameof(PasswordPolicyOptions)}:{nameof(PasswordPolicyOptions.RequireDigit)}", "true"),
            new SystemSettings($"{nameof(PasswordPolicyOptions)}:{nameof(PasswordPolicyOptions.RequireUppercase)}", "true"),
            new SystemSettings($"{nameof(PasswordPolicyOptions)}:{nameof(PasswordPolicyOptions.RequireLowercase)}", "true"),
            new SystemSettings($"{nameof(PasswordPolicyOptions)}:{nameof(PasswordPolicyOptions.RequireNonAlphanumeric)}", "false"));
        
        modelBuilder.Entity<SystemSettings>().HasData(
            new SystemSettings($"{nameof(AuthOptions)}:{nameof(AuthOptions.JwtSettings)}:{nameof(AuthOptions.JwtSettings.Audience)}",
                "PublicQClient"),
            new SystemSettings($"{nameof(AuthOptions)}:{nameof(AuthOptions.JwtSettings)}:{nameof(AuthOptions.JwtSettings.Issuer)}",
                "PublicQServer"),
            new SystemSettings($"{nameof(AuthOptions)}:{nameof(AuthOptions.JwtSettings)}:{nameof(AuthOptions.JwtSettings.Secret)}",
                Constants.DefaultJwtSecret),
            new SystemSettings($"{nameof(AuthOptions)}:{nameof(AuthOptions.JwtSettings)}:{nameof(AuthOptions.JwtSettings.TokenExpiryMinutes)}", 
                "60"));
        
        modelBuilder.Entity<MessageTemplateEntity>().HasData(
            new MessageTemplateEntity
            {
                Id = Constants.DefaultWelcomeMessageTemplateId,
                Name = "Default Welcome Email",
                Subject = "Dear {{User}}, welcome to PublicQ!",
                Body = MessageTemplateHtmlContent.WelcomeEmailBody
            },
            new MessageTemplateEntity {
                Id = Constants.DefaultWelcomeMessageWithCreatePasswordTemplateId,
                Name = "Default Welcome Email with Create Password Link",
                Subject = "Dear {{User}}, welcome to PublicQ!",
                Body = MessageTemplateHtmlContent.WelcomeEmailBodyWithResetLink
            },
            new MessageTemplateEntity
            {
                Id = Constants.DefaultPasswordResetMessageTemplateId,
                Name = "Default Password Reset Email",
                Subject = "Dear {{User}}, your password has been reset",
                Body = MessageTemplateHtmlContent.PasswordResetEmailBody
            },
            new MessageTemplateEntity
            {
                Id = Constants.DefaultForgetPasswordMessageTemplateId,
                Name = "Default Forget Password",
                Subject = "Dear {{User}}, here is your password reset link",
                Body = MessageTemplateHtmlContent.ForgetPasswordEmailBody
            }
        );
    }
}