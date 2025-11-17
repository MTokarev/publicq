namespace PublicQ.Application.Exceptions;

/// <summary>
/// Exception thrown when the password configuration cannot be loaded.
/// </summary>
/// <param name="message">Optional: Exception message.</param>
/// <param name="innerException">Optional: Inner exception.</param>
public class UnableToLoadPasswordConfigurationException(string? message, Exception? innerException)
    : Exception(message, innerException);