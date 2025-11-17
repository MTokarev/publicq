using System.Threading.Channels;
using Microsoft.IdentityModel.Abstractions;
using PublicQ.Application.Models;

namespace PublicQ.Infrastructure;

/// <summary>
/// Database log channel for asynchronous log processing.
/// </summary>
public class DatabaseLogChannel
{
    private readonly Channel<LogEntryDto> _channel;
    private readonly ChannelWriter<LogEntryDto> _writer;
    private readonly ChannelReader<LogEntryDto> _reader;
    
    public DatabaseLogChannel(int capacity = 1000)
    {
        var options =  new BoundedChannelOptions(capacity)
        {
            FullMode = BoundedChannelFullMode.Wait,
            AllowSynchronousContinuations = false
        };
        
        _channel = Channel.CreateBounded<LogEntryDto>(options);
        _writer = _channel.Writer;
        _reader = _channel.Reader;
    }
    
    /// <summary>
    /// Writer for adding log entries to the channel.
    /// </summary>
    public ChannelWriter<LogEntryDto> Writer => _writer;
    
    /// <summary>
    /// Reader for consuming log entries from the channel.
    /// </summary>
    public ChannelReader<LogEntryDto> Reader => _reader;

    /// <summary>
    /// Tries to write a log entry to the channel.
    /// </summary>
    /// <param name="logEntry"><see cref="LogEntry"/></param>
    /// <returns></returns>
    public bool TryWrite(LogEntryDto logEntry) => _writer.TryWrite(logEntry);
    
    /// <summary>
    /// Completes the writer side of the channel, indicating no more log entries will be added.
    /// </summary>
    public void Complete() => _writer.Complete();
}