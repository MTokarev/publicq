namespace PublicQ.Application.Models;

/// <summary>
/// Paginated response model
/// </summary>
/// <typeparam name="T">Data type</typeparam>
public class PaginatedResponse<T>
    where T : class
{
    /// <summary>
    /// Data collection for the paginated response.
    /// </summary>
    public List<T> Data { get; init; } = [];
    
    /// <summary>
    /// Returns the total count of items in the collection.
    /// </summary>
    public long TotalCount { get; set; }
    
    /// <summary>
    /// PageSize
    /// </summary>
    public int PageSize { get; set; }
    
    /// <summary>
    /// PageNumber
    /// </summary>
    public int PageNumber { get; set; }
    
    /// <summary>
    /// TotalPages
    /// </summary>
    public int TotalPages => PageSize > 0 
        ? (int)Math.Ceiling((double)TotalCount / PageSize) 
        : 0;
    
    /// <summary>
    /// Result has next page or not.
    /// </summary>
    public bool HasNext => PageNumber < TotalPages;
    
    /// <summary>
    /// Result has previous page or not.
    /// </summary>
    public bool HasPrevious => PageNumber > 1;
}