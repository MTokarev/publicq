// Keep this enum synced with the same enum class in C# on the backed
export enum GenericOperationStatuses {
  NotStarted = "NotStarted",
  InProgress = "InProgress",
  Completed = "Completed",
  Failed = "Failed",
  Cancelled = "Cancelled",
  NotFound = "NotFound",
  Conflict = "Conflict",
  Unauthorized = "Unauthorized",
  BadRequest = "BadRequest"
}