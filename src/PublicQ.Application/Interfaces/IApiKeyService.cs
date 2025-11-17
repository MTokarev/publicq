using PublicQ.Application.Models;

namespace PublicQ.Application.Interfaces;

/// <summary>
/// API Key Service Interface
/// </summary>
public interface IApiKeyService
{
    /// <summary>
    /// Check if the provided API key is valid
    /// </summary>
    /// <param name="apiKey">Api key to validate</param>
    /// <returns>Returns <see cref="Response{TStatus}"/></returns>
    Response<bool, GenericOperationStatuses> ValidateKey(string apiKey);
}