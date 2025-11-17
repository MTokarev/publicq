using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using PublicQ.Application.Interfaces;
using PublicQ.Application.Models;
using PublicQ.Infrastructure.Options;
using PublicQ.Shared;

namespace PublicQ.Infrastructure.Services;

/// <inheritdoc cref="IApiKeyService"/>
public class McpApiKeyService(ILogger<McpApiKeyService> logger, 
    IOptionsMonitor<McpApiKeyOptions> options) : IApiKeyService
{
    private IDictionary<string, ApiKey> apiKeys = options
        .CurrentValue
        .Keys
        .ToDictionary(x => x.Key, x => x);
    
    /// <inheritdoc cref="IApiKeyService.ValidateKey"/>
    public Response<bool, GenericOperationStatuses> ValidateKey(string apiKey)
    {
        logger.LogDebug("Validate key request received.");
        Guard.AgainstNullOrWhiteSpace(apiKey, nameof(apiKey));

        if (!options.CurrentValue.Enabled)
        {
            logger.LogDebug("API key is disabled.");
            return Response<bool, GenericOperationStatuses>.Success(
                false, 
                GenericOperationStatuses.Completed,
                "AI integration using API keys is disabled.");
        }
        
        if (apiKeys.TryGetValue(apiKey, out var key))
        {
            if (key.ValidUntilUtc.HasValue && key.ValidUntilUtc.Value.ToUniversalTime() < DateTime.UtcNow)
            {
                logger.LogDebug("API key validation failed due to expiration.");
                return Response<bool, GenericOperationStatuses>.Success(false, GenericOperationStatuses.Failed);
            }
                
            logger.LogDebug("API key validation succeeded.");
            return Response<bool, GenericOperationStatuses>.Success(true, GenericOperationStatuses.Completed);
        }
        
        logger.LogDebug("API key validation failed.");
        return Response<bool, GenericOperationStatuses>.Success(false, GenericOperationStatuses.Failed);
    }
}