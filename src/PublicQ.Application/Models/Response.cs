namespace PublicQ.Application.Models;

/// <summary>
/// Generic class that represents a response model.
/// </summary>
/// <param name="status">Operation status</param>
/// <param name="message">Message to return</param>
/// <param name="errors">Optional: A list of errors</param>
/// <typeparam name="TStatus">Status to store</typeparam>
public class Response<TStatus>(TStatus status, string message, IList<string>? errors = default)
    where TStatus : Enum
{
    /// <summary>
    /// Array of errors to return.
    /// </summary>
    public IList<string> Errors { get; } = errors ?? new List<string>();
    
    /// <summary>
    /// Response status.
    /// </summary>
    public TStatus Status { get; } = status;
    
    /// <summary>
    /// Response message.
    /// </summary>
    public string Message { get; } = message;
    
    /// <summary>
    /// Validates if the response is successful.
    /// </summary>
    public bool IsSuccess => !Errors.Any();
    
    /// <summary>
    /// Validates if the response is a failure.
    /// </summary>
    public bool IsFailed => Errors.Any();

    /// <summary>
    /// Helper method to instantiate a response with success status.
    /// </summary>
    /// <param name="status">Operation status</param>
    /// <param name="message">Operation message.</param>
    /// <returns>Returns response model with operation status</returns>
    public static Response<TStatus> Success(TStatus status, string? message = default)
    {
        message ??= $"Operation has been completed with '{status}' status.";
        return new Response<TStatus>(status, message);
    }
    
    /// <summary>
    /// Initialize a response with failure status.
    /// </summary>
    /// <param name="status">Status to return</param>
    /// <param name="message">Operation message</param>
    /// <param name="errors">Optional: Errors to return. Defaults to a list containing the message as the only item.</param>
    /// <returns>Returns a response model <see cref="Response{TData,TStatus}"/></returns>
    public static Response<TStatus> Failure(TStatus status, string message, IList<string>? errors = default)
    {
        if (errors is null or { Count: 0 })
        {
            errors = new List<string> { message };
        }
        return new Response<TStatus>(status, message, errors);
    }
}

/// <summary>
/// Generic class that represents a response model.
/// </summary>
/// <param name="data">Data to hold</param>
/// <param name="status">Operation status</param>
/// <param name="message">Message to return</param>
/// <param name="errors">Optional: A list of errors</param>
/// <typeparam name="TData">Data to store</typeparam>
/// <typeparam name="TStatus">Status to store</typeparam>
public class Response<TData, TStatus>(TData? data, TStatus status, string message, IList<string>? errors = default)
    : Response<TStatus>(status, message, errors) where TStatus : Enum
{
    /// <summary>
    /// Data to return.
    /// </summary>
    public TData? Data { get; } = data;
    
    
    /// <summary>
    /// Initialize a response with success status.
    /// </summary>
    /// <param name="data">Data to store</param>
    /// <param name="status">Status to return</param>
    /// <param name="message">Options: Operation message.</param>
    /// <returns>Returns a response model</returns>
    public static Response<TData, TStatus> Success(TData data, TStatus status, string? message = default)
    {
        message ??= $"Operation has been completed with '{status}' status.";
        return new Response<TData, TStatus>(data, status, message);
    }
    
    /// <summary>
    /// Initialize a response with failure status.
    /// </summary>
    /// <param name="status">Status to return</param>
    /// <param name="message">Operation message</param>
    /// <param name="errors">Optional: Errors to return. Defaults to a list containing the message as the only item.</param>
    /// <returns>Returns a response model</returns>
    public static new Response<TData, TStatus> Failure(TStatus status, string message, IList<string>? errors = default)
    {
        if (errors is null or { Count: 0 })
        {
            errors = new List<string> { message };
        }
        return new Response<TData, TStatus>(default, status, message, errors);
    }
}