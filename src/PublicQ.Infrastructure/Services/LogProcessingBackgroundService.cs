using System.Runtime.CompilerServices;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using PublicQ.Application.Interfaces;
using PublicQ.Application.Models;
using PublicQ.Infrastructure.Options;

namespace PublicQ.Infrastructure.Services;

/// <summary>
/// Background service for processing log entries from the channel and storing them in the database.
/// </summary>
public class LogProcessingBackgroundService(
    DatabaseLogChannel channel,
    IServiceProvider serviceProvider,
    ILogger<LogProcessingBackgroundService> logger,
    int batchSize = 100) : BackgroundService
{
    /// <summary>
    /// Last time cleanup was performed.
    /// </summary>
    private DateTime _lastCleanup = DateTime.UtcNow;
    
    /// <summary>
    /// Cleanup interval.
    /// </summary>
    private readonly TimeSpan _cleanupInterval = TimeSpan.FromHours(24); 

    /// <inheritdoc cref="BackgroundService.ExecuteAsync"/>
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("Database Log Processing Service started");
        
        try
        {
            // Create tasks for processing logs and periodic cleanup
            var logProcessingTask = ProcessLogsAsync(stoppingToken);
            var cleanupTask = RunPeriodicCleanupAsync(stoppingToken);
    
            // Wait for both tasks to complete (they run until cancellation)
            await Task.WhenAll(logProcessingTask, cleanupTask);
        
        }
        catch (OperationCanceledException)
        {
            // Expected during shutdown
        }
        catch (Exception ex)
        {
            logger.LogCritical(ex, "Critical error in database backGround log processing service");
        }
        finally
        {
            logger.LogInformation("Database BackGround Log Processing Service stopped");
        }
    }
    
    /// <inheritdoc cref="BackgroundService.StopAsync"/>
    public override async Task StopAsync(CancellationToken cancellationToken)
    {
        logger.LogInformation("Database BackGround Log Processing Service stopping, processing remaining logs...");

        // Complete the channel (no more writes)
        channel.Complete();

        // Process remaining logs
        var processed = 0;
        await foreach (var batch in ReadBatchesAsync(cancellationToken))
        {
            await ProcessLogBatch(batch, cancellationToken);
            processed += batch.Count;
        }

        if (processed > 0)
        {
            logger.LogInformation("Processed {ProcessedCount} remaining logs during shutdown", processed);
        }

        await base.StopAsync(cancellationToken);
    }

    /// <summary>
    /// Process log entries from the channel in batches.
    /// </summary>
    /// <param name="stoppingToken">Cancellation token</param>
    private async Task ProcessLogsAsync(CancellationToken stoppingToken)
    {
        await foreach (var batch in ReadBatchesAsync(stoppingToken))
        {
            await ProcessLogBatch(batch, stoppingToken);
        }
    }
    
    /// <summary>
    /// Run periodic cleanup of old logs based on retention policy.
    /// </summary>
    /// <param name="stoppingToken">Cancellation token</param>
    private async Task RunPeriodicCleanupAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            await PerformLogCleanup(stoppingToken);
            await Task.Delay(_cleanupInterval, stoppingToken);
        }
    }
    
    /// <summary>
    /// Reads log entries from the channel in batches.
    /// </summary>
    /// <param name="cancellationToken">Cancellation Token</param>
    /// <returns>Yields <see cref="List{T}"/></returns>
    private async IAsyncEnumerable<List<LogEntryDto>> ReadBatchesAsync(
        [EnumeratorCancellation] CancellationToken cancellationToken)
    {
        var reader = channel.Reader;

        while (await reader.WaitToReadAsync(cancellationToken))
        {
            var batch = new List<LogEntryDto>(batchSize);

            // Read first item (we know at least one exists)
            if (reader.TryRead(out var firstLog))
            {
                batch.Add(firstLog);

                // Try to read additional items for batching (non-blocking)
                while (batch.Count < batchSize && reader.TryRead(out var additionalLog))
                {
                    batch.Add(additionalLog);
                }

                yield return batch;
            }
        }
    }

    /// <summary>
    /// Process a batch of log entries and write them to the database.
    /// </summary>
    /// <param name="logs"><see cref="List{T}"/></param>
    /// <param name="cancellationToken">Cancellation token</param>
    private async Task ProcessLogBatch(List<LogEntryDto> logs, CancellationToken cancellationToken)
    {
        try
        {
            using var scope = serviceProvider.CreateScope();
            var logRepository = scope.ServiceProvider.GetRequiredService<ILogRepository>();

            await logRepository.WriteLogsAsync(logs, cancellationToken);
            
            // Only log this occasionally to avoid spam
            if (logs.Count > 10 || DateTime.UtcNow.Second % 30 == 0)
            {
                logger.LogDebug("Processed {LogCount} database logs", logs.Count);
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to write {LogCount} logs to database", logs.Count);
            
            // Brief delay before processing continues
            await Task.Delay(TimeSpan.FromSeconds(5), cancellationToken);
        }
    }
    
    /// <summary>
    /// Performs log cleanup based on retention policy.
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    private async Task PerformLogCleanup(CancellationToken cancellationToken)
    {
        try
        {
            using var scope = serviceProvider.CreateScope();
            var logRepository = scope.ServiceProvider.GetRequiredService<ILogRepository>();
            var logOptions = scope.ServiceProvider.GetRequiredService<IOptionsSnapshot<DbLoggerOptions>>();
            
            if (!logOptions.Value.Enabled || logOptions.Value.RetentionPeriodInDays <= 0)
            {
                return;
            }
            
            var cutoffDate = DateTime.UtcNow.AddDays(-logOptions.Value.RetentionPeriodInDays);
            var result = await logRepository.DeleteOldLogsAsync(cutoffDate, cancellationToken);
            
            if (result.IsSuccess)
            {
                logger.LogInformation("Successfully cleaned up logs older than {CutoffDate}", cutoffDate);
            }
            else
            {
                logger.LogWarning("Failed to cleanup old logs: {Status}", result.Status);
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error during log cleanup - continuing with normal processing");
            // Don't rethrow - keep processing logs even if cleanup fails
        }
    }
}