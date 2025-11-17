using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using PublicQ.Application.Interfaces;
using PublicQ.Application.Models;
using PublicQ.Infrastructure.Options;
using PublicQ.Infrastructure.Persistence;

namespace PublicQ.Infrastructure.Services;

/// <summary>
/// <see cref="IApplicationInitializer"/>
/// </summary>
public class ApplicationInitializer(
    EntityConfigurationProvider configProvider, 
    ApplicationDbContext dbContext, 
    IOptionsMonitor<InitialSetupOptions> initialSetupOptions, 
    IOptionsMonitor<FileStorageOptions> fileStorageOptions, 
    ILogger<ApplicationInitializer> logger) 
    : IApplicationInitializer
{
    private readonly EntityConfigurationProvider _configProvider = configProvider;
    private readonly ApplicationDbContext _dbContext = dbContext;
    private readonly IOptionsMonitor<InitialSetupOptions> _initialSetupOptions = initialSetupOptions;
    private readonly IOptionsMonitor<FileStorageOptions> _fileStorageOptions  = fileStorageOptions;
    private readonly ILogger<ApplicationInitializer> _logger = logger;
    
    /// <summary>
    /// <see cref="IApplicationInitializer"/>
    /// </summary>
    public async Task<Response<GenericOperationStatuses>> InitializeAsync(CancellationToken cancellationToken)
    {
        // Check if database exists end create it if it doesn't
        try
        {
            await _dbContext.Database.EnsureCreatedAsync(cancellationToken);
        }
        catch (Exception ex) // We need to catch all exceptions since this is a critical area
        {
            _logger.LogCritical(ex, "Failed to ensure database creation: {Message}", ex.Message);
            return Response<GenericOperationStatuses>.Failure(GenericOperationStatuses.Failed, $"Failed to ensure database creation: '{ex.Message}'.");
        }
        
        var folderPath = Path.Combine(_fileStorageOptions.CurrentValue.StaticContentPath);
        if (!Directory.Exists(folderPath))
        {
            Directory.CreateDirectory(folderPath);
        }
        
        if (initialSetupOptions.CurrentValue.IsInitialized)
        {
            _logger.LogWarning("Attempting to initialize the application, but it is already initialized.");
            return Response<GenericOperationStatuses>.Success(GenericOperationStatuses.Failed, "Already initialized, skipping...");
        }
        
        _configProvider.Set($"{nameof(InitialSetupOptions)}:{nameof(InitialSetupOptions.IsInitialized)}", "true");
        _logger.LogInformation("Application initialized successfully.");

        
        
        return Response<GenericOperationStatuses>.Success(GenericOperationStatuses.Completed, "Initialization completed successfully.");
    }
}