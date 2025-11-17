using PublicQ.Application.Models;

namespace PublicQ.Application.Interfaces;

/// <summary>
/// Interface for log repository operations.
/// </summary>
public interface ILogRepository
{
    /// <summary>
    /// Writes a collection of log entries to the log repository.
    /// </summary>
    /// <param name="logEntries">Array of <see cref="LogEntryDto"/></param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns <see cref="GenericOperationStatuses"/> wrapped into <see cref="Response{TStatus}"/></returns>
    Task<Response<GenericOperationStatuses>> WriteLogsAsync(
        IEnumerable<LogEntryDto> logEntries,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets log entries based on the provided filter and pagination parameters.
    /// </summary>
    /// <param name="filter">Optional: <see cref="LogFilter"/></param>
    /// <param name="pageNumber">Page number</param>
    /// <param name="pageSize">Page size</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns <see cref="PaginatedResponse{T}"/> wrapped into <see cref="Response{TData, TStatus}"/></returns>
    Task<Response<PaginatedResponse<LogEntryDto>, GenericOperationStatuses>> GetLogsAsync(
        LogFilter? filter,
        int pageNumber = 1,
        int pageSize = 10,
        CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Exports log entries based on the provided filter.
    /// </summary>
    /// <param name="filter">Optional: <see cref="LogFilter"/></param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns <see cref="IList{T}"/> wrapped into <see cref="Response{TData, TStatus}"/></returns>
    Task<Response<IList<LogEntryDto>, GenericOperationStatuses>> ExportLogsAsync(
        LogFilter? filter,
        CancellationToken cancellationToken);

    /// <summary>
    /// Counts log entries based on the provided filter.
    /// </summary>
    /// <param name="filter">Optional: <see cref="LogFilter"/></param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns <see cref="GenericOperationStatuses"/> wrapped into <see cref="Response{TStatus}"/></returns>
    Task<Response<long, GenericOperationStatuses>> GetLogCountAsync(
        LogFilter? filter,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Deletes log entries older than the specified date.
    /// </summary>
    /// <param name="olderThan">Delete log records older than</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns <see cref="GenericOperationStatuses"/> wrapped into <see cref="Response{TStatus}"/></returns>
    Task<Response<GenericOperationStatuses>> DeleteOldLogsAsync(DateTime olderThan,
        CancellationToken cancellationToken = default);
}