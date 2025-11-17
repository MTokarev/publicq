using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using PublicQ.Infrastructure.Persistence;

namespace PublicQ.Infrastructure;

/// <summary>
/// Entity configuration provider.
/// </summary>
/// <param name="dbContext"><see cref="ApplicationDbContext"/></param>
public sealed class EntityConfigurationProvider(
    ApplicationDbContext dbContext)
    : ConfigurationProvider
{
    /// <summary>
    /// Loads the configuration from the database.
    /// </summary>
    public override void Load()
    {
        Data = dbContext.SystemSettings
            .AsNoTracking()
            .ToDictionary(
                static c => c.Name,
                static c => c.Value, StringComparer.OrdinalIgnoreCase);
    }

    /// <summary>
    /// Sets a configuration value and persists it to the database.
    /// </summary>
    /// <param name="key">Configuration Key</param>
    /// <param name="value">Configuration value</param>
    public override void Set(string key, string? value)
    {
        // Update in-memory
        base.Set(key, value);

        // Persist to the database
        var setting = dbContext.SystemSettings
            .FirstOrDefault(s => s.Name == key);
        if (setting is not null)
        {
            setting.Value = value;
        }
        else
        {
            dbContext.SystemSettings.Add(new Entities.SystemSettings(key, value));
        }

        dbContext.SaveChanges();

        // Clear the change tracker to avoid tracking conflicts
        dbContext.ChangeTracker.Clear();
        
        // Notify listeners
        Load();
        OnReload();
    }

    /// <summary>
    /// This method is called to clear out all settings with the given prefix.
    /// </summary>
    /// <remarks>
    /// It will not raise the reload token.
    /// </remarks>
    /// <param name="prefix">Configuration prefix</param>
    /// <param name="cancellationToken">Cancellation token</param>
    public async Task CleanAsync(string prefix, CancellationToken cancellationToken)
    {
        await dbContext.SystemSettings
            .AsNoTracking()
            .Where(s => s.Name.StartsWith(prefix))
            .ExecuteDeleteAsync(cancellationToken);
    }

    /// <summary>
    /// Begins a database transaction for configuration operations
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Database transaction</returns>
    public async Task<Microsoft.EntityFrameworkCore.Storage.IDbContextTransaction> BeginTransactionAsync(
        CancellationToken cancellationToken = default)
    {
        return await dbContext.Database.BeginTransactionAsync(cancellationToken);
    }
}