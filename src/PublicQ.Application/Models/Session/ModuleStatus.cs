using PublicQ.Application.Models.Group;

namespace PublicQ.Application.Models.Session;

/// <summary>
/// Represents the status of a module within a group context.
/// </summary>
public enum ModuleStatus
{
    /// <summary>
    /// Locked indicates that the module is not accessible to the user.
    /// It may be locked due to group settings, such as module order enforcement.
    /// <see cref="GroupBaseDto.IsMemberOrderLocked"/>
    /// </summary>
    Locked,
    
    /// <summary>
    /// This status indicates that the user has completed the module but is waiting for time to run out
    /// <seealso cref="GroupBaseDto.WaitModuleCompletion"/>
    /// </summary>
    WaitForModuleDurationToElapse,
    
    /// <summary>
    /// Indicates that the module is scheduled to be available in the future.
    /// </summary>
    Scheduled,
    
    /// <summary>
    /// NotStarted indicates that the user has not yet started the module.
    /// </summary>
    NotStarted,
    
    /// <summary>
    /// InProgress indicates that the user has started but not yet completed the module.
    /// This is true when the module progress has been initiated but not marked as HasStarted.
    /// </summary>
    InProgress,
    
    /// <summary>
    /// Indicates that the user has completed the module.
    /// This is true when the module progress has CompletedAtUtc property set.
    /// </summary>
    Completed,
    
    /// <summary>
    /// When the module duration has elapsed, but the user has not completed the module.
    /// </summary>
    TimeElapsed
}