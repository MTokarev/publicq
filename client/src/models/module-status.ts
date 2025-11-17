/**
 * Represents the status of a module within a group context.
 */
export enum ModuleStatus {
  /**
   * Locked indicates that the module is not accessible to the user.
   * It may be locked due to group settings, such as module order enforcement.
   * See: Group.IsMemberOrderLocked
   */
  Locked = 0,

  /**
   * This status indicates that the user has completed the module but is waiting for time to run out
   */
  WaitForModuleDurationToElapse = 1,

  /**
   * Indicates that the module is scheduled to be available in the future.
   */
  Scheduled = 2,

  /**
   * NotStarted indicates that the user has not yet started the module.
   */
  NotStarted = 3,

  /**
   * InProgress indicates that the user has started but not yet completed the module.
   * This is true when the module progress has been initiated but not marked as HasStarted.
   */
  InProgress = 4,

  /**
   * Indicates that the user has completed the module.
   * This is true when the module progress has CompletedAtUtc property set.
   */
  Completed = 5,

  /**
   * When the module duration has elapsed, but the user has not completed the module.
   */
  TimeElapsed = 6
}