import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Assignment } from '../../models/assignment';
import { Group } from '../../models/group';
import { User } from '../../models/user';
import { ExamTakerState } from '../../models/exam-taker-state';
import { GroupMemberState } from '../../models/group-member-state';
import { ModuleStatus } from '../../models/module-status';
import { groupService } from '../../services/groupService';
import { sessionService } from '../../services/sessionService';
import { FilePreview } from '../Shared/FilePreview';
import { StaticFileDto } from '../../models/static-file';

interface AssignmentExecutionProps {
  assignment: Assignment;
  user: User | ExamTakerState;
  onBack: () => void;
}

// Helper function to convert staticFileUrls to StaticFileDto objects for FilePreview
const convertUrlsToStaticFiles = (urls: string[], ids?: string[]): StaticFileDto[] => {
  if (!urls || urls.length === 0) return [];
  
  return urls.map((url, index) => {
    const fileName = url.split('/').pop() || `Module-Attachment-${index + 1}`;
    const fileExtension = fileName.split('.').pop() || '';
    const fileId = ids?.[index] || `static-${index}-${Date.now()}`;
    
    // Determine file type based on extension
    const getFileType = (extension: string): string => {
      if (extension.match(/jpg|jpeg|png|gif|webp|svg$/i)) return 'image';
      if (extension.match(/mp3|wav|ogg|m4a|aac$/i)) return 'audio';
      if (extension.match(/mp4|avi|mov|wmv|webm$/i)) return 'video';
      if (extension.match(/pdf$/i)) return 'application/pdf';
      if (extension.match(/doc|docx$/i)) return 'application/msword';
      return 'application/octet-stream';
    };

    return {
      id: fileId,
      url: url,
      name: fileName,
      type: getFileType(fileExtension)
    };
  });
};

const AssignmentExecution: React.FC<AssignmentExecutionProps> = ({
  assignment,
  user,
  onBack
}) => {
  const navigate = useNavigate();
  const [group, setGroup] = useState<Group | null>(null);
  const [groupMemberStates, setGroupMemberStates] = useState<GroupMemberState[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [, forceUpdate] = useState(0);
  const [showLaunchModal, setShowLaunchModal] = useState(false);
  const [pendingMemberState, setPendingMemberState] = useState<GroupMemberState | null>(null);
  const [previousTimeStates, setPreviousTimeStates] = useState<Map<string, number>>(new Map());
  const [currentModalSection, setCurrentModalSection] = useState(1);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const [celebratingModules, setCelebratingModules] = useState<Set<string>>(new Set());
  const [launching, setLaunching] = useState(false);

  // Update UI every minute to refresh time remaining displays
  useEffect(() => {
    const interval = setInterval(() => {
      // Check if any modules have expired and need data refresh
      let shouldRefresh = false;
      const newTimeStates = new Map<string, number>();
      
      groupMemberStates.forEach(memberState => {
        const timeInfo = getModuleTimeInfo(memberState);
        const currentRemainingMinutes = timeInfo?.remainingMinutes || 0;
        const previousRemainingMinutes = previousTimeStates.get(memberState.id) || 0;
        
        // Store current state for next check
        newTimeStates.set(memberState.id, currentRemainingMinutes);
        
        // If module had time remaining before but now has expired (went from >0 to <=0)
        if (previousRemainingMinutes > 0 && currentRemainingMinutes <= 0 && memberState.startedAtUtc) {
          shouldRefresh = true;
        }
      });
      
      setPreviousTimeStates(newTimeStates);
      
      if (shouldRefresh) {
        // Refresh data to get updated module statuses from server
        loadAssignmentData();
      } else {
        // Just force re-render to update time displays
        forceUpdate(prev => prev + 1);
      }
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [groupMemberStates, previousTimeStates]);

  // Refresh data when page becomes visible (user returns from another tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && groupMemberStates.length > 0) {
        // Check if any running modules might have expired while tab was hidden
        const hasRunningModules = groupMemberStates.some(memberState => {
          const timeInfo = getModuleTimeInfo(memberState);
          return memberState.startedAtUtc && !memberState.completedAtUtc && timeInfo?.remainingMinutes;
        });
        
        if (hasRunningModules) {
          loadAssignmentData();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [groupMemberStates]);

  useEffect(() => {
    loadAssignmentData();
  }, [assignment.id]); // Changed from assignment.groupId to assignment.id

  useEffect(() => {
    if (group && groupMemberStates) {
      // Check for newly completed and passed modules to trigger celebration
      groupMemberStates.forEach(memberState => {
        // Only celebrate if module is completed, passed, and we haven't celebrated it yet
        if (memberState.completedAtUtc && 
            memberState.passed === true && 
            !celebratingModules.has(memberState.id)) {
          
          // Add to celebrating modules
          setCelebratingModules(prev => new Set(prev).add(memberState.id));
          
          // Remove celebration after 4 seconds
          setTimeout(() => {
            setCelebratingModules(prev => {
              const newSet = new Set(prev);
              newSet.delete(memberState.id);
              return newSet;
            });
          }, 4000);
        }
      });
    }
  }, [group, groupMemberStates]);

  // Check scroll indicators when modal opens or content changes
  useEffect(() => {
    if (showLaunchModal) {
      const timer = setTimeout(() => {
        const modalElement = document.querySelector('.launch-modal') as HTMLElement;
        if (modalElement) {
          checkScrollIndicators(modalElement);
        }
      }, 100); // Small delay to ensure content is rendered
      
      return () => clearTimeout(timer);
    }
  }, [showLaunchModal, currentModalSection, pendingMemberState]);

  // Keyboard navigation for modal scrolling
  useEffect(() => {
    if (!showLaunchModal) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const modalElement = document.querySelector('.launch-modal') as HTMLElement;
      const scrollAmount = 100; // pixels to scroll per keypress

      // Check if user has scrolled to the bottom
      const isScrolledToBottom = modalElement ? 
        modalElement.scrollTop + modalElement.clientHeight >= modalElement.scrollHeight - 1 : false;

      switch (event.key) {
        case 'ArrowUp':
          if (!modalElement) return;
          event.preventDefault();
          modalElement.scrollBy({ top: -scrollAmount, behavior: 'smooth' });
          break;
        case 'ArrowDown':
          if (!modalElement) return;
          event.preventDefault();
          modalElement.scrollBy({ top: scrollAmount, behavior: 'smooth' });
          break;
        case 'ArrowLeft':
          event.preventDefault();
          // Only allow navigation if scrolled to bottom
          if (currentModalSection === 2 && isScrolledToBottom) {
            handleModalPrevious();
          } else if (currentModalSection === 2 && !isScrolledToBottom) {
            // Shake the scroll indicator to draw attention
            const scrollIndicator = document.querySelector('[data-scroll-indicator]') as HTMLElement;
            if (scrollIndicator) {
              scrollIndicator.style.animation = 'none';
              void scrollIndicator.offsetHeight; // Trigger reflow
              scrollIndicator.style.animation = 'shakeCenter 0.5s ease-in-out';
            }
          }
          break;
        case 'ArrowRight':
          event.preventDefault();
          // Only allow navigation if scrolled to bottom
          if (currentModalSection === 1 && isScrolledToBottom) {
            handleModalNext();
          } else if (currentModalSection === 1 && !isScrolledToBottom) {
            // Shake the scroll indicator to draw attention
            const scrollIndicator = document.querySelector('[data-scroll-indicator]') as HTMLElement;
            if (scrollIndicator) {
              scrollIndicator.style.animation = 'none';
              void scrollIndicator.offsetHeight; // Trigger reflow
              scrollIndicator.style.animation = 'shakeCenter 0.5s ease-in-out';
            }
          }
          break;
        case 'Escape':
          // Check if there's an active file preview modal open by looking for our specific data attribute
          const filePreviewModal = document.querySelector('[data-modal-type="file-preview"]');
          
          if (!filePreviewModal) {
            event.preventDefault();
            handleLaunchCancel();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showLaunchModal, currentModalSection]);

  // Prevent text copying via keyboard shortcuts and context menu
  useEffect(() => {
    const preventCopy = (e: KeyboardEvent) => {
      // Allow Ctrl+C and Ctrl+A for copying and selecting text
      // Only prevent other shortcuts: Ctrl+X, Ctrl+V, Ctrl+S, F12, etc.
      if ((e.ctrlKey || e.metaKey) && (
        e.key === 'x' || 
        e.key === 'v' || 
        e.key === 's' ||
        e.key === 'p'
      )) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      
      // Prevent F12 (Developer Tools)
      if (e.key === 'F12') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      
      // Prevent Ctrl+Shift+I (Developer Tools)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    const preventContextMenu = (e: MouseEvent) => {
      // Allow context menu for text selection to enable copying
      const target = e.target as HTMLElement;
      const selection = window.getSelection();
      
      // If there's selected text, allow the context menu for copy functionality
      if (selection && selection.toString().length > 0) {
        return true;
      }
      
      // Otherwise prevent context menu
      e.preventDefault();
      return false;
    };

    // Add event listeners
    document.addEventListener('keydown', preventCopy, true);
    document.addEventListener('contextmenu', preventContextMenu, true);

    return () => {
      // Clean up event listeners
      document.removeEventListener('keydown', preventCopy, true);
      document.removeEventListener('contextmenu', preventContextMenu, true);
    };
  }, []);

  // Add mobile responsive styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      /* Custom scrollbar styles for file preview container */
      .assignment-execution-file-preview-container::-webkit-scrollbar {
        width: 6px;
      }
      
      .assignment-execution-file-preview-container::-webkit-scrollbar-track {
        background: #f1f5f9;
        border-radius: 3px;
      }
      
      .assignment-execution-file-preview-container::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 3px;
      }
      
      .assignment-execution-file-preview-container::-webkit-scrollbar-thumb:hover {
        background: #94a3b8;
      }
      
      @media (max-width: 768px) {
        .assignment-execution-container {
          padding: 10px !important;
          max-width: 100% !important;
        }
        .assignment-execution-header {
          flex-direction: column !important;
          gap: 8px !important;
          align-items: stretch !important;
          padding: 12px !important;
        }
        .assignment-execution-header .assignment-execution-back-button {
          align-self: flex-start !important;
          width: auto !important;
          order: -1 !important;
        }
        .assignment-execution-header .headerContent {
          order: 0 !important;
          margin: 0 !important;
          text-align: center !important;
        }
        .assignment-execution-header .userInfo {
          order: 1 !important;
          align-self: center !important;
          align-items: center !important;
          text-align: center !important;
        }
        .assignment-execution-info-grid {
          grid-template-columns: 1fr !important;
          gap: 8px !important;
        }
        .assignment-execution-info-item {
          flex-direction: column !important;
          gap: 4px !important;
          align-items: flex-start !important;
        }
        .assignment-execution-modules-grid {
          grid-template-columns: 1fr !important;
          gap: 16px !important;
        }
        .assignment-execution-module-card {
          padding: 16px !important;
        }
        .assignment-execution-module-header {
          flex-direction: column !important;
          align-items: flex-start !important;
          gap: 8px !important;
        }
        .assignment-execution-module-actions {
          width: 100% !important;
          justify-content: center !important;
        }
        .assignment-execution-launch-modal {
          margin: 10px !important;
          max-height: calc(100vh - 20px) !important;
          max-width: calc(100vw - 20px) !important;
          padding: 16px !important;
        }
        .assignment-execution-modal-content {
          max-height: calc(100vh - 120px) !important;
        }
        .assignment-execution-modal-navigation {
          flex-direction: column !important;
          gap: 8px !important;
        }
        .assignment-execution-modal-actions {
          padding: 16px !important;
        }
        .assignment-execution-modal-navigation-buttons {
          flex-direction: column !important;
          gap: 12px !important;
        }
        .assignment-execution-modal-section2-buttons {
          flex-direction: column !important;
          gap: 12px !important;
          width: 100% !important;
        }
        .assignment-execution-modal-button {
          width: 100% !important;
          padding: 12px 16px !important;
          font-size: 16px !important;
          min-height: 44px !important;
        }
        .assignment-execution-modal-cancel-button {
          order: 2 !important;
        }
        .assignment-execution-modal-next-button,
        .assignment-execution-modal-confirm-button {
          order: 1 !important;
        }
        .assignment-execution-file-preview-container {
          max-height: 30vh !important;
          overflow-y: auto !important;
          padding-right: 8px !important;
        }
      }
      @media (max-width: 480px) {
        .assignment-execution-container {
          padding: 8px !important;
        }
        .assignment-execution-title {
          font-size: 18px !important;
        }
        .assignment-execution-section-title {
          font-size: 16px !important;
        }
        .assignment-execution-module-title {
          font-size: 14px !important;
        }
        .assignment-execution-modal-button {
          padding: 10px 14px !important;
          font-size: 14px !important;
          min-height: 40px !important;
        }
        .assignment-execution-modal-actions {
          padding: 12px !important;
        }
        .assignment-execution-file-preview-container {
          max-height: 25vh !important;
          overflow-y: auto !important;
          padding-right: 4px !important;
        }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const loadAssignmentData = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Try to get group state which contains all group info and member states with current status
      try {
        const groupStateResponse = await sessionService.getGroupState(user.id, assignment.id);
        
        if (groupStateResponse.isSuccess && groupStateResponse.data) {
          // Create group object from group state data
          const groupData: Group = {
            id: groupStateResponse.data.id,
            title: groupStateResponse.data.title,
            description: groupStateResponse.data.description,
            waitModuleCompletion: groupStateResponse.data.waitModuleCompletion,
            isMemberOrderLocked: groupStateResponse.data.isMemberOrderLocked,
            groupMembers: [], // We'll set the member states separately
            updatedAtUtc: new Date().toISOString(),
            createdByUserId: '',
            createdByUser: '',
            updatedByUserId: '',
            createdAtUtc: new Date().toISOString()
          };
          
          setGroup(groupData);
          
          // The group state should already contain the member states with their current status
          const memberStates = groupStateResponse.data.groupMembers.map((member) => ({
            id: member.id,
            name: member.assessmentModuleTitle || member.name || '',
            status: member.status,
            groupId: member.groupId,
            orderNumber: member.orderNumber,
            assessmentModuleId: member.assessmentModuleId,
            assessmentModuleTitle: member.assessmentModuleTitle,
            assessmentModuleDescription: member.assessmentModuleDescription,
            startedAtUtc: member.startedAtUtc,
            completedAtUtc: member.completedAtUtc,
            durationInMinutes: member.durationInMinutes,
            timeRemaining: member.timeRemaining,
            staticFileUrls: member.staticFileUrls,
            passed: member.passed,
            passingScorePercentage: member.passingScorePercentage,
            scorePercentage: member.scorePercentage,
          }));
          
          setGroupMemberStates(memberStates);
          
          // Initialize time states for tracking expiration
          const initialTimeStates = new Map<string, number>();
          memberStates.forEach(memberState => {
            const timeInfo = getModuleTimeInfo(memberState);
            initialTimeStates.set(memberState.id, timeInfo?.remainingMinutes || 0);
          });
          setPreviousTimeStates(initialTimeStates);
          
          return; // Successfully loaded from group state, we're done
        }
      } catch (groupStateError) {
        // Group state not available (user hasn't started any modules), falling back to group service
      }
      
      // Fallback: Load group data from group service for cases where user hasn't started any modules
      const groupData = await groupService.getGroup(assignment.groupId);
      setGroup(groupData);

      // Create default "Not Started" states since no session state exists yet
      if (groupData.groupMembers && groupData.groupMembers.length > 0) {
        const defaultMemberStates = groupData.groupMembers.map((member) => ({
          id: member.id,
          name: member.assessmentModuleTitle,
          status: ModuleStatus.NotStarted,
          groupId: member.groupId,
          orderNumber: member.orderNumber,
          assessmentModuleId: member.assessmentModuleId,
          assessmentModuleTitle: member.assessmentModuleTitle,
          assessmentModuleDescription: member.assessmentModuleDescription,
          assessmentModule: member.assessmentModule,
          startedAtUtc: undefined,
          completedAtUtc: undefined,
          durationInMinutes: undefined,
          staticFileUrls: member.assessmentModule?.latestVersion?.staticFileUrls,
          staticFileIds: member.assessmentModule?.latestVersion?.staticFileIds,
          passed: undefined,
          passingScorePercentage: undefined,
          scorePercentage: undefined,
        }));
        setGroupMemberStates(defaultMemberStates);
        
        // Initialize time states for tracking expiration
        const initialTimeStates = new Map<string, number>();
        defaultMemberStates.forEach(memberState => {
          const timeInfo = getModuleTimeInfo(memberState);
          initialTimeStates.set(memberState.id, timeInfo?.remainingMinutes || 0);
        });
        setPreviousTimeStates(initialTimeStates);
      } else {
        setGroupMemberStates([]);
      }
    } catch (err: any) {
      setError('Failed to load assignment details: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const convertToEnum = (status: ModuleStatus | string): ModuleStatus => {
    return typeof status === 'string' 
      ? ModuleStatus[status as keyof typeof ModuleStatus] 
      : status;
  };

  const getModuleTimeInfo = (memberState: GroupMemberState) => {
    // Calculate time information from GroupMemberState timing properties
    if (!memberState.startedAtUtc && !memberState.durationInMinutes) {
      return null; // No timing info available
    }

    const result: any = {};
    const statusEnum = convertToEnum(memberState.status);
    const isCompleted = statusEnum === ModuleStatus.Completed;

    // If module has a duration limit, use server-calculated time remaining
    if (memberState.durationInMinutes && memberState.startedAtUtc) {
      // Use server-calculated time remaining to prevent clock manipulation (TimeSpan format: "HH:MM:SS")
      let remainingMinutes = 0;
      if (memberState.timeRemaining && typeof memberState.timeRemaining === 'string') {
        const parts = memberState.timeRemaining.split(':');
        const hours = parseInt(parts[0] || '0', 10);
        const minutes = parseInt(parts[1] || '0', 10);
        const seconds = parseInt(parts[2] || '0', 10);
        const totalSeconds = hours * 3600 + minutes * 60 + seconds;
        remainingMinutes = Math.ceil(totalSeconds / 60);
      }
      
      // Only show remaining time for non-completed modules
      if (remainingMinutes > 0 && !isCompleted) {
        if (remainingMinutes < 60) {
          result.remainingDisplay = `${remainingMinutes}m remaining`;
        } else {
          const hours = Math.floor(remainingMinutes / 60);
          const minutes = remainingMinutes % 60;
          result.remainingDisplay = `${hours}h ${minutes}m remaining`;
        }
        result.remainingMinutes = remainingMinutes;
      }
      // If time expired, don't show anything - status badge will handle it
    } else if (memberState.durationInMinutes && !isCompleted) {
      // Module has duration but hasn't started yet - show duration with green color (only for non-completed)
      const duration = memberState.durationInMinutes;
      if (duration < 60) {
        result.durationDisplay = `${duration}m duration`;
      } else {
        const hours = Math.floor(duration / 60);
        const minutes = duration % 60;
        result.durationDisplay = `${hours}h ${minutes}m duration`;
      }
      result.remainingMinutes = duration; // Use duration for color calculation
      result.remainingDisplay = result.durationDisplay; // Show duration in header
    }

    // If completed, show completion time in local timezone
    if (memberState.completedAtUtc) {
      // Convert UTC string to local Date object
      const completedTime = new Date(memberState.completedAtUtc + 'Z'); // Ensure it's treated as UTC
      const localDateString = completedTime.toLocaleDateString();
      const localTimeString = completedTime.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
      result.completedDisplay = `Completed ${localDateString} at ${localTimeString}`;
    }

    return Object.keys(result).length > 0 ? result : null;
  };

  const refreshGroupMemberStates = async (examTakerAssignmentId: string) => {
    try {
      const memberStatesResponse = await sessionService.getGroupMemberStates(
        user.id, 
        examTakerAssignmentId, 
        assignment.groupId
      );
      
      // Map the response to ensure all fields including timeRemaining are included
      const memberStates = (memberStatesResponse.data || []).map((member: any) => ({
        id: member.id,
        name: member.assessmentModuleTitle || member.name || '',
        status: member.status,
        groupId: member.groupId,
        orderNumber: member.orderNumber,
        assessmentModuleId: member.assessmentModuleId,
        assessmentModuleTitle: member.assessmentModuleTitle,
        assessmentModuleDescription: member.assessmentModuleDescription,
        startedAtUtc: member.startedAtUtc,
        completedAtUtc: member.completedAtUtc,
        durationInMinutes: member.durationInMinutes,
        timeRemaining: member.timeRemaining,
        staticFileUrls: member.staticFileUrls,
        passed: member.passed,
        passingScorePercentage: member.passingScorePercentage,
        scorePercentage: member.scorePercentage,
      }));
      
      setGroupMemberStates(memberStates);
    } catch (error) {
      // Failed to refresh group member states
    }
  };

  const handleModuleButtonClick = async (memberState: GroupMemberState) => {
    // Prevent clicks while data is still loading or launching
    if (loading || launching) {
      return;
    }
    
    try {
      const statusEnum = convertToEnum(memberState.status);
      
      if (statusEnum === ModuleStatus.NotStarted) {
        // Show confirmation modal for starting module
        setPendingMemberState(memberState);
        setShowLaunchModal(true);
        return;
      }
      
      if (statusEnum === ModuleStatus.InProgress) {
        // Set launching state for continue action
        setLaunching(true);
        // Get existing module progress for modules already in progress
        const progressResponse = await sessionService.getModuleProgress(
          user.id,
          assignment.id,
          memberState.assessmentModuleId
        );
        
        if (progressResponse.isSuccess && progressResponse.data) {
          // Refresh group member states to show updated progress from backend
          await refreshGroupMemberStates(progressResponse.data.examTakerAssignmentId);
          
          // Navigate to questions component with the necessary data
          navigate('/questions', {
            state: {
              moduleProgress: progressResponse.data,
              assignment: assignment,
              groupMember: memberState,
              user: user
            }
          });
        } else {
          setError('Failed to access module progress: ' + (progressResponse.message || 'Unknown error'));
          setLaunching(false);
        }
      }
    } catch (err: any) {
      setError('Failed to start module: ' + (err.response?.data?.message || err.message));
      setLaunching(false);
    }
  };

  const handleLaunchConfirm = async () => {
    if (!pendingMemberState || launching) {
      return;
    }
    
    setLaunching(true);
    
    try {
      // Create new module progress when user starts a module for the first time
      const progressResponse = await sessionService.createModuleProgress(
        user.id,
        assignment.id,
        pendingMemberState.assessmentModuleId
      );
      
      if (progressResponse.isSuccess && progressResponse.data) {
        // Refresh group member states to show updated progress from backend
        await refreshGroupMemberStates(progressResponse.data.examTakerAssignmentId);
        
        // Close modal
        setShowLaunchModal(false);
        setPendingMemberState(null);
        
        // Navigate to questions component with the necessary data
        navigate('/questions', {
          state: {
            moduleProgress: progressResponse.data,
            assignment: assignment,
            groupMember: pendingMemberState,
            user: user
          }
        });
      } else {
        setError('Failed to launch module: ' + (progressResponse.message || 'Unknown error'));
        setShowLaunchModal(false);
        setPendingMemberState(null);
        setLaunching(false);
      }
    } catch (err: any) {
      setError('Failed to launch module: ' + (err.response?.data?.message || err.message));
      setShowLaunchModal(false);
      setPendingMemberState(null);
      setLaunching(false);
    }
  };

  const handleLaunchCancel = () => {
    setShowLaunchModal(false);
    setPendingMemberState(null);
    setCurrentModalSection(1); // Reset to first section
  };

  const handleModalNext = () => {
    setCurrentModalSection(2);
  };

  const handleModalPrevious = () => {
    setCurrentModalSection(1);
  };

  const checkScrollIndicators = (element: HTMLElement) => {
    const { scrollTop, scrollHeight, clientHeight } = element;
    setCanScrollDown(scrollTop + clientHeight < scrollHeight - 1);
  };

  const handleModalScroll = (event: React.UIEvent<HTMLDivElement>) => {
    checkScrollIndicators(event.currentTarget);
  };

  const truncateText = (text: string, maxLength: number = 120): string => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).replace(/\s+\S*$/, '') + '...';
  };

  const getStatusInfo = (status: ModuleStatus | string, group?: Group) => {
    // Convert string status to enum value
    const statusEnum = convertToEnum(status);
    
    switch (statusEnum) {
      case ModuleStatus.Locked:
        let lockMessage = 'This module is currently locked.';
        if (group?.isMemberOrderLocked && group?.waitModuleCompletion) {
          lockMessage = 'Complete previous modules in order and wait for completion before accessing this module.';
        } else if (group?.isMemberOrderLocked) {
          lockMessage = 'Complete previous modules to unlock this one.';
        } else if (group?.waitModuleCompletion) {
          lockMessage = 'Wait for the current module to be completed before starting this one.';
        }
        
        return {
          badge: 'Locked',
          badgeStyle: styles.lockedBadge,
          buttonText: 'Locked',
          buttonStyle: styles.startModuleButtonDisabled,
          isEnabled: false,
          showButton: false,
          message: lockMessage
        };
      case ModuleStatus.WaitForModuleDurationToElapse:
        return {
          badge: 'Waiting',
          badgeStyle: styles.waitingBadge,
          buttonText: 'Waiting',
          buttonStyle: styles.startModuleButtonDisabled,
          isEnabled: false,
          showButton: false,
          message: 'Module completed - waiting for full duration to elapse before next module becomes available.'
        };
      case ModuleStatus.Scheduled:
        return {
          badge: 'Scheduled',
          badgeStyle: styles.scheduledBadge,
          buttonText: 'Scheduled',
          buttonStyle: styles.startModuleButtonDisabled,
          isEnabled: false,
          showButton: false,
          message: 'This module is scheduled for later.'
        };
      case ModuleStatus.NotStarted:
        return {
          badge: null,
          badgeStyle: null,
          buttonText: 'Launch Module',
          buttonStyle: styles.startModuleButton,
          isEnabled: true,
          showButton: true,
          message: null
        };
      case ModuleStatus.InProgress:
        return {
          badge: <><img src="/images/icons/progress.svg" alt="" style={{width: '16px', height: '16px', marginRight: '6px', verticalAlign: 'middle', display: 'inline-block'}} /> In Progress</>,
          badgeStyle: styles.inProgressBadge,
          buttonText: 'Continue Module',
          buttonStyle: styles.continueModuleButton,
          isEnabled: true,
          showButton: true,
          message: null
        };
      case ModuleStatus.Completed:
        return {
          badge: 'Completed',
          badgeStyle: styles.completedBadge,
          buttonText: 'Completed',
          buttonStyle: styles.startModuleButtonDisabled,
          isEnabled: false,
          showButton: false,
          message: null
        };
      case ModuleStatus.TimeElapsed:
        return {
          badge: 'Time Elapsed',
          badgeStyle: styles.timeElapsedBadge,
          buttonText: 'Time Elapsed',
          buttonStyle: styles.startModuleButtonDisabled,
          isEnabled: false,
          showButton: false,
          message: 'The time allocated for this module has ended.'
        };
      default:
        return {
          badge: null,
          badgeStyle: null,
          buttonText: 'Launch Module',
          buttonStyle: styles.startModuleButton,
          isEnabled: true,
          showButton: true,
          message: null
        };
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Loading assignment details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorContainer}>
          <h2 style={styles.errorTitle}>Error Loading Assignment</h2>
          <p style={styles.errorText}>{error}</p>
          <button onClick={onBack} style={styles.backButton}>
            Back to Assignments
          </button>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div style={styles.container}>
        <div style={styles.errorContainer}>
          <h2 style={styles.errorTitle}>Assignment Not Found</h2>
          <p style={styles.errorText}>The assignment details could not be loaded.</p>
          <button onClick={onBack} style={styles.backButton}>
            Back to Assignments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container} className="assignment-execution-container">
      <style>
        {`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-3px); }
            75% { transform: translateX(3px); }
          }
          
          @keyframes shakeCenter {
            0%, 100% { transform: translateX(-50%); }
            25% { transform: translateX(calc(-50% - 3px)); }
            75% { transform: translateX(calc(-50% + 3px)); }
          }
          
          @keyframes highlight {
            0% { 
              box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
              border-color: #e5e7eb;
            }
            50% { 
              box-shadow: 0 0 20px rgba(59, 130, 246, 0.4);
              border-color: #3b82f6;
            }
            100% { 
              box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
              border-color: #e5e7eb;
            }
          }
          
          @keyframes celebrationFade {
            0% {
              opacity: 0;
              background-color: rgba(0, 0, 0, 0);
            }
            20% {
              opacity: 1;
              background-color: rgba(0, 0, 0, 0.6);
            }
            80% {
              opacity: 1;
              background-color: rgba(0, 0, 0, 0.6);
            }
            100% {
              opacity: 0;
              background-color: rgba(0, 0, 0, 0);
            }
          }
          
          @keyframes celebrationFadeIn {
            0% {
              opacity: 0;
              transform: scale(0.8);
            }
            100% {
              opacity: 1;
              transform: scale(1);
            }
          }
        `}
      </style>
      {/* Header */}
      <div style={styles.header} className="assignment-execution-header">
        <button 
          onClick={onBack} 
          style={styles.backButtonSmall}
          className="assignment-execution-back-button"
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.95)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.85)';
          }}
        >
          ← Back
        </button>
        
        <div style={styles.headerContent} className="headerContent">
          <h1 style={styles.title}>{assignment.title}</h1>
          <p style={styles.subtitle}>Assignment Execution</p>
        </div>
        
        <div style={styles.userInfo} className="userInfo">
          <span style={styles.userLabel}>User:</span>
          <span style={styles.userName}>
            {user.fullName || user.email || user.id}
          </span>
        </div>
      </div>

      {/* Assignment Info */}
      <div style={styles.assignmentInfo}>
        <h2 style={styles.sectionTitle} className="assignment-execution-section-title">Assignment Details</h2>
        <div style={styles.infoGrid} className="assignment-execution-info-grid">
          <div style={styles.infoItem} className="assignment-execution-info-item">
            <span style={styles.infoLabel}>Title:</span>
            <span style={styles.infoValue}>{assignment.title}</span>
          </div>
          {assignment.description && assignment.description.trim() && (
            <div style={styles.infoItem} className="assignment-execution-info-item">
              <span style={styles.infoLabel}>Description:</span>
              <span style={styles.infoValue}>{assignment.description}</span>
            </div>
          )}
          <div style={styles.infoItem} className="assignment-execution-info-item">
            <span style={styles.infoLabel}>Group:</span>
            <span style={styles.infoValue}>{group.title}</span>
          </div>
          {group.description && group.description.trim() && (
            <div style={styles.infoItem} className="assignment-execution-info-item">
              <span style={styles.infoLabel}>Group Description:</span>
              <span style={styles.infoValue}>{group.description}</span>
            </div>
          )}
        </div>
      </div>

      {/* Group Members (Modules) */}
      <div style={styles.modulesSection}>
        {group.isMemberOrderLocked && (
          <div style={styles.orderNotice}>
            <span style={styles.noticeIcon}><img src="/images/icons/lock.svg" alt="" style={{width: '20px', height: '20px'}} /></span>
            <p style={styles.noticeText}>
              <strong>Sequential Order Required:</strong> Modules must be completed in the specified order. 
              You cannot start a module until the previous one is completed.
            </p>
          </div>
        )}
        {group.waitModuleCompletion && (
          <div style={styles.waitNotice}>
            <span style={styles.noticeIcon}><img src="/images/icons/time.svg" alt="" style={{width: '20px', height: '20px'}} /></span>
            <p style={styles.noticeText}>
              <strong>Module Time Control Enabled:</strong> After completing a module, you must wait for the full 
              duration to elapse before starting the next module, even if you finish early.
            </p>
          </div>
        )}
        {assignment.showResultsImmediately && (
          <div style={styles.resultsNotice}>
            <span style={styles.noticeIcon}><img src="/images/icons/chart.svg" alt="" style={{width: '20px', height: '20px'}} /></span>
            <p style={styles.noticeText}>
              <strong>Immediate Results Enabled:</strong> Your scores, pass/fail status, and performance details 
              will be visible on this page once you complete each module or when the time runs out.
            </p>
          </div>
        )}
        {!assignment.showResultsImmediately && (
          <div style={styles.noResultsNotice}>
            <span style={styles.noticeIcon}><img src="/images/icons/clipboard.svg" alt="" style={{width: '20px', height: '20px'}} /></span>
            <p style={styles.noticeText}>
              <strong>Results Not Shown:</strong> Your exam results will not be displayed immediately upon completion. 
              Please contact your exam provider or instructor to obtain your scores and performance details.
            </p>
          </div>
        )}
        {groupMemberStates && groupMemberStates.length > 0 ? (
          <div style={styles.modulesList} className="assignment-execution-modules-list">
            {groupMemberStates
              .sort((a, b) => a.orderNumber - b.orderNumber)
              .map((memberState, index) => {
                const statusInfo = getStatusInfo(memberState.status, group);
                const timeInfo = getModuleTimeInfo(memberState);
                const isLastModule = index === groupMemberStates.length - 1;
                
                return (
                <div key={memberState.id} style={styles.moduleWrapper} className="assignment-execution-module-wrapper">
                  <div 
                    style={styles.moduleCard}
                    className="assignment-execution-module-card"
                    data-module-card="true"
                    onMouseEnter={(e) => {
                      if (statusInfo.isEnabled) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
                        e.currentTarget.style.borderColor = '#3b82f6';
                      } else {
                        // Trigger shake animation for inactive cards
                        e.currentTarget.style.animation = 'none';
                        void e.currentTarget.offsetHeight; // Trigger reflow
                        e.currentTarget.style.animation = 'shake 0.5s ease-in-out';
                        
                        // Find and highlight ALL available modules
                        const availableModuleIndices = groupMemberStates
                          .map((state, index) => {
                            const statusInfo = getStatusInfo(state.status, group);
                            return statusInfo.isEnabled ? index : -1;
                          })
                          .filter(index => index !== -1);
                        
                        if (availableModuleIndices.length > 0) {
                          // Find all module elements and highlight the available ones
                          const moduleCards = document.querySelectorAll('[data-module-card="true"]');
                          
                          availableModuleIndices.forEach(moduleIndex => {
                            const moduleCard = moduleCards[moduleIndex] as HTMLElement;
                            if (moduleCard) {
                              moduleCard.style.animation = 'highlight 1s ease-in-out';
                              setTimeout(() => {
                                if (moduleCard && moduleCard.style) {
                                  moduleCard.style.animation = '';
                                }
                              }, 1000);
                            }
                          });
                        }
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (statusInfo.isEnabled) {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                        e.currentTarget.style.borderColor = '#e5e7eb';
                      } else {
                        // Reset shake animation after completion
                        const element = e.currentTarget;
                        setTimeout(() => {
                          if (element && element.style) {
                            element.style.animation = '';
                          }
                        }, 500);
                      }
                    }}
                  >
                    <div style={styles.moduleHeader}>
                      <span style={styles.moduleNumber}>Module {memberState.orderNumber}</span>
                      <div style={styles.moduleHeaderRight}>
                        {timeInfo && timeInfo.remainingDisplay && (
                          <div style={styles.timeInfoHeader}>
                            <span style={{
                              ...styles.timeDisplayHeader,
                              backgroundColor: timeInfo.remainingMinutes && timeInfo.remainingMinutes <= 10 
                                ? '#fef2f2' // Red background for ≤10 minutes
                                : timeInfo.remainingMinutes && timeInfo.remainingMinutes <= 30 
                                ? '#fffbeb' // Orange background for ≤30 minutes
                                : '#f0fdf4', // Green background for >30 minutes or not started
                              color: timeInfo.remainingMinutes && timeInfo.remainingMinutes <= 10 
                                ? '#dc2626' // Red text for ≤10 minutes
                                : timeInfo.remainingMinutes && timeInfo.remainingMinutes <= 30 
                                ? '#d97706' // Orange text for ≤30 minutes
                                : '#059669', // Green text for >30 minutes or not started
                              borderColor: timeInfo.remainingMinutes && timeInfo.remainingMinutes <= 10 
                                ? '#fecaca' // Red border for ≤10 minutes
                                : timeInfo.remainingMinutes && timeInfo.remainingMinutes <= 30 
                                ? '#fed7aa' // Orange border for ≤30 minutes
                                : '#bbf7d0' // Green border for >30 minutes or not started
                            }}>
                              <img src="/images/icons/time.svg" alt="" style={{width: '14px', height: '14px', marginRight: '6px', verticalAlign: 'middle', display: 'inline-block'}} />
                              {timeInfo.remainingDisplay}
                            </span>
                          </div>
                        )}
                        {statusInfo.badge && (
                          <span style={statusInfo.badgeStyle}>{statusInfo.badge}</span>
                        )}
                      </div>
                    </div>
                    <div style={styles.moduleContent} className="assignment-execution-module-content">
                      <div style={styles.moduleInfo} className="assignment-execution-module-info">
                        <h4 style={styles.moduleTitle} className="assignment-execution-module-title">{memberState.assessmentModuleTitle}</h4>
                        {memberState.assessmentModuleDescription && (
                          <p style={styles.moduleDescription} className="assignment-execution-module-description">
                            {truncateText(memberState.assessmentModuleDescription)}
                          </p>
                        )}
                        {timeInfo && timeInfo.completedDisplay && (
                          <div style={styles.timeInfo}>
                            <span style={{
                              ...styles.timeDisplay,
                              backgroundColor: '#f0fdfa',
                              color: '#059669',
                              borderColor: '#a7f3d0'
                            }}>
                              {timeInfo.completedDisplay}
                            </span>
                          </div>
                        )}
                        {/* Score Information */}
                        {(memberState.scorePercentage != null || memberState.passed != null) && (
                          <div style={styles.scoreInfo}>
                            {memberState.passed != null && (
                              <span style={{
                                ...styles.passedDisplay,
                                backgroundColor: memberState.passed ? '#dcfce7' : '#fef2f2',
                                color: memberState.passed ? '#166534' : '#dc2626',
                                borderColor: memberState.passed ? '#bbf7d0' : '#fecaca'
                              }}>
                                {memberState.passed ? 'Passed' : 'Failed'}
                              </span>
                            )}
                            {memberState.scorePercentage != null && (
                              <span style={{
                                ...styles.scoreDisplay,
                                backgroundColor: '#f8fafc',
                                color: '#1e293b',
                                borderColor: '#cbd5e1'
                              }}>
                                Score: {memberState.scorePercentage.toFixed(1)}%
                              </span>
                            )}
                            {memberState.passingScorePercentage != null && (
                              <span style={{
                                ...styles.passingScoreDisplay,
                                backgroundColor: '#f1f5f9',
                                color: '#64748b',
                                borderColor: '#e2e8f0'
                              }}>
                                Required: {memberState.passingScorePercentage.toFixed(1)}%
                              </span>
                            )}
                          </div>
                        )}
                        {statusInfo.message && (
                          <p style={{
                            ...styles.statusMessage,
                            color: convertToEnum(memberState.status) === ModuleStatus.TimeElapsed ? '#d97706' : '#ef4444'
                          }}>
                            {statusInfo.message}
                          </p>
                        )}
                      </div>
                      {statusInfo.showButton && (
                        <button 
                          style={statusInfo.buttonStyle}
                          disabled={!statusInfo.isEnabled || launching}
                          onClick={() => handleModuleButtonClick(memberState)}
                          onMouseEnter={(e) => {
                            if (statusInfo.isEnabled) {
                              const statusEnum = convertToEnum(memberState.status);
                              if (statusEnum === ModuleStatus.InProgress) {
                                e.currentTarget.style.backgroundColor = '#f59e0b';
                              } else if (statusEnum === ModuleStatus.Completed) {
                                e.currentTarget.style.backgroundColor = '#059669';
                              } else {
                                e.currentTarget.style.backgroundColor = '#2563eb';
                              }
                              e.currentTarget.style.transform = 'translateY(-1px)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (statusInfo.isEnabled) {
                              const statusEnum = convertToEnum(memberState.status);
                              if (statusEnum === ModuleStatus.InProgress) {
                                e.currentTarget.style.backgroundColor = '#f59e0b';
                              } else if (statusEnum === ModuleStatus.Completed) {
                                e.currentTarget.style.backgroundColor = '#10b981';
                              } else {
                                e.currentTarget.style.backgroundColor = '#3b82f6';
                              }
                              e.currentTarget.style.transform = 'translateY(0)';
                            }
                          }}
                        >
                          {launching ? 'Loading...' : statusInfo.buttonText}
                        </button>
                      )}
                    </div>
                    
                    {/* Celebration Icons */}
                    {celebratingModules.has(memberState.id) && (
                      <div style={styles.celebrationOverlay}>
                        <div style={styles.celebrationCenter}>
                          <div style={styles.celebrationEmojisRow}>
                            {[
                              '/images/icons/party.svg',
                              '/images/icons/party-hat.svg',
                              '/images/icons/sparkles.svg'
                            ].map((iconPath, i) => (
                              <div
                                key={i}
                                style={{
                                  ...styles.celebrationEmoji,
                                  animationDelay: `${i * 0.3}s`
                                }}
                              >
                                <img src={iconPath} alt="celebration" style={{width: '48px', height: '48px'}} />
                              </div>
                            ))}
                          </div>
                          <div style={{
                            ...styles.celebrationText,
                            animationDelay: '0.9s'
                          }}>
                            Passed!
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  {!isLastModule && (
                    <div style={styles.moduleArrow}>
                      <div style={styles.arrowLine}></div>
                      <div style={styles.arrowHead}></div>
                    </div>
                  )}
                </div>
              )})}
          </div>
        ) : (
          <div style={styles.emptyModules}>
            <p style={styles.emptyText}>No modules found in this assignment.</p>
            <p style={styles.emptyText}>Debug: Group member states length = {groupMemberStates?.length || 'undefined'}</p>
          </div>
        )}
      </div>

      {/* Launch Module Confirmation Modal */}
      {showLaunchModal && (
        <div style={styles.modalOverlay} className="assignment-execution-modal-overlay">
          <div style={styles.modal} className="launch-modal assignment-execution-modal" onScroll={handleModalScroll}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Launch Module</h3>
              <div style={styles.modalProgress}>
                <span style={styles.modalProgressText}>Step {currentModalSection} of 2</span>
                <div style={styles.progressBar}>
                  <div 
                    style={{
                      ...styles.progressFill,
                      width: `${(currentModalSection / 2) * 100}%`
                    }}
                  />
                </div>
              </div>
            </div>
            
            <div style={styles.modalContent}>
              {currentModalSection === 1 ? (
                <div>
                  {/* Section 1: Module Information & Resources */}
                  <div style={styles.modalSection}>
                    <div style={styles.sectionHeader}>
                      <span style={styles.sectionIcon}><img src="/images/icons/clipboard.svg" alt="" style={{width: '18px', height: '18px'}} /></span>
                      <span style={styles.modalSectionTitle}>Module Information</span>
                    </div>
                    <div style={styles.moduleModalInfo}>
                      <h4 style={styles.moduleModalTitle}>{pendingMemberState?.assessmentModuleTitle}</h4>
                      {pendingMemberState?.assessmentModuleDescription && (
                        <p style={styles.moduleModalDescription}>
                          {pendingMemberState.assessmentModuleDescription}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Module Files Section */}
                  {pendingMemberState?.staticFileUrls && 
                   pendingMemberState.staticFileUrls.length > 0 && (
                    <div style={styles.modalSection}>
                      <div style={styles.sectionHeader}>
                        <span style={styles.sectionIcon}><img src="/images/icons/filing-cabinet.svg" alt="" style={{width: '18px', height: '18px'}} /></span>
                        <span style={styles.modalSectionTitle}>Module Resources</span>
                      </div>
                      <div style={styles.filePreviewContainer} className="assignment-execution-file-preview-container">
                        <FilePreview 
                          files={convertUrlsToStaticFiles(
                            pendingMemberState.staticFileUrls,
                          )}
                          readonly={true}
                          title=""
                          showFileName={false}
                          customStyles={{
                            container: {
                              width: '100%',
                              maxWidth: '100%'
                            },
                            filesGrid: {
                              display: 'grid',
                              gridTemplateColumns: '1fr',
                              gap: '8px',
                              paddingTop: '8px'
                            },
                            fileCard: {
                              width: '100%',
                              maxWidth: '100%'
                            }
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  {/* Section 2: Important Notice & Navigation Tips */}
                  <div style={styles.modalSection}>
                    <div style={styles.sectionHeader}>
                      <span style={styles.sectionIcon}><img src="/images/icons/warning.svg" alt="" style={{width: '18px', height: '18px'}} /></span>
                      <span style={styles.modalSectionTitle}>Important Notice</span>
                    </div>
                    <div style={styles.warningContainer}>
                      <div style={styles.warningIcon}><img src="/images/icons/time.svg" alt="" style={{width: '24px', height: '24px'}} /></div>
                      <div style={styles.warningText}>
                        <ul style={styles.hintsList}>
                          <li>Once you launch this module, the timer will start ticking and cannot be paused</li>
                          <li>Make sure you're ready to begin and have a stable internet connection</li>
                          <li>If you don't submit the module, all answered questions will still be counted toward your final result</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Navigation Tips Section */}
                  <div style={styles.modalSection}>
                    <div style={styles.sectionHeader}>
                      <span style={styles.sectionIcon}><img src="/images/icons/information.svg" alt="" style={{width: '18px', height: '18px'}} /></span>
                      <span style={styles.modalSectionTitle}>Navigation Tips</span>
                    </div>
                    <div style={styles.navigationHints}>
                      <ul style={styles.hintsList}>
                        <li>Use the "Go to" field to jump directly to any question number</li>
                        <li>
                          Progress bar at the top shows color-coded status for each question:
                          <div style={{ marginTop: '8px', marginLeft: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ width: '20px', height: '8px', backgroundColor: '#22c55e', borderRadius: '2px' }}></div>
                              <span style={{ fontSize: '13px' }}>Green = Answered</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ width: '20px', height: '8px', backgroundColor: '#f59e0b', borderRadius: '2px', cursor: 'pointer' }}></div>
                              <span style={{ fontSize: '13px' }}>Orange = Skipped (clickable to return)</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ width: '20px', height: '8px', backgroundColor: '#3b82f6', borderRadius: '2px' }}></div>
                              <span style={{ fontSize: '13px' }}>Blue = Current question</span>
                            </div>
                          </div>
                        </li>
                        <li>When submitting, you'll see clickable badges like <span style={{ display: 'inline-block', padding: '2px 8px', backgroundColor: '#f59e0b', color: 'white', borderRadius: '4px', fontSize: '12px', fontWeight: '500', marginLeft: '4px' }}>Question 5 →</span> for any unanswered questions</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={styles.modalActions} className="assignment-execution-modal-actions">
              <div style={styles.modalNavigationButtons} className="assignment-execution-modal-navigation-buttons">
                <button
                  onClick={handleLaunchCancel}
                  style={styles.modalCancelButton}
                  className="assignment-execution-modal-button assignment-execution-modal-cancel-button"
                >
                  Cancel
                </button>
                
                {currentModalSection === 1 ? (
                  <button
                    onClick={handleModalNext}
                    style={styles.modalNextButton}
                    className="assignment-execution-modal-button assignment-execution-modal-next-button"
                  >
                    Next →
                  </button>
                ) : (
                  <div style={styles.section2Buttons} className="assignment-execution-modal-section2-buttons">
                    <button
                      onClick={handleModalPrevious}
                      style={styles.modalPreviousButton}
                      className="assignment-execution-modal-button assignment-execution-modal-previous-button"
                    >
                      ← Previous
                    </button>
                    <button
                      onClick={handleLaunchConfirm}
                      style={styles.modalConfirmButton}
                      className="assignment-execution-modal-button assignment-execution-modal-confirm-button"
                      disabled={launching}
                    >
                      {launching ? 'Launching...' : 'Launch Module'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Scroll Down Indicator - Fixed to Bottom of Modal */}
          {canScrollDown && (
            <div style={styles.scrollIndicatorDown} data-scroll-indicator="true">
              <span style={styles.scrollArrow}>↓</span>
              <span style={styles.scrollText}>Scroll down for more</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    // Text selection removed from main container - will be applied selectively
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    gap: '16px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f4f6',
    borderTop: '4px solid #3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    fontSize: '16px',
    color: '#6b7280',
    fontStyle: 'italic',
  },
  errorContainer: {
    textAlign: 'center',
    padding: '40px 20px',
    backgroundColor: '#fef2f2',
    borderRadius: '12px',
    border: '1px solid #fecaca',
  },
  errorTitle: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#dc2626',
    marginBottom: '12px',
  },
  errorText: {
    fontSize: '16px',
    color: '#7f1d1d',
    marginBottom: '24px',
    lineHeight: '1.5',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '32px',
    padding: '24px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e5e7eb',
  },
  backButtonSmall: {
    padding: '8px 16px',
    backgroundColor: 'rgba(59, 130, 246, 0.85)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s ease-in-out',
    flexShrink: 0,
  },
  headerContent: {
    textAlign: 'center',
    flex: 1,
    margin: '0 24px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#111827',
    margin: '0 0 4px 0',
  },
  subtitle: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '4px',
    flexShrink: 0,
  },
  userLabel: {
    fontSize: '12px',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  userName: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
  },
  assignmentInfo: {
    marginBottom: '32px',
    padding: '24px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e5e7eb',
    // Allow text selection for assignment details
    userSelect: 'text',
    WebkitUserSelect: 'text',
    MozUserSelect: 'text',
    msUserSelect: 'text',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '16px',
    borderBottom: '2px solid #e5e7eb',
    paddingBottom: '8px',
  },
  infoGrid: {
    display: 'grid',
    gap: '12px',
  },
  infoItem: {
    display: 'flex',
    gap: '12px',
  },
  infoLabel: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#6b7280',
    minWidth: '120px',
    flexShrink: 0,
  },
  infoValue: {
    fontSize: '14px',
    color: '#374151',
    lineHeight: '1.5',
    whiteSpace: 'pre-wrap',
  },
  modulesSection: {
    marginBottom: '32px',
    padding: '24px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e5e7eb',
  },
  orderNotice: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    backgroundColor: '#f3f4f6',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    marginBottom: '24px',
  },
  waitNotice: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    backgroundColor: '#fefce8',
    borderRadius: '8px',
    border: '1px solid #facc15',
    marginBottom: '24px',
  },
  resultsNotice: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    backgroundColor: '#f0f9ff',
    borderRadius: '8px',
    border: '1px solid #0ea5e9',
    marginBottom: '24px',
  },
  noResultsNotice: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    backgroundColor: '#fef3c7',
    borderRadius: '8px',
    border: '1px solid #f59e0b',
    marginBottom: '24px',
  },
  noticeIcon: {
    fontSize: '20px',
    flexShrink: 0,
  },
  noticeText: {
    fontSize: '14px',
    color: '#374151',
    margin: '0',
    lineHeight: '1.5',
  },
  modulesList: {
    display: 'grid',
    gap: '0px', // Remove gap since arrows will provide spacing
  },
  moduleWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '8px',
  },
  moduleCard: {
    position: 'relative',
    width: '100%',
    maxWidth: '100%',
    padding: '24px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.2s ease-in-out',
    boxSizing: 'border-box',
  },
  moduleArrow: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    margin: '8px 0',
    height: '40px',
    justifyContent: 'center',
  },
  arrowLine: {
    width: '3px',
    height: '20px',
    backgroundColor: '#3b82f6',
    borderRadius: '1.5px',
  },
  arrowHead: {
    width: '0',
    height: '0',
    borderLeft: '8px solid transparent',
    borderRight: '8px solid transparent',
    borderTop: '12px solid #3b82f6',
    marginTop: '-1px',
  },
  moduleHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  moduleNumber: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#374151',
  },
  moduleHeaderRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '4px',
  },
  timeInfoHeader: {
    margin: '0',
  },
  timeDisplayHeader: {
    fontSize: '12px',
    fontWeight: '500',
    padding: '3px 6px',
    backgroundColor: '#f9fafb',
    borderRadius: '4px',
    border: '1px solid #e5e7eb',
    display: 'inline-block',
  },
  lockedBadge: {
    fontSize: '12px',
    color: '#ef4444',
    fontWeight: '500',
    backgroundColor: '#fef2f2',
    padding: '4px 8px',
    borderRadius: '4px',
    border: '1px solid #fecaca',
  },
  inProgressBadge: {
    fontSize: '12px',
    color: '#f59e0b',
    fontWeight: '500',
    backgroundColor: '#fefbf2',
    padding: '4px 8px',
    borderRadius: '4px',
    border: '1px solid #fed7aa',
  },
  completedBadge: {
    fontSize: '12px',
    color: '#059669',
    fontWeight: '500',
    backgroundColor: '#f0fdfa',
    padding: '4px 8px',
    borderRadius: '4px',
    border: '1px solid #a7f3d0',
  },
  timeElapsedBadge: {
    fontSize: '12px',
    color: '#d97706',
    fontWeight: '500',
    backgroundColor: '#fffbeb',
    padding: '4px 8px',
    borderRadius: '4px',
    border: '1px solid #fcd34d',
  },
  waitingBadge: {
    fontSize: '12px',
    color: '#7c3aed',
    fontWeight: '500',
    backgroundColor: '#faf5ff',
    padding: '4px 8px',
    borderRadius: '4px',
    border: '1px solid #c4b5fd',
  },
  scheduledBadge: {
    fontSize: '12px',
    color: '#0ea5e9',
    fontWeight: '500',
    backgroundColor: '#f0f9ff',
    padding: '4px 8px',
    borderRadius: '4px',
    border: '1px solid #7dd3fc',
  },
  moduleId: {
    fontSize: '12px',
    color: '#6b7280',
    fontFamily: 'monospace',
  },
  moduleContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '16px',
  },
  moduleInfo: {
    flex: 1,
  },
  moduleTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#374151',
    margin: '0 0 8px 0',
  },
  moduleDescription: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0',
    lineHeight: '1.5',
    whiteSpace: 'pre-wrap',
    // Allow text selection for module descriptions
    userSelect: 'text',
    WebkitUserSelect: 'text',
    MozUserSelect: 'text',
    msUserSelect: 'text',
  },
  timeInfo: {
    margin: '8px 0 0 0',
  },
  timeDisplay: {
    fontSize: '13px',
    fontWeight: '500',
    padding: '4px 8px',
    backgroundColor: '#f9fafb',
    borderRadius: '6px',
    border: '1px solid #e5e7eb',
    display: 'inline-block',
  },
  scoreInfo: {
    margin: '8px 0 0 0',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },
  scoreDisplay: {
    fontSize: '12px',
    fontWeight: '500',
    padding: '3px 6px',
    borderRadius: '4px',
    border: '1px solid',
    display: 'inline-block',
  },
  passedDisplay: {
    fontSize: '12px',
    fontWeight: '500',
    padding: '3px 6px',
    borderRadius: '4px',
    border: '1px solid',
    display: 'inline-block',
  },
  passingScoreDisplay: {
    fontSize: '12px',
    fontWeight: '500',
    padding: '3px 6px',
    borderRadius: '4px',
    border: '1px solid',
    display: 'inline-block',
  },
  statusMessage: {
    fontSize: '12px',
    color: '#ef4444',
    margin: '8px 0 0 0',
    fontStyle: 'italic',
    lineHeight: '1.4',
  },
  startModuleButton: {
    padding: '8px 16px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s ease-in-out',
    flexShrink: 0,
  },
  startModuleButtonDisabled: {
    padding: '8px 16px',
    backgroundColor: '#d1d5db',
    color: '#9ca3af',
    border: 'none',
    borderRadius: '6px',
    cursor: 'not-allowed',
    fontSize: '14px',
    fontWeight: '500',
    flexShrink: 0,
  },
  continueModuleButton: {
    padding: '8px 16px',
    backgroundColor: '#f59e0b',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s ease-in-out',
    flexShrink: 0,
  },
  emptyModules: {
    textAlign: 'center',
    padding: '40px 20px',
  },
  emptyText: {
    fontSize: '16px',
    color: '#9ca3af',
    fontStyle: 'italic',
    margin: '0',
  },
  backButton: {
    padding: '12px 24px',
    backgroundColor: 'rgba(59, 130, 246, 0.85)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '500',
    transition: 'all 0.2s ease-in-out',
  },
  backButtonHover: {
    backgroundColor: 'rgba(59, 130, 246, 0.95)',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(4px)',
    padding: '20px',
    overflowY: 'auto',
  },
  modal: {
    position: 'relative',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '32px',
    maxWidth: '800px',
    width: '90%',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.8)',
    margin: 'auto',
  },
  modalTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#374151',
    margin: '0 0 8px 0',
    textAlign: 'center',
  },
  modalHeader: {
    marginBottom: '24px',
  },
  modalProgress: {
    marginTop: '16px',
    textAlign: 'center',
  },
  modalProgressText: {
    fontSize: '12px',
    color: '#6b7280',
    marginBottom: '8px',
    display: 'block',
  },
  progressBar: {
    width: '100%',
    height: '4px',
    backgroundColor: '#e5e7eb',
    borderRadius: '2px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: '2px',
    transition: 'width 0.3s ease',
  },
  modalContent: {
    minHeight: '300px',
  },
  modalNavigationButtons: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  section2Buttons: {
    display: 'flex',
    gap: '12px',
  },
  modalSection: {
    marginBottom: '24px',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
  },
  sectionIcon: {
    fontSize: '16px',
  },
  modalSectionTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  moduleModalInfo: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '20px',
  },
  moduleModalTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1e293b',
    margin: '0 0 8px 0',
  },
  moduleModalDescription: {
    fontSize: '14px',
    color: '#64748b',
    margin: '0',
    lineHeight: '1.5',
    whiteSpace: 'pre-wrap',
    // Allow text selection for module descriptions in modal
    userSelect: 'text',
    WebkitUserSelect: 'text',
    MozUserSelect: 'text',
    msUserSelect: 'text',
  },
  filePreviewContainer: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '16px',
  },
  warningContainer: {
    display: 'flex',
    gap: '16px',
    backgroundColor: '#fef3c7',
    border: '1px solid #f59e0b',
    borderRadius: '12px',
    padding: '20px',
  },
  warningIcon: {
    fontSize: '32px',
    flexShrink: 0,
  },
  warningText: {
    flex: 1,
  },
  modalText: {
    flex: 1,
  },
  modalMainText: {
    fontSize: '16px',
    color: '#374151',
    margin: '0 0 12px 0',
    lineHeight: '1.5',
    fontWeight: '500',
  },
  modalSubText: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0',
    lineHeight: '1.5',
  },
  navigationHints: {
    backgroundColor: '#f0f9ff',
    border: '1px solid #0ea5e9',
    borderRadius: '12px',
    padding: '20px',
  },
  hintsTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#0c4a6e',
    margin: '0 0 12px 0',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  hintsList: {
    margin: '0',
    paddingLeft: '16px',
    fontSize: '13px',
    color: '#075985',
    lineHeight: '1.6',
  },
  kbd: {
    backgroundColor: '#f3f4f6',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    padding: '2px 6px',
    fontSize: '12px',
    fontFamily: 'monospace',
    fontWeight: '600',
    color: '#374151',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '24px',
    paddingTop: '20px',
    borderTop: '1px solid #e5e7eb',
  },
  modalCancelButton: {
    padding: '10px 20px',
    backgroundColor: '#f9fafb',
    color: '#374151',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s ease-in-out',
  },
  modalConfirmButton: {
    padding: '10px 20px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.2s ease-in-out',
  },
  modalNextButton: {
    padding: '10px 20px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.2s ease-in-out',
  },
  modalPreviousButton: {
    padding: '10px 20px',
    backgroundColor: '#f9fafb',
    color: '#374151',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s ease-in-out',
  },
  scrollIndicatorDown: {
    position: 'fixed',
    bottom: '10%',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'rgba(59, 130, 246, 0.9)',
    color: 'white',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    zIndex: 2000,
    opacity: 0.9,
    pointerEvents: 'none',
  },
  scrollArrow: {
    fontSize: '14px',
    fontWeight: 'bold',
  },
  scrollText: {
    fontSize: '12px',
  },

  celebrationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    animation: 'celebrationFade 4s ease-in-out',
    pointerEvents: 'none',
    zIndex: 10,
  },

  celebrationCenter: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
  },

  celebrationEmojisRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '15px',
  },

  celebrationEmoji: {
    fontSize: '3rem',
    animation: 'celebrationFadeIn 1s ease-out forwards',
    opacity: 0,
    pointerEvents: 'none',
    textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)',
  },

  celebrationText: {
    fontSize: '1.8rem',
    fontWeight: 'bold',
    color: '#ffffff',
    textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
    animation: 'celebrationFadeIn 1s ease-out forwards',
    opacity: 0,
    marginTop: '5px',
  },
};

// Add CSS for spinner animation
const spinKeyframes = `
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;

// Inject CSS for spinner animation
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = spinKeyframes;
  document.head.appendChild(style);
}

export default AssignmentExecution;
