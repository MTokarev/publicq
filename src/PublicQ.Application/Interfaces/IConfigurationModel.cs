using System.Runtime.Serialization;
using PublicQ.Shared.Enums;

namespace PublicQ.Application.Models;

/// <summary>
/// Interface for configuration model constrains
/// </summary>
public interface IConfigurationModel
{
    /// <summary>
    /// Configuration type of the model.
    /// </summary>
    [IgnoreDataMember]
    public UserConfigTypes UserConfigType { get; }
}