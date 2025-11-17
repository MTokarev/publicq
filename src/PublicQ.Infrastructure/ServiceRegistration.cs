using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using PublicQ.Application.Interfaces;
using PublicQ.Domain.Enums;
using PublicQ.Infrastructure.Handlers;
using PublicQ.Infrastructure.Options;
using PublicQ.Infrastructure.Persistence;
using PublicQ.Infrastructure.Services;
using PublicQ.Shared;
using StackExchange.Redis;

namespace PublicQ.Infrastructure;

public static class ServiceRegistration
{
    extension(IServiceCollection services)
    {
        /// <summary>
        /// Adds infrastructure services to the service collection.
        /// </summary>
        public IServiceCollection AddInfrastructure(IConfiguration config)
        {
            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseSqlite(config.GetConnectionString(Constants.DbDefaultConnectionString)));

            services.AddIdentity<ApplicationUser, IdentityRole>()
                .AddEntityFrameworkStores<ApplicationDbContext>()
                .AddDefaultTokenProviders();

            services.AddDbLogger();
            services.AddAuth(config);
            services.AddRedisCache(config);
            services.AddAi(config);
        
            services.AddTransient<IEmailSender<ApplicationUser>, IdentityEmailSender>();
            services.AddScoped<IApplicationInitializer, ApplicationInitializer>();
            services.AddScoped<IConfigurationUpdateService, ConfigurationUpdateService>();
            services.AddScoped<IStorageService, FileStorageService>();
        
            services.AddScoped<IAssessmentService, AssessmentService>();
            services.AddScoped<IAssignmentService, AssignmentService>();
            services.AddScoped<IQuestionService, QuestionService>();
            services.AddScoped<IGroupService, GroupService>();
            services.AddScoped<ISessionService, SessionService>();

            services.AddCachedService<IPlatformStatisticService, PlatformStatisticService>();
            services.AddCachedService<IReportingService, ReportingService>();
        
            services.AddScoped<IMessageHandler, SendGridMessageHandler>();
            services.AddScoped<IMessageHandler, SmtpMessageHandler>();
            services.AddScoped<IMessageTemplateService, MessageTemplateService>();
            services.AddScoped<IMessageService, MessageService>();
        
            services.AddScoped<IBannerService, BannerService>();
            services.AddScoped<IPageService, PageService>();
        
            services.AddOptions<InitialSetupOptions>().Bind(config.GetSection(nameof(InitialSetupOptions)));
            services.AddOptions<EmailOptions>().Bind(config.GetSection(nameof(EmailOptions)));
            services.AddOptions<SendgridOptions>().Bind(config.GetSection(nameof(SendgridOptions)));
            services.AddOptions<SmtpOptions>().Bind(config.GetSection(nameof(SmtpOptions)));
            services.AddOptions<FileStorageOptions>().Bind(config.GetSection(nameof(FileStorageOptions)));
            services.AddOptions<UserServiceOptions>().Bind(config.GetSection(nameof(UserServiceOptions)));
            services.AddOptions<GroupServiceOptions>().Bind(config.GetSection(nameof(GroupServiceOptions)));
            services.AddOptions<AssessmentServiceOptions>().Bind(config.GetSection(nameof(AssessmentServiceOptions)));
            services.AddOptions<AssignmentServiceOptions>().Bind(config.GetSection(nameof(AssignmentServiceOptions)));
            services.AddOptions<ReportingService>().Bind(config.GetSection(nameof(ReportingServiceOptions)));
        
            return services;
        }

        /// <summary>
        /// AI related services
        /// </summary>
        IServiceCollection AddAi(IConfiguration config)
        {
            services.AddOptions<McpApiKeyOptions>().Bind(config.GetSection(nameof(McpApiKeyOptions)));
            services.AddOptions<LlmIntegrationOptions>().Bind(config.GetSection(nameof(LlmIntegrationOptions)));
            services.AddOptions<OpenAIOptions>().Bind(config.GetSection(nameof(OpenAIOptions)));
        
            services.AddScoped<IApiKeyService, McpApiKeyService>();
            services.AddScoped<IMcpAuthService, MpcAuthService>();
            services.AddScoped<IAIChatHandler, OpenAIChatHandler>();
            services.AddScoped<IAIChatService, AIChatService>();
        
            return services;
        }

        /// <summary>
        /// Add Authentication and Authorization services
        /// </summary>
        IServiceCollection AddAuth(IConfiguration config)
        {
            // Relaxing password policy for Identity Framework.
            // The password configuration will be stored in the database.
            services.AddOptions<AuthOptions>().Bind(config.GetSection(nameof(AuthOptions)));
            services.AddOptions<PasswordPolicyOptions>().Bind(config.GetSection(nameof(PasswordPolicyOptions)));
        
            services.Configure<IdentityOptions>(options =>
            {
                options.Password.RequireDigit = false;
                options.Password.RequireUppercase = false;
                options.Password.RequireLowercase = false;
                options.Password.RequireNonAlphanumeric = false;
                options.Password.RequiredLength = 0;
            });
            services
                .AddAuthentication(options =>
                {
                    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
                })
                .AddScheme<JwtBearerOptions, DynamicJwtBearerHandler>(JwtBearerDefaults.AuthenticationScheme, options => {});

            // Define authorization policies based on roles
            // Here contributor is the lowest role, analytics, then moderator, then administrator
            // If a user is an administrator, they are also a moderator and a contributor
            services.AddAuthorizationBuilder()
                .AddPolicy(Constants.AdminsPolicy, policy =>
                    policy.RequireRole(nameof(UserRole.Administrator)))
                .AddPolicy(Constants.AnalyticsPolicy, policy =>
                    policy.RequireRole(nameof(UserRole.Analyst), nameof(UserRole.Manager), nameof(UserRole.Administrator)))
                .AddPolicy(Constants.ContributorsPolicy, policy =>
                    policy.RequireRole(nameof(UserRole.Contributor), nameof(UserRole.Moderator),
                        nameof(UserRole.Manager), nameof(UserRole.Administrator)))
                .AddPolicy(Constants.ModeratorsPolicy, policy =>
                    policy.RequireRole(nameof(UserRole.Moderator), nameof(UserRole.Manager), nameof(UserRole.Administrator)))
                .AddPolicy(Constants.ManagersPolicy, policy => 
                    policy.RequireRole(nameof(UserRole.Manager), nameof(UserRole.Administrator)));
        
            services.AddScoped<IUserService, UserService>();
            services.AddScoped<ITokenService, JwtTokenService>();
        
            return services;
        }

        /// <summary>
        /// Add database logging services to the service collection.
        /// </summary>
        IServiceCollection AddDbLogger()
        {
            services.AddOptions<DbLoggerOptions>().BindConfiguration(nameof(DbLoggerOptions));
        
            services.AddSingleton<DatabaseLogChannel>();
            services.AddSingleton<ILoggerProvider, DatabaseLoggerProvider>();
            services.AddScoped<ILogRepository, LogRepository>();
            services.AddHostedService<LogProcessingBackgroundService>();
        
            return services;
        }

        /// <summary>
        /// Add redis caching services to the service collection.
        /// </summary>
        IServiceCollection AddRedisCache(IConfiguration config)
        {
            services.AddOptions<RedisOptions>().Bind(config.GetSection(nameof(RedisOptions)));

            // Register Redis services
            services.AddStackExchangeRedisCache(options =>
            {
                var serviceProvider = services.BuildServiceProvider();
                var redisOptions = serviceProvider.GetRequiredService<IOptionsMonitor<RedisOptions>>();
                options.Configuration = redisOptions.CurrentValue.ConnectionString;
                options.InstanceName = "PublicQ";
                serviceProvider.Dispose();
            });
        
            services.AddSingleton<IConnectionMultiplexer>(sp =>
            {
                var redisOptions = sp.GetRequiredService<IOptionsMonitor<RedisOptions>>();
                var redisConfig = new ConfigurationOptions
                {
                    AbortOnConnectFail = redisOptions.CurrentValue.AbortOnConnectFail,
                    EndPoints = { redisOptions.CurrentValue.ConnectionString }
                };
            
                return ConnectionMultiplexer.Connect(redisConfig);
            });
        
            services.AddScoped<ICacheService, RedisCacheService>();

            return services;
        }

        /// <summary>
        /// Wires up a service with a caching decorator.
        /// </summary>
        IServiceCollection AddCachedService<TInterface, TImplementation>()
            where TInterface : class
            where TImplementation : class, TInterface
        {
            services.AddScoped<TImplementation>();
            services.AddScoped<TInterface>(provider =>
            {
                var implementation = provider.GetRequiredService<TImplementation>();
                var cacheService = provider.GetRequiredService<ICacheService>();
                var redisOptions = provider.GetRequiredService<IOptionsMonitor<RedisOptions>>();
                var logger = provider.GetRequiredService<ILogger<CachingDecorator<TInterface>>>();

                return CachingDecorator<TInterface>.Create(
                    implementation, 
                    cacheService, 
                    redisOptions, 
                    logger);
            });

            return services;
        }
    }
}