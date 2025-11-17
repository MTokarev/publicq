using System.ComponentModel.DataAnnotations;

namespace PublicQ.Infrastructure.Entities;

/// <summary>
/// Represents system setting class in the database
/// </summary>
public class SystemSettings
{
    [Key]
    public string Name { get; set; } = default!;
    public string? Value { get; set; }

    /// <summary>
    /// Default constructor required for Entity Framework
    /// </summary>
    public SystemSettings() {} // Required for EF

    /// <summary>
    /// Constructor with name and value parameters
    /// </summary>
    /// <param name="name">The setting name</param>
    /// <param name="value">The setting value</param>
    public SystemSettings(string name, string? value)
    {
        Name = name;
        Value = value;
    }
}