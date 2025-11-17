using PublicQ.Shared.Enums;

namespace PublicQ.Infrastructure.Entities;


/// <summary>
/// Configuration entity in the database.
/// </summary>
public class ConfigurationEntity
{
    /// <summary>
    /// Identifier of the configuration entity.
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Configuration Type
    /// </summary>
    public UserConfigTypes Type { get; set; }

    /// <summary>
    /// Serialized JSON data of the configuration.
    /// </summary>
    public string DataJson { get; set; } = string.Empty;
}
