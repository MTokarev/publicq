using System.Reflection;
using System.Text.Json.Serialization;
using AspNetCoreRateLimit;
using FluentValidation;
using ModelContextProtocol.Server;
using PublicQ.API.Tools;
using PublicQ.Application.Interfaces;
using PublicQ.Infrastructure;
using PublicQ.Infrastructure.Options;
using PublicQ.Infrastructure.Services;
using IpRateLimitOptions = PublicQ.Infrastructure.Options.IpRateLimitOptions;

namespace PublicQ.API;

/// <summary>
/// Api service registration extensions
/// </summary>
public static class ServiceRegistration
{
    /// <summary>
    /// Add API services to the container
    /// </summary>
    /// <param name="services"></param>
    /// <param name="configuration"></param>
    /// <returns></returns>
    public static IServiceCollection AddApiServices(this IServiceCollection services, IConfiguration configuration)
    {
        // Add services to the container.
        // Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
        services.AddEndpointsApiExplorer();
        
        services.AddSwaggerGen(c =>
        {
            // Include API project itself and Application layer assemblies
            // App layer contains DTOs and other models with XML comments we want to include
            var assembliesWithComments = new []
            {
                Assembly.GetEntryAssembly(),
                typeof(IAssessmentService).Assembly,
            };
            foreach (var assembly in assembliesWithComments)
            {
                var xmlFile = $"{assembly!.GetName().Name}.xml";
                var directory = Path.GetDirectoryName(assembly.Location)!;
                xmlFile = Path.Combine(directory, xmlFile);
                c.IncludeXmlComments(xmlFile);
            }
        });
        
        services.AddControllers()
            .AddJsonOptions(options =>
            {
                options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
            });
        services.AddInfrastructure(configuration);
        services.AddSpaStaticFiles(config =>
        {
            config.RootPath = "../../client/build";
        });

        services.AddScoped<UploadSizeLimitFilter>();
        services.AddScoped<ITokenService, JwtTokenService>();
        services.AddValidatorsFromAssembly(typeof(Program).Assembly);

        services.AddMemoryCache();
        
        // ATTENTION: The change in the IpRateLimitOptions will NOT be picked up automatically
        //      after the application has started. This is a known limitation of the AspNetCoreRateLimit library.
        //      You will need to restart the application for changes to take effect.
        // Register both options
        // 1. Our custom options to bind configuration
        // 2. The one used by AspNetCoreRateLimit library
        // They are identical, so we can use the same configuration section for both but only those properties
        // that are defined in the IpRateLimitOptions class will be bound
        services.Configure<IpRateLimitOptions>(configuration.GetSection(nameof(IpRateLimitOptions)));
        services.Configure<AspNetCoreRateLimit.IpRateLimitOptions>(configuration.GetSection(nameof(IpRateLimitOptions)));
        services.AddInMemoryRateLimiting();
        
        services.AddSingleton<IRateLimitConfiguration, RateLimitConfiguration>();
        services.AddHttpClient();
        
        services.AddScoped<CreateQuestionTools>();
        services.AddScoped<FileUploadTools>();
        services.AddMcpServer()
            .WithHttpTransport()
            .WithToolsFromAssembly();
        
        return services;
    }
}