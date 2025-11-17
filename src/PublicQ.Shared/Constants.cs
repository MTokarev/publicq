namespace PublicQ.Shared;

/// <summary>
/// Constants used in the application.
/// </summary>
public static class Constants
{
    #region Application Roles
    
    /// <summary>
    /// Admin role. This role has all permissions in the application.
    /// </summary>
    public const string AdminsPolicy = "Admins";
    
    /// <summary>
    /// This role is used for users who can manage the application's content.
    /// </summary>
    public const string ContributorsPolicy = "Contributors";
    
    /// <summary>
    /// Manager role. Has all permissions except managing settings.
    /// </summary>
    public const string ManagersPolicy = "Managers";
    
    /// <summary>
    /// Moderator role. This role is used for users who can manage user-generated content,
    /// publish created by contributors modules and handle user reports.
    /// </summary>
    public const string ModeratorsPolicy = "Moderators";
    
    /// <summary>
    /// This role allows access to analytics and reporting features.
    /// </summary>
    public const string AnalyticsPolicy = "Analytics";
    
    #endregion
    
    public const string DbDefaultConnectionString = "DefaultConnection";

    /// <summary>
    /// Default email for the admin user.
    /// </summary>
    public const string DefaultAdminEmail = "admin@publicq.local";
    
    /// <summary>
    /// Default welcome message template ID.
    /// </summary>
    public static readonly Guid DefaultWelcomeMessageTemplateId = Guid.Parse("f2a1a4c8-8e6a-4f1c-b9f8-9f2c4c622dd9");
    
    /// <summary>
    /// Default welcome message with create password template ID.
    /// </summary>
    public static readonly Guid DefaultWelcomeMessageWithCreatePasswordTemplateId = Guid.Parse("6863fdeb-ed8d-41ba-8567-c00cf8561470");

    /// <summary>
    /// Default forget password message template ID.
    /// </summary>
    public static readonly Guid DefaultForgetPasswordMessageTemplateId = Guid.Parse("a5091d38-fa5e-4cdb-b4bc-22381aeaf8be");
    
    /// <summary>
    /// Default JWT key used for token generation and validation.
    /// Note: This key should be changed in production environments to ensure security.
    /// </summary>
    public static readonly string DefaultJwtSecret =
        "ChangeMe:VGhpc0lzQVNlY3VyZURlZmF1bHRKV1RTZWNyZXRLZXlGb3JEZXZlbG9wbWVudFB1cnBvc2VzT25seQ==";

    /// <summary>
    /// Default API key header name.
    /// </summary>
    public static readonly string ApiHeaderName = "X-API-Key";
    
    /// <summary>
    /// Default password reset message template ID.
    /// </summary>
    public static readonly Guid DefaultPasswordResetMessageTemplateId = Guid.Parse("bfc0e145-396f-4bc1-ae2f-14e528fe55b3");
    
    /// <summary>
    /// Controller route prefix.
    /// </summary>
    public const string ControllerRoutePrefix = "api";
    
    /// <summary>
    /// Default MCP route prefix.
    /// </summary>
    public const string McpRoutePrefix = "mcp";
    
    /// <summary>
    /// Path for front-end user reset component.
    /// </summary>
    public const string FrontEndResetPasswordPath = "reset-password";
}