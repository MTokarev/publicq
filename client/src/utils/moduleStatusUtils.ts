import { ModuleStatus } from '../models/module-status';

/**
 * Converts a string or enum value to ModuleStatus enum
 * @param status - The status value to convert
 * @returns The corresponding ModuleStatus enum value
 */
export const convertToModuleStatusEnum = (status: ModuleStatus | string): ModuleStatus => {
  if (typeof status === 'number') {
    return status as ModuleStatus;
  }
  
  // Handle string representation
  const statusStr = status as string;
  switch (statusStr) {
    case 'Locked':
    case '0':
      return ModuleStatus.Locked;
    case 'WaitForModuleDurationToElapse':
    case '1':
      return ModuleStatus.WaitForModuleDurationToElapse;
    case 'Scheduled':
    case '2':
      return ModuleStatus.Scheduled;
    case 'NotStarted':
    case '3':
      return ModuleStatus.NotStarted;
    case 'InProgress':
    case '4':
      return ModuleStatus.InProgress;
    case 'Completed':
    case '5':
      return ModuleStatus.Completed;
    case 'TimeElapsed':
    case '6':
      return ModuleStatus.TimeElapsed;
    default:
      return ModuleStatus.NotStarted;
  }
};

/**
 * Gets a human-readable display text for a module status
 * @param status - The module status
 * @returns The display text for the status
 */
export const getModuleStatusDisplayText = (status: ModuleStatus | string): string => {
  const statusEnum = convertToModuleStatusEnum(status);
  
  switch (statusEnum) {
    case ModuleStatus.Locked:
      return 'Locked';
    case ModuleStatus.WaitForModuleDurationToElapse:
      return 'Waiting for Completion';
    case ModuleStatus.Scheduled:
      return 'Scheduled';
    case ModuleStatus.NotStarted:
      return 'Not Started';
    case ModuleStatus.InProgress:
      return 'In Progress';
    case ModuleStatus.Completed:
      return 'Completed';
    case ModuleStatus.TimeElapsed:
      return 'Time Elapsed';
    default:
      return 'Unknown';
  }
};

/**
 * Gets the appropriate icon path for a module status
 * @param status - The module status
 * @returns The icon path for the status
 */
export const getModuleStatusIcon = (status: ModuleStatus | string): string => {
  const statusEnum = convertToModuleStatusEnum(status);
  
  switch (statusEnum) {
    case ModuleStatus.Locked:
      return '/images/icons/lock.svg';
    case ModuleStatus.WaitForModuleDurationToElapse:
      return '/images/icons/time.svg';
    case ModuleStatus.Scheduled:
      return '/images/icons/navigation.svg';
    case ModuleStatus.NotStarted:
      return '/images/icons/rocket.svg';
    case ModuleStatus.InProgress:
      return '/images/icons/progress.svg';
    case ModuleStatus.Completed:
      return '/images/icons/check.svg';
    case ModuleStatus.TimeElapsed:
      return '/images/icons/time.svg';
    default:
      return '/images/icons/information.svg';
  }
};

/**
 * Checks if a module status allows user interaction (can click/start the module)
 * @param status - The module status
 * @returns True if the status allows interaction
 */
export const isModuleStatusInteractive = (status: ModuleStatus | string): boolean => {
  const statusEnum = convertToModuleStatusEnum(status);
  
  switch (statusEnum) {
    case ModuleStatus.NotStarted:
    case ModuleStatus.InProgress:
    case ModuleStatus.Completed:
      return true;
    case ModuleStatus.Locked:
    case ModuleStatus.WaitForModuleDurationToElapse:
    case ModuleStatus.Scheduled:
    case ModuleStatus.TimeElapsed:
      return false;
    default:
      return false;
  }
};
