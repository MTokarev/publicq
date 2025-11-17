using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using PublicQ.Application.Models;
using PublicQ.Infrastructure.Options;
using LogLevel = Microsoft.Extensions.Logging.LogLevel;

namespace PublicQ.Infrastructure;

/// <summary>
/// Database logger that writes log entries to a channel for asynchronous processing.
/// </summary>
public class DatabaseLogger(
    string categoryName,
    DatabaseLogChannel channel,
    IServiceProvider serviceProvider,
    IOptionsMonitor<DbLoggerOptions> options) : ILogger
{
    public void Log<TState>(
        LogLevel logLevel,
        EventId eventId,
        TState state, Exception? exception,
        Func<TState, Exception?, string> formatter)
    {
        // Check if logging is enabled for this level
        if (!IsEnabled(logLevel))
        {
            return;
        }

        try
        {
            var httpContextAccessor = serviceProvider.GetService<IHttpContextAccessor>();
            var httpContext = httpContextAccessor?.HttpContext;

            var logEntry = new LogEntryDto
            {
                Timestamp = DateTime.UtcNow,
                Level = logLevel.ToString(),
                Category = categoryName,
                Message = formatter(state, exception),
                Exception = exception?.ToString(),
                UserId = httpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value,
                UserEmail = httpContext?.User?.FindFirst(ClaimTypes.Email)?.Value,
                RequestId = httpContext?.TraceIdentifier,
                MachineName = Environment.MachineName
            };

            // Non-blocking write - if channel is full, drop the log
            if (!channel.TryWrite(logEntry))
            {
                // Could optionally count dropped logs for monitoring
                System.Diagnostics.Debug.WriteLine($"Database log channel full, dropped log: {logEntry.Message}");
            }
        }
        catch (Exception ex)
        {
            // Never throw from logging - could write to debug output or event log
            System.Diagnostics.Debug.WriteLine($"Failed to write database log: {ex.Message}");
        }
    }

    /// <summary>
    /// Check if logging is enabled based on options and custom filtering.
    /// </summary>
    /// <param name="logLevel"><see cref="LogLevel"/></param>
    /// <returns>True if enabled, otherwise, false.</returns>
    public bool IsEnabled(LogLevel logLevel)
    {
        if (!options.CurrentValue.Enabled)
        {
            return false;
        }
        
        if (logLevel < options.CurrentValue.LogLevel)
        {
            return false;
        }

        return ApplyCustomFiltering(logLevel);
    }
    
    /// <summary>
    /// We don't use scopes in this logger, so return a no-op disposable.
    /// </summary>
    public IDisposable? BeginScope<TState>(TState state) where TState : notnull
    {
        return NullScope.Instance;
    }

    /// <summary>
    /// Filter out logs from noisy categories and below Information level.
    /// </summary>
    /// <param name="logLevel"><see cref="LogLevel"/></param>
    /// <returns>Returns True if it is allowed. Otherwise, false.</returns>
    private bool ApplyCustomFiltering(LogLevel logLevel)
    {
        if (options.CurrentValue.ExcludedCategories.Any(e =>
                categoryName.StartsWith(e, StringComparison.CurrentCultureIgnoreCase)))
        {
            return false;
        }
        
        // Block our own logging services to prevent loops
        if (categoryName.Contains("LogProcessing") ||
            categoryName.Contains("DatabaseLogger") ||
            categoryName.Contains("LogRepository"))
        {
            return false;
        }

        return true;
    }

    private sealed class NullScope : IDisposable
    {
        public static NullScope Instance { get; } = new();

        public void Dispose()
        {
        }
    }
}