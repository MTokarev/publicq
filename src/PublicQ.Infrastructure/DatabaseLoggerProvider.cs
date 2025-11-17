using System.Collections.Concurrent;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using PublicQ.Infrastructure.Options;

namespace PublicQ.Infrastructure;

/// <summary>
/// Database logger provider that creates <see cref="DatabaseLogger"/> instances.
/// </summary>
/// <param name="channel">Database log channel <see cref="DatabaseLogChannel"/></param>
/// <param name="provider"><see cref="IServiceProvider"/></param>
public class DatabaseLoggerProvider(
    DatabaseLogChannel channel, 
    IServiceProvider provider,
    IOptionsMonitor<DbLoggerOptions> options) : ILoggerProvider
{
    private readonly ConcurrentDictionary<string, DatabaseLogger> _loggers = new();
    private bool _disposed = false;

    /// <summary>
    /// Disposes the logger provider and its resources.
    /// </summary>
    public void Dispose()
    {
        if (!_disposed)
        {
            _disposed = true;
            _loggers.Clear();
            _disposed = true;
        }
    }

    /// <inheritdoc cref ="ILoggerProvider.CreateLogger"/>
    public ILogger CreateLogger(string categoryName)
    {
        return _loggers.GetOrAdd(categoryName, name => new DatabaseLogger(name, channel, provider, options));
    }
}