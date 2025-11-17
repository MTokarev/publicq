using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using PublicQ.API.Helpers;
using PublicQ.API.Models.Requests;
using PublicQ.API.Models.Validators;
using PublicQ.Application.Interfaces;
using PublicQ.Application.Models;
using PublicQ.Infrastructure.Options;
using PublicQ.Shared;
using Constants = PublicQ.Shared.Constants;
using LogLevel = Microsoft.Extensions.Logging.LogLevel;

namespace PublicQ.API.Controllers;

/// <summary>
/// Configuration controller for managing application settings stored in the Database.
/// </summary>
/// <param name="configUpdateService">Service for updating configuration settings</param>
/// <param name="loggerOptions">Database logger configuration options</param>
/// <param name="fileStorageOptions">File Storage configuration options</param>
/// <param name="passwordPolicyOptions">Password policy configuration options</param>
/// <param name="sendgridOptions">SendGrid email service configuration options</param>
/// <param name="smtpOptions">SMTP email service configuration options</param>
/// <param name="emailOptions">Email configuration options</param>
/// <param name="userServiceOptions">User service configuration options</param>
/// <param name="initialSetupOptions">Initial application setup configuration options</param>
/// <param name="ipRateLimitOptions">IP Rate limitation</param>
/// <param name="redisOptions">Redis cache configuration options</param>
/// <param name="authOptions">Authentication configuration options</param>
/// <param name="llmOptions">LLM Integration options</param>
/// <param name="mcpApiKeyOptions">MCP API integration options</param>
/// <param name="openAIOptions">OpenAI configuration options</param>
/// <remarks>
/// I made a decision in favor of the strongly-typed controller instead of the generic one.
/// In my opinion, it will simplify code generation for the HTTP client on the front end and improve documentation.
/// </remarks>
[ApiController]
[Route($"{Constants.ControllerRoutePrefix}/[controller]")]
public class ConfigurationController(
    IConfigurationUpdateService configUpdateService,
    IOptionsMonitor<DbLoggerOptions> loggerOptions,
    IOptionsMonitor<FileStorageOptions> fileStorageOptions,
    IOptionsMonitor<PasswordPolicyOptions> passwordPolicyOptions,
    IOptionsMonitor<SendgridOptions> sendgridOptions,
    IOptionsMonitor<SmtpOptions> smtpOptions,
    IOptionsMonitor<EmailOptions> emailOptions,
    IOptionsMonitor<UserServiceOptions> userServiceOptions,
    IOptionsMonitor<InitialSetupOptions> initialSetupOptions,
    IOptionsMonitor<IpRateLimitOptions> ipRateLimitOptions,
    IOptionsMonitor<RedisOptions> redisOptions,
    IOptionsMonitor<AuthOptions> authOptions,
    IOptionsMonitor<LlmIntegrationOptions> llmOptions,
    IOptionsMonitor<McpApiKeyOptions> mcpApiKeyOptions,
    IOptionsMonitor<OpenAIOptions> openAIOptions) : ControllerBase
{
    /// <summary>
    /// Gets requested configuration.
    /// </summary>
    /// <returns>Returns initial setup options wrapped into <see cref="Response{TData, TStatus}"/></returns>
    [HttpGet("initial-setup", Name = nameof(GetInitialSetup))]
    public ActionResult<Response<InitialSetupOptions, GenericOperationStatuses>> GetInitialSetup()
    {
        return Ok(Response<InitialSetupOptions, GenericOperationStatuses>
            .Success(initialSetupOptions.CurrentValue, GenericOperationStatuses.Completed, "Successfully retrieved configuration."));
        
    }
    
    /// <summary>
    /// Set initial setup options
    /// <remarks>
    /// Should be only done for troubleshooting purpose.
    /// </remarks>
    /// </summary>
    /// <param name="options">Initial setup model <see cref="InitialSetupOptions"/></param>
    /// <returns></returns>
    [HttpPost("initial-setup")]
    public IActionResult SetInitialSetup([FromBody] InitialSetupOptions options)
    {
        var response = configUpdateService.Set(options);

        return response.ToActionResult(nameof(GetInitialSetup));
    }
    
    /// <summary>
    /// Gets requested configuration.
    /// </summary>
    /// <returns>Returns initial setup options wrapped into <see cref="Response{TData, TStatus}"/></returns>
    [Authorize(Constants.AdminsPolicy)]
    [HttpGet("email", Name = nameof(GetEmailConfig))]
    public IActionResult GetEmailConfig()
    {
        return Response<EmailOptions, GenericOperationStatuses>
            .Success(emailOptions.CurrentValue, GenericOperationStatuses.Completed, "Successfully retrieved configuration.")
            .ToActionResult();
    }

    /// <summary>
    /// Update <see cref="EmailOptions"/>
    /// </summary>
    /// <param name="options"><see cref="EmailOptions"/></param>
    /// <param name="emailOptionsValidator">Email options validator</param>
    /// <returns>R</returns>
    [HttpPost("email")]
    [Authorize(Constants.AdminsPolicy)]
    public IActionResult SetEmailConfig(
        [FromBody] EmailOptions options,
        [FromServices] IValidator<EmailOptions> emailOptionsValidator)
    {
        var validationResult = emailOptionsValidator.Validate(options);

        if (!validationResult.IsValid)
        {
            return Response<EmailOptions, GenericOperationStatuses>
                .Failure(GenericOperationStatuses.BadRequest, 
                    "Validation error",
                    validationResult.Errors.Select(e => e.ErrorMessage).ToList())
                .ToActionResult();
        }
        
        var response = configUpdateService.Set(options);

        return response.ToActionResult(nameof(GetEmailConfig));
    }
    
    /// <summary>
    /// Gets <see cref="SendgridOptions"/> configuration.
    /// </summary>
    /// <returns>Returns Sendgrid options wrapped into <see cref="Response{TData, TStatus}"/></returns>
    [Authorize(Constants.AdminsPolicy)]
    [HttpGet("sendgrid", Name = nameof(GetSendgridConfig))]
    public ActionResult<Response<SendgridOptions, GenericOperationStatuses>> GetSendgridConfig()
    {
        return Ok(Response<SendgridOptions, GenericOperationStatuses>
            .Success(sendgridOptions.CurrentValue, GenericOperationStatuses.Completed, "Successfully retrieved configuration."));
    }

    /// <summary>
    /// Update <see cref="SendgridOptions"/>
    /// </summary>
    /// <param name="options"><see cref="SendgridOptions"/></param>
    /// <param name="sendgridOptionsValidator">Sendgrid options validator</param>
    /// <returns>Returns result of the update operation</returns>
    [Authorize(Constants.AdminsPolicy)]
    [HttpPost("sendgrid")]
    public IActionResult SetSendgridConfig(
        [FromBody] SendgridOptions options,
        [FromServices] IValidator<SendgridOptions> sendgridOptionsValidator)
    {

        var validationResult = sendgridOptionsValidator.Validate(options);
        if (!validationResult.IsValid)
        {
            return Response<SendgridOptions, GenericOperationStatuses>
                .Failure(GenericOperationStatuses.BadRequest, 
                    "Validation error",
                    validationResult.Errors.Select(e => e.ErrorMessage).ToList())
                .ToActionResult();
        }
        
        var response = configUpdateService.Set(options);

        return response.ToActionResult(nameof(GetSendgridConfig));
    }
    
    /// <summary>
    /// Gets <see cref="SendgridOptions"/> configuration.
    /// </summary>
    /// <returns>Returns SMTP configuration wrapped into <see cref="Response{TData, TStatus}"/></returns>
    [Authorize(Constants.AdminsPolicy)]
    [HttpGet("smtp", Name = nameof(GetSmtpConfig))]
    public IActionResult GetSmtpConfig()
    {
        return Response<SmtpOptions, GenericOperationStatuses>
            .Success(smtpOptions.CurrentValue, GenericOperationStatuses.Completed, "Successfully retrieved configuration.")
            .ToActionResult();
    }
    
    /// <summary>
    /// Set <see cref="SmtpOptions"/>
    /// </summary>
    /// <param name="options"><see cref="SmtpOptions"/></param>
    /// <param name="smtpOptionsValidator"><see cref="SmtpOptionsValidator"/></param>
    /// <returns>Returns <see cref="GenericOperationStatuses"/> wrapped into <see cref="Response{TStatus}"/></returns>
    [Authorize(Constants.AdminsPolicy)]
    [HttpPost("smtp")]
    public IActionResult SetSmtpConfig(
        [FromBody] SmtpOptions options,
        [FromServices] IValidator<SmtpOptions> smtpOptionsValidator)
    {
        var validationResult = smtpOptionsValidator.Validate(options);
        if (!validationResult.IsValid)
        {
            return Response<SmtpOptions, GenericOperationStatuses>
                .Failure(GenericOperationStatuses.BadRequest, 
                    "Validation error",
                    validationResult.Errors.Select(e => e.ErrorMessage).ToList())
                .ToActionResult();
        }
        
        var response = configUpdateService.Set(options);

        return response.ToActionResult(nameof(GetSmtpConfig));
    }
    
    /// <summary>
    /// URotates JWT token private key
    /// </summary>
    /// <returns>Returns result of the update operation</returns>
    [HttpGet("security/token")]
    public IActionResult GetTokenConfigurationAsync()
    {
        return Response<AuthOptions, GenericOperationStatuses>
            .Success(authOptions.CurrentValue, GenericOperationStatuses.Completed, "Successfully retrieved configuration.")
            .ToActionResult();
    }
    
    /// <summary>
    /// URotates JWT token private key
    /// </summary>
    /// <returns>Returns result of the update operation</returns>
    [HttpPost("security/token")]
    public IActionResult SetTokenConfigurationAsync(
        [FromBody] AuthOptions options,
        [FromServices] IValidator<AuthOptions> authOptionsValidator)
    {
        var validationResult = authOptionsValidator.Validate(options);
        if (!validationResult.IsValid)
        {
            return Response<AuthOptions, GenericOperationStatuses>
                .Failure(GenericOperationStatuses.BadRequest, 
                    "Validation error",
                    validationResult.Errors.Select(e => e.ErrorMessage).ToList())
                .ToActionResult();
        }
        var response = configUpdateService.Set(options);
        
        return response.ToActionResult(nameof(GetTokenConfigurationAsync));
    }
    
    /// <summary>
    /// Gets <see cref="PasswordPolicyOptions"/> configuration.
    /// No authorization required.
    /// This endpoint is used by the front end to validate password complexity rules before user registration.
    /// </summary>
    /// <returns>Returns password policy options wrapped into <see cref="Response{TData, TStatus}"/></returns>
    [HttpGet("security/password", Name = nameof(GetPasswordPolicyConfig))]
    public ActionResult<Response<PasswordPolicyOptions, GenericOperationStatuses>> GetPasswordPolicyConfig()
    {
        return Ok(Response<PasswordPolicyOptions, GenericOperationStatuses>
            .Success(passwordPolicyOptions.CurrentValue, GenericOperationStatuses.Completed, "Successfully retrieved configuration."));
    }

    /// <summary>
    /// Update <see cref="PasswordPolicyOptions"/>
    /// </summary>
    /// <param name="options"><see cref="PasswordPolicyOptions"/></param>
    /// <returns>Returns result of the update operation</returns>
    [Authorize(Constants.AdminsPolicy)]
    [HttpPost("security/password")]
    public IActionResult SetPasswordPolicyConfig([FromBody] PasswordPolicyOptions options)
    {
        var response = configUpdateService.Set(options);

        return response.ToActionResult(nameof(GetPasswordPolicyConfig));
    }
    
    /// <summary>
    /// Gets whether self-service user registration is enabled.
    /// </summary>
    /// <returns>True if registration is enabled, otherwise, false.</returns>
    [HttpGet("security/user/registration")]
    public IActionResult IsSelfServiceRegistrationEnabled()
    {
        return Response<bool, GenericOperationStatuses>
            .Success(userServiceOptions.CurrentValue.SelfServiceRegistrationEnabled, GenericOperationStatuses.Completed,
                "Successfully retrieved configuration.")
            .ToActionResult();
    }
    
    /// <summary>
    /// Gets whether self-service user registration is enabled.
    /// </summary>
    /// <param name="enableSelfServiceRegistration">Enable or disable self service user registration</param>
    /// <returns>Returns <see cref="GenericOperationStatuses"/> wrapped into <see cref="Response{TStatus}"/></returns>
    [HttpPost("security/user/registration")]
    [Authorize(Constants.AdminsPolicy)]
    public IActionResult IsSelfServiceRegistrationEnabled(
        [FromBody] bool enableSelfServiceRegistration)
    {
        userServiceOptions.CurrentValue.SelfServiceRegistrationEnabled = enableSelfServiceRegistration;
        var response = configUpdateService.Set(userServiceOptions.CurrentValue);
        
        return response.ToActionResult(nameof(IsSelfServiceRegistrationEnabled));
    }
    
    /// <summary>
    /// Gets <see cref="CacheConfigurationDto"/> configuration.
    /// </summary>
    /// <returns>Returns <see cref="CacheConfigurationDto"/></returns>
    [HttpGet("cache")]
    [Authorize(Constants.AdminsPolicy)]
    public IActionResult GetCacheConfiguration()
    {
        return Response<CacheConfigurationDto, GenericOperationStatuses>
            .Success(
                redisOptions.CurrentValue.ConvertToDto(), 
                GenericOperationStatuses.Completed, "Successfully retrieved configuration.")
            .ToActionResult();
    }
    
    /// <summary>
    /// Updates <see cref="CacheConfigurationDto"/>
    /// </summary>
    /// <param name="cacheConfig">Updated config</param>
    /// <param name="cacheConfigValidator"><see cref="CacheConfigurationDtoValidator"/></param>
    /// <returns>Returns <see cref="GenericOperationStatuses"/> wrapped into <see cref="Response{TStatus}"/></returns>
    [HttpPost("cache")]
    [Authorize(Constants.AdminsPolicy)]
    public IActionResult GetCacheConfiguration(
        [FromBody] CacheConfigurationDto cacheConfig, 
        [FromServices] IValidator<CacheConfigurationDto> cacheConfigValidator)
    {
        var validationResult = cacheConfigValidator.Validate(cacheConfig);
        if (!validationResult.IsValid)
        {
            return Response<GenericOperationStatuses>
                .Failure(GenericOperationStatuses.BadRequest, 
                    "Validation error",
                    validationResult.Errors.Select(e => e.ErrorMessage).ToList())
                .ToActionResult();
        }
        
        var currentRedisOptions = redisOptions.CurrentValue;
        if (currentRedisOptions.ServiceDurationsInMinutes.TryGetValue(nameof(IReportingService), out var currentReportCacheDuration) &&
            currentReportCacheDuration != cacheConfig.ReportCacheDurationInMinutes)
        {
            currentRedisOptions.ServiceDurationsInMinutes[nameof(IReportingService)] = cacheConfig.ReportCacheDurationInMinutes;
        }

        if (!string.IsNullOrWhiteSpace(cacheConfig.KeyPrefix))
        {
            if (!cacheConfig.KeyPrefix.EndsWith(":"))
            {
                cacheConfig.KeyPrefix += ":";
            }
            
            currentRedisOptions.KeyPrefix = cacheConfig.KeyPrefix;
        }
        
        if (!string.IsNullOrWhiteSpace(cacheConfig.ConnectionString))
        {
            currentRedisOptions.ConnectionString = cacheConfig.ConnectionString;
        }
        
        currentRedisOptions.Enabled = cacheConfig.Enable;
        
        var response = configUpdateService.Set(currentRedisOptions);
        
        return response.ToActionResult(nameof(GetCacheConfiguration));
    }

    /// <summary>
    /// Gets <see cref="LogConfigurationDto"/> configuration.
    /// </summary>
    /// <returns>Returns <see cref="LogConfigurationDto"/></returns>
    [HttpGet("logging")]
    [Authorize(Constants.AdminsPolicy)]
    public IActionResult GetLoggingConfiguration()
    {
        return Response<LogConfigurationDto, GenericOperationStatuses>
            .Success(loggerOptions.CurrentValue.ConvertToDto(), GenericOperationStatuses.Completed,
                "Successfully retrieved configuration.")
            .ToActionResult();
    }

    /// <summary>
    /// Sets <see cref="LogConfigurationDto"/>
    /// </summary>
    /// <param name="logConfig"><see cref="LogConfigurationDto"/></param>
    /// <param name="logConfigValidator"><see cref="LogConfigurationDtoValidator"/></param>
    /// <returns>Returns <see cref="GenericOperationStatuses"/> wrapped into <see cref="Response{TStatus}"/></returns>
    [HttpPost("logging")]
    [Authorize(Constants.AdminsPolicy)]
    public IActionResult SetLoggingConfiguration(
        [FromBody] LogConfigurationDto logConfig,
        [FromServices] IValidator<LogConfigurationDto> logConfigValidator)
    {
        var validationResult = logConfigValidator.Validate(logConfig);
        if (!validationResult.IsValid)
        {
            return Response<GenericOperationStatuses>
                .Failure(GenericOperationStatuses.BadRequest, 
                    "Validation error",
                    validationResult.Errors.Select(e => e.ErrorMessage).ToList())
                .ToActionResult();
        }
        var currentLoggerOptions = loggerOptions.CurrentValue;
        currentLoggerOptions.Enabled = logConfig.Enable;
        currentLoggerOptions.RetentionPeriodInDays = logConfig.RetentionPeriodInDays;
        currentLoggerOptions.LogLevel = Enum.TryParse<LogLevel>(logConfig.LogLevel.ToString(), out var level) ?
            level : 
            LogLevel.Error;
        var response = configUpdateService.Set(currentLoggerOptions);
        
        return response.ToActionResult(nameof(GetLoggingConfiguration));
    }

    /// <summary>
    /// File storage configuration
    /// </summary>
    /// <returns></returns>
    [HttpGet("file-storage")]
    [Authorize(Constants.AdminsPolicy)]
    public IActionResult GetFileStorageConfiguration()
    {
        return Response<FileStorageOptions, GenericOperationStatuses>
            .Success(fileStorageOptions.CurrentValue, GenericOperationStatuses.Completed,
                "Successfully retrieved configuration.")
            .ToActionResult();
    }
    
    /// <summary>
    /// File storage configuration
    /// </summary>
    /// <param name="maxUploadFileSizeInKilobytes">Max upload file size in kilobytes</param>
    /// <returns></returns>
    [HttpPost("file-storage")]
    [Authorize(Constants.AdminsPolicy)]
    public IActionResult GetFileStorageConfiguration([FromBody] int maxUploadFileSizeInKilobytes)
    {
        if (maxUploadFileSizeInKilobytes < 1)
        {
            return Response<GenericOperationStatuses>
                .Failure(GenericOperationStatuses.BadRequest, 
                    "Validation error",
                    new List<string> { "Max upload file size must be greater than zero." })
                .ToActionResult();
        }
        
        fileStorageOptions.CurrentValue.MaxUploadFileSizeInKilobytes = maxUploadFileSizeInKilobytes;
        var response = configUpdateService.Set(fileStorageOptions.CurrentValue);
        
        return response.ToActionResult(nameof(GetFileStorageConfiguration));
    }
    
    /// <summary>
    /// Gets IP rate limiting configuration
    /// </summary>
    /// <returns>Returns <see cref="IpRateLimitOptions"/></returns>
    [HttpGet("ip-rate-limiting")]
    public IActionResult GetIpRateLimitingConfiguration()
    {
        return Response<IpRateLimitOptions, GenericOperationStatuses>
            .Success(ipRateLimitOptions.CurrentValue, GenericOperationStatuses.Completed,
                "Successfully retrieved configuration.")
            .ToActionResult();
    }
    
    /// <summary>
    /// Sets IP rate limiting configuration period
    /// </summary>
    /// <remarks>
    /// ATTENTION: The change made in this endpoint requires a MANUAL application restart to take effect.
    /// </remarks>
    /// <returns>Configuration update result</returns>
    [HttpPost("ip-rate-limiting")]
    public async Task<IActionResult> SetIpRateLimitingConfiguration(
        [FromBody] IpRateLimitUpdateRequest ipRateLimit,
        [FromServices] IValidator<IpRateLimitUpdateRequest> ipRateLimitUpdateRequestValidator,
        CancellationToken cancellationToken)
    {
        
        var validationResult = await ipRateLimitUpdateRequestValidator.ValidateAsync(ipRateLimit, cancellationToken);
        if (!validationResult.IsValid)
        {
            return Response<GenericOperationStatuses>
                .Failure(GenericOperationStatuses.BadRequest, 
                    "Validation error",
                    validationResult.Errors.Select(e => e.ErrorMessage).ToList())
                .ToActionResult();
        }

        var currentConfig = ipRateLimitOptions.CurrentValue;
        
        var firstRule = currentConfig.GeneralRules.FirstOrDefault();
        if (firstRule == null)
        {
            return Response<GenericOperationStatuses>
                .Failure(GenericOperationStatuses.Failed,
                    "Validation error",
                    new List<string> { "No general rules found in the configuration. Make sure that the database initialization has added required options." })
                .ToActionResult();
        }

        // Enable or disable rate limiting by setting the endpoint to "*" or a stub value.
        if (ipRateLimit.Enabled)
        {
            firstRule.Endpoint = "*";
        }
        else
        {
            firstRule.Endpoint = "stub-endpoint-to-disable-rate-limiting";
        }

        firstRule.Period = $"{ipRateLimit.PeriodInSeconds}s";
        firstRule.Limit = ipRateLimit.Limit;
        currentConfig.IpWhitelist = ipRateLimit.IpWhitelist;
        currentConfig.RealIpHeader = ipRateLimit.RealIpHeader;
        
        var response = await configUpdateService.Replace(currentConfig, cancellationToken);
        
        return response.ToActionResult();
    }

    /// <summary>
    /// Gets LLM integration configuration
    /// </summary>
    /// <returns>Returns <see cref="LlmIntegrationOptions"/> wrapped into <see cref="Response{TData, TStatus}"/></returns>
    [HttpGet("llm-integration")]
    [Authorize(Constants.AdminsPolicy)]
    public IActionResult GetLlmIntegrationConfiguration()
    {
        return Response<LlmIntegrationOptions, GenericOperationStatuses>
            .Success(llmOptions.CurrentValue, GenericOperationStatuses.Completed,
                "Successfully retrieved configuration.")
            .ToActionResult();
    }

    /// <summary>
    /// Sets LLM integration configuration
    /// </summary>
    /// <param name="options"><see cref="LlmIntegrationOptions"/></param>
    /// <param name="llmIntegrationOptionsValidator"><see cref="LlmIntegrationOptionsValidator"/></param>
    /// <returns>Returns <see cref="Response{TStatus}"/></returns>
    [HttpPost("llm-integration")]
    [Authorize(Constants.AdminsPolicy)]
    public IActionResult SetLlmIntegrationConfiguration(
        [FromBody] LlmIntegrationOptions options,
        [FromServices] IValidator<LlmIntegrationOptions> llmIntegrationOptionsValidator)
    {
        var validationResult = llmIntegrationOptionsValidator.Validate(options);
        if (!validationResult.IsValid)
        {
            return Response<GenericOperationStatuses>
                .Failure(GenericOperationStatuses.BadRequest,
                    "Validation error",
                    validationResult.Errors.Select(e => e.ErrorMessage).ToList())
                .ToActionResult();
        }

        var response = configUpdateService.Set(options);
        return response.ToActionResult(nameof(GetLlmIntegrationConfiguration));
    }
    
    /// <summary>
    /// Gets MCP API key configuration
    /// </summary>
    /// <returns>Returns <see cref="McpApiKeyOptions"/> wrapped into <see cref="Response{TData, TStatus}"/></returns>
    [HttpGet("llm-integration/mcp-api-key")]
    [Authorize(Constants.AdminsPolicy)]
    public IActionResult GetMcpApiKeyConfiguration()
    {
        return Response<McpApiKeyOptions, GenericOperationStatuses>
            .Success(mcpApiKeyOptions.CurrentValue, GenericOperationStatuses.Completed,
                "Successfully retrieved configuration.")
            .ToActionResult();
    }

    /// <summary>
    /// Sets MCP API key configuration
    /// </summary>
    /// <param name="options"><see cref="McpApiKeyOptions"/></param>
    /// <param name="mcpApiKeyOptionsValidator">Validator</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns <see cref="Response{TStatus}"/></returns>
    [HttpPost("llm-integration/mcp-api-key")]
    [Authorize(Constants.AdminsPolicy)]
    public async Task<IActionResult> SetMcpApiKeyConfiguration(
        [FromBody] McpApiKeyOptions options,
        [FromServices] IValidator<McpApiKeyOptions> mcpApiKeyOptionsValidator,
        CancellationToken cancellationToken)
    {
        var validationResult = await mcpApiKeyOptionsValidator.ValidateAsync(options, cancellationToken);
        if (!validationResult.IsValid)
        {
            return Response<GenericOperationStatuses>
                .Failure(GenericOperationStatuses.BadRequest,
                    "Validation error",
                    validationResult.Errors.Select(e => e.ErrorMessage).ToList())
                .ToActionResult();
        }
        
        var fullName = UserClaimParser.GetUserDisplayName(User.Claims);
        
        var currentKeys = mcpApiKeyOptions
            .CurrentValue
            .Keys
            .ToDictionary(k => k.Key, k => k);
        
        foreach (var key in options.Keys)
        {
            if (!currentKeys.ContainsKey(key.Key))
            {
                // Set CreatedBy and CreatedOnUtc for new keys
                key.CreatedBy = fullName;
                key.CreatedOnUtc = DateTime.UtcNow;
            }
        }

        var response = await configUpdateService.Replace(options, cancellationToken);
        return response.ToActionResult(nameof(GetMcpApiKeyConfiguration));
    }

    /// <summary>
    /// Gets OpenAI configuration
    /// </summary>
    /// <returns>Returns <see cref="OpenAIOptions"/> wrapped into <see cref="Response{TData, TStatus}"/></returns>
    [HttpGet("llm-integration/openai")]
    [Authorize(Constants.AdminsPolicy)]
    public IActionResult GetOpenAIConfiguration()
    {
        return Response<OpenAIOptions, GenericOperationStatuses>
            .Success(openAIOptions.CurrentValue, GenericOperationStatuses.Completed,
                "Successfully retrieved configuration.")
            .ToActionResult();
    }

    /// <summary>
    /// Sets OpenAI configuration
    /// </summary>
    /// <param name="options"><see cref="OpenAIOptions"/></param>
    /// <param name="openAIOptionsValidator"><see cref="OpenAIOptionsValidator"/></param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns <see cref="Response{TStatus}"/></returns>
    [HttpPost("llm-integration/openai")]
    [Authorize(Constants.AdminsPolicy)]
    public async Task<IActionResult> SetOpenAIConfiguration(
        [FromBody] OpenAIOptions options,
        [FromServices] IValidator<OpenAIOptions> openAIOptionsValidator,
        CancellationToken cancellationToken)
    {
        var validationResult = openAIOptionsValidator.Validate(options);
        if (!validationResult.IsValid)
        {
            return Response<GenericOperationStatuses>
                .Failure(GenericOperationStatuses.BadRequest,
                    "Validation error",
                    validationResult.Errors.Select(e => e.ErrorMessage).ToList())
                .ToActionResult();
        }

        var response = await configUpdateService.Replace(options, cancellationToken);
        return response.ToActionResult(nameof(GetOpenAIConfiguration));
    }
}