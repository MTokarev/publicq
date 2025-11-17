using PublicQ.Application.Interfaces;
using PublicQ.Application.Models;
using PublicQ.Shared;

namespace PublicQ.API.Middleware;

/// <summary>
/// Mcp API Key Middleware
/// </summary>
public class McpApiKeyMiddleware(ILogger<McpApiKeyMiddleware> logger, RequestDelegate next)
{
    /// <summary>
    /// Invoke Async
    /// </summary>
    public async Task InvokeAsync(
        HttpContext context,
        IApiKeyService apiKeyService)
    {
        // Only apply to /mcp endpoint
        if (!context.Request.Path.StartsWithSegments("/mcp"))
        {
            await next(context);
            return;
        }

        // Every tool calls should be authenticated via user identity first
        // If authenticated, skip API key check
        // Inside the tool call the user identity will be used for authorization
        if (context.User.Identity?.IsAuthenticated == true)
        {
            logger.LogDebug("MCP request authenticated via user identity, skipping API key check.");
            await next(context);
            return;
        }
        
        // Check for API key header
        var apiKey = context.Request.Headers[Constants.ApiHeaderName].FirstOrDefault();
        
        if (string.IsNullOrEmpty(apiKey))
        {
            logger.LogWarning("MCP request rejected: Missing {HeaderName} header", Constants.ApiHeaderName);
            context.Response.StatusCode = 401;
            await context.Response.WriteAsJsonAsync(Response<GenericOperationStatuses>.Failure(GenericOperationStatuses.BadRequest,
                $"Missing required header: {Constants.ApiHeaderName}"));
            return;
        }
        
        // Validate API key
        var response = apiKeyService.ValidateKey(apiKey);
        
        if (!response.Data)
        {
            logger.LogWarning("MCP request failed: Invalid API key");
            context.Response.StatusCode = 401;
            await context.Response.WriteAsJsonAsync(response);
            return;
        }

        // Continue pipeline
        await next(context);
    }
}