using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using PublicQ.Application.Interfaces;
using PublicQ.Application.Models;
using PublicQ.Infrastructure.Options;
using PublicQ.Infrastructure.Persistence;
using PublicQ.Infrastructure.Persistence.Entities;
using PublicQ.Shared;

namespace PublicQ.Infrastructure;

public class LogRepository(
    ApplicationDbContext dbContext, 
    IOptionsMonitor<DbLoggerOptions> options) : ILogRepository
{
    /// <summary>
    /// Default maximum page size for log queries.
    /// </summary>
    private const int MaxPageSize = 10;

    /// <inheritdoc cref="ILogRepository.WriteLogsAsync"/>
    public async Task<Response<GenericOperationStatuses>> WriteLogsAsync(
        IEnumerable<LogEntryDto> logEntries, 
        CancellationToken cancellationToken = default)
    {
        var entities = logEntries.Select(dto => new LogEntryEntity
        {
            Timestamp = dto.Timestamp,
            Level = dto.Level,
            Category = dto.Category,
            Message = dto.Message,
            Exception = dto.Exception,
            UserId = dto.UserId,
            UserEmail = dto.UserEmail?.ToUpperInvariant(),
            RequestId = dto.RequestId
        });

        dbContext.LogEntries.AddRange(entities);
        await dbContext.SaveChangesAsync(cancellationToken);
        
        return Response<GenericOperationStatuses>.Success(GenericOperationStatuses.Completed);
    }

    /// <inheritdoc cref="ILogRepository.GetLogsAsync"/>
    public async Task<Response<PaginatedResponse<LogEntryDto>, GenericOperationStatuses>> GetLogsAsync(
        LogFilter? filter,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        Guard.AgainstNull(filter, nameof(filter));

        if (pageNumber <= 0)
        {
            pageNumber = 1;
        }

        if (pageSize <= 0)
        {
            pageSize = MaxPageSize;
        }
        
        if (pageSize > options.CurrentValue.MaxPageSize)
        {
            pageSize = options.CurrentValue.MaxPageSize;
        }

        var query = BuildQuery(filter);

        var totalCount = await query.LongCountAsync(cancellationToken);

        var result = await query
            .OrderByDescending(x => x.Timestamp)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var paginatedResponse = new PaginatedResponse<LogEntryDto>
        {
            Data = result.Select(e => e.ConvertToDto()).ToList(),
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };

        return Response<PaginatedResponse<LogEntryDto>, GenericOperationStatuses>.Success(
            paginatedResponse,
            GenericOperationStatuses.Completed);
    }

    /// <inheritdoc cref="ILogRepository.ExportLogsAsync"/>
    public async Task<Response<IList<LogEntryDto>, GenericOperationStatuses>> ExportLogsAsync(
        LogFilter? filter, 
        CancellationToken cancellationToken)
    {
        var query = BuildQuery(filter);
        var result = await query
            .OrderByDescending(x => x.Timestamp)
            .Select(e => e.ConvertToDto())
            .ToListAsync(cancellationToken);
        
        return Response<IList<LogEntryDto>, GenericOperationStatuses>.Success(
            result,
            GenericOperationStatuses.Completed);
    }

    /// <inheritdoc cref="ILogRepository.GetLogCountAsync"/>
    public async Task<Response<long, GenericOperationStatuses>> GetLogCountAsync(LogFilter? filter,
        CancellationToken cancellationToken = default)
    {
        Guard.AgainstNull(filter, nameof(filter));

        var query = BuildQuery(filter);
        var totalCount = await query.LongCountAsync(cancellationToken);

        return Response<long, GenericOperationStatuses>.Success(
            totalCount,
            GenericOperationStatuses.Completed);
    }

    public async Task<Response<GenericOperationStatuses>> DeleteOldLogsAsync(
        DateTime olderThan,
        CancellationToken cancellationToken = default)
    {
        await dbContext.LogEntries
            .Where(x => x.Timestamp < olderThan)
            .ExecuteDeleteAsync(cancellationToken);
        
        return Response<GenericOperationStatuses>.Success(GenericOperationStatuses.Completed);
    }

    /// <summary>
    /// Build the query based on the provided filter.
    /// </summary>
    /// <param name="filter">Optional: <see cref="LogFilter"/></param>
    /// <returns>Returns query with all filter parameters</returns>
    private IQueryable<LogEntryEntity> BuildQuery(LogFilter? filter)
    {
        var query = dbContext.LogEntries
            .AsNoTracking()
            .AsQueryable();

        if (filter is null)
        {
            return query;
        }

        if (!string.IsNullOrWhiteSpace(filter.MessageContains))
        {
            query = query.Where(x => EF.Functions.Like(x.Message, $"%{filter.MessageContains}%"));
        }

        if (filter.Level != null)
        {
            query = query.Where(x => x.Level == filter.Level);
        }

        if (filter.Category != null)
        {
            query = query.Where(x => x.Category == filter.Category);
        }

        if (filter.UserId != null)
        {
            query = query.Where(x => x.UserId == filter.UserId);
        }
        
        if (filter.UserEmail != null)
        {
            query = query.Where(x => x.UserEmail != null && x.UserEmail.Contains(filter.UserEmail.ToUpperInvariant()));
        }


        if (filter.RequestId != null)
        {
            query = query.Where(x => x.RequestId == filter.RequestId);
        }

        if (filter.FromDate.HasValue)
        {
            query = query.Where(x => x.Timestamp >= filter.FromDate.Value);
        }

        if (filter.ToDate.HasValue)
        {
            query = query.Where(x => x.Timestamp <= filter.ToDate.Value);
        }

        return query;
    }
}