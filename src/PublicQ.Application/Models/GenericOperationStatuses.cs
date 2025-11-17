namespace PublicQ.Application.Models;

/// <summary>
/// Represents the status of a generic operation.
/// </summary>
public enum GenericOperationStatuses
{
    /// <summary>
    /// Not started yet.
    /// </summary>
    NotStarted,
    
    /// <summary>
    /// In progress.
    /// </summary>
    InProgress,
    
    /// <summary>
    /// Not allowed.
    /// </summary>
    NotAllowed,
    
    /// <summary>
    /// Completed successfully.
    /// </summary>
    Completed,
    
    /// <summary>
    /// Partially completed with some issues.
    /// </summary>
    PartiallyCompleted,
    
    /// <summary>
    /// Failed to complete.
    /// </summary>
    Failed,
    
    /// <summary>
    /// Forbidden access.
    /// </summary>
    Forbidden,
    
    /// <summary>
    /// Canceled by the user or system.
    /// </summary>
    Cancelled,  
    
    /// <summary>
    /// Not found.
    /// </summary>
    NotFound,
    
    /// <summary>
    /// Conflict occurred, such as when trying to create a resource that already exists.
    /// </summary>
    Conflict,
    
    /// <summary>
    /// Unauthorized access, such as when the user does not have permission to perform the operation.
    /// </summary>
    Unauthorized,
    
    /// <summary>
    /// Bad request, such as when the input data is invalid or malformed.
    /// </summary>
    BadRequest,
    
    /// <summary>
    /// Indicates that the requested feature is not available or supported in the current context.
    /// </summary>
    FeatureIsNotAvailable,
}