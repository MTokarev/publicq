import React, { useEffect, useState, useRef } from 'react';
import { Assignment, AssignmentCreate, AssignmentUpdate } from '../../models/assignment';
import { Group } from '../../models/group';
import { User } from '../../models/user';
import { assignmentService } from '../../services/assignmentService';
import { groupService } from '../../services/groupService';
import { userService } from '../../services/userService';
import { formatDateToLocal } from '../../utils/dateUtils';
import UserTable from '../Shared/UserTable';
import { VALIDATION_CONSTRAINTS } from '../../constants/contstants';
import { GenericOperationStatuses } from '../../models/GenericOperationStatuses';
import cssStyles from './AssignmentManagement.module.css';
import { cn } from '../../utils/cn';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  assignmentTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}

interface AssignmentFormModalProps {
  isOpen: boolean;
  assignment?: Assignment;
  apiError?: string;
  onConfirm: (assignment: AssignmentCreate | AssignmentUpdate) => void;
  onCancel: () => void;
}

const AssignmentFormModal = ({ isOpen, assignment, apiError, onConfirm, onCancel }: AssignmentFormModalProps) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDateUtc: '',
    endDateUtc: '',
    showResultsImmediately: false,
    randomizeQuestions: false,
    randomizeAnswers: false,
    groupId: '',
  });
  const [error, setError] = useState('');
  const [groups, setGroups] = useState<Group[]>([]);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadGroups();
      
      if (assignment) {
        // Convert UTC dates to local datetime-local format
        const startLocal = assignment.startDateUtc ? new Date(assignment.startDateUtc).toISOString().slice(0, 16) : '';
        const endLocal = assignment.endDateUtc ? new Date(assignment.endDateUtc).toISOString().slice(0, 16) : '';
        
        setFormData({
          title: assignment.title,
          description: assignment.description || '',
          startDateUtc: startLocal,
          endDateUtc: endLocal,
          showResultsImmediately: assignment.showResultsImmediately,
          randomizeQuestions: assignment.randomizeQuestions,
          randomizeAnswers: assignment.randomizeAnswers,
          groupId: assignment.groupId,
        });
      } else {
        // Set default dates: start date = today, end date = next week
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7);
        
        setFormData({
          title: '',
          description: '',
          startDateUtc: startDate.toISOString().slice(0, 16),
          endDateUtc: endDate.toISOString().slice(0, 16),
          showResultsImmediately: false,
          randomizeQuestions: false,
          randomizeAnswers: false,
          groupId: '',
        });
      }
      setError('');
      
      // Auto-focus on title input when modal opens
      setTimeout(() => {
        if (titleInputRef.current) {
          titleInputRef.current.focus();
        }
      }, 100); // Small delay to ensure modal is rendered
    }
  }, [isOpen, assignment]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen) {
        if (e.key === 'Escape') {
          e.preventDefault();
          onCancel();
        } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          e.preventDefault();
          handleConfirm();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, formData]);

  const loadGroups = async () => {
    try {
      const response = await groupService.getGroups(1, 100); // Get first 100 groups
      setGroups(response.data || []);
    } catch (error) {
    }
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      setError('Title is required');
      return false;
    }
    if (formData.title.length > VALIDATION_CONSTRAINTS.ASSIGNMENT.TITLE_MAX_LENGTH) {
      setError(`Title must not exceed ${VALIDATION_CONSTRAINTS.ASSIGNMENT.TITLE_MAX_LENGTH} characters`);
      return false;
    }
    if (formData.description.length > VALIDATION_CONSTRAINTS.ASSIGNMENT.DESCRIPTION_MAX_LENGTH) {
      setError(`Description must not exceed ${VALIDATION_CONSTRAINTS.ASSIGNMENT.DESCRIPTION_MAX_LENGTH} characters`);
      return false;
    }
    if (!formData.startDateUtc) {
      setError('Start date is required');
      return false;
    }
    if (!formData.endDateUtc) {
      setError('End date is required');
      return false;
    }
    if (new Date(formData.startDateUtc) >= new Date(formData.endDateUtc)) {
      setError('End date must be after start date');
      return false;
    }
    if (!formData.groupId) {
      setError('Group selection is required');
      return false;
    }
    setError('');
    return true;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
    if (error) setError('');
  };

  const handleConfirm = () => {
    if (validateForm()) {
      // Convert local datetime to UTC ISO string
      const startUtc = new Date(formData.startDateUtc).toISOString();
      const endUtc = new Date(formData.endDateUtc).toISOString();
      
      if (assignment) {
        // Update existing assignment
        onConfirm({
          id: assignment.id,
          title: formData.title.trim(),
          description: formData.description.trim(),
          startDateUtc: startUtc,
          endDateUtc: endUtc,
          showResultsImmediately: formData.showResultsImmediately,
          randomizeQuestions: formData.randomizeQuestions,
          randomizeAnswers: formData.randomizeAnswers,
          groupId: assignment.groupId, // Keep the original groupId for updates
        });
      } else {
        // Create new assignment
        onConfirm({
          title: formData.title.trim(),
          description: formData.description.trim(),
          startDateUtc: startUtc,
          endDateUtc: endUtc,
          showResultsImmediately: formData.showResultsImmediately,
          randomizeQuestions: formData.randomizeQuestions,
          randomizeAnswers: formData.randomizeAnswers,
          groupId: formData.groupId,
        });
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className={cssStyles.modalOverlay}>
      <div className={cssStyles.modal}>
        <h3 className={cssStyles.modalTitle}>
          {assignment ? 'Edit Assignment' : 'Create New Assignment'}
        </h3>
        {apiError && <p className={cssStyles.formError}>{apiError}</p>}
        <div className={cssStyles.formContainer}>
          <div className={cssStyles.formGroup}>
            <label className={cssStyles.formLabel}>
              Title: <span style={{color: '#dc2626'}}>*</span>
            </label>
            <input
              ref={titleInputRef}
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className={cssStyles.formInput}
              placeholder="Enter assignment title"
              maxLength={VALIDATION_CONSTRAINTS.ASSIGNMENT.TITLE_MAX_LENGTH}
            />
            <div className={cn(cssStyles.characterCounter, {
              [cssStyles.error]: formData.title.length > VALIDATION_CONSTRAINTS.ASSIGNMENT.TITLE_MAX_LENGTH * 0.9
            })}>
              {formData.title.length}/{VALIDATION_CONSTRAINTS.ASSIGNMENT.TITLE_MAX_LENGTH}
            </div>
          </div>
          
          <div className={cssStyles.formGroup}>
            <label className={cssStyles.formLabel}>
              Description (optional):
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className={cssStyles.formTextarea}
              placeholder="Enter assignment description (optional)"
              rows={3}
              maxLength={VALIDATION_CONSTRAINTS.ASSIGNMENT.DESCRIPTION_MAX_LENGTH}
            />
            <div className={cn(cssStyles.characterCounter, {
              [cssStyles.error]: formData.description.length > VALIDATION_CONSTRAINTS.ASSIGNMENT.DESCRIPTION_MAX_LENGTH * 0.9
            })}>
              {formData.description.length}/{VALIDATION_CONSTRAINTS.ASSIGNMENT.DESCRIPTION_MAX_LENGTH}
            </div>
          </div>

          <div className={cssStyles.formRow}>
            <div className={cssStyles.formGroup}>
              <label className={cssStyles.formLabel}>
                Start Date: <span style={{color: '#dc2626'}}>*</span>
              </label>
              <input
                type="datetime-local"
                name="startDateUtc"
                value={formData.startDateUtc}
                onChange={handleInputChange}
                className={cssStyles.formInput}
              />
            </div>
            
            <div className={cssStyles.formGroup}>
              <label className={cssStyles.formLabel}>
                End Date: <span style={{color: '#dc2626'}}>*</span>
              </label>
              <input
                type="datetime-local"
                name="endDateUtc"
                value={formData.endDateUtc}
                onChange={handleInputChange}
                className={cssStyles.formInput}
              />
            </div>
          </div>

          {!assignment && (
            <div className={cssStyles.formGroup}>
              <label className={cssStyles.formLabel}>
                Group: <span style={{color: '#dc2626'}}>*</span>
              </label>
              <select
                name="groupId"
                value={formData.groupId}
                onChange={handleInputChange}
                className={cssStyles.formSelect}
              >
                <option value="">Select a group</option>
                {groups.map(group => {
                  const hasModules = group.groupMembers && group.groupMembers.length > 0;
                  return (
                    <option 
                      key={group.id} 
                      value={group.id}
                      style={{
                        color: hasModules ? '#374151' : '#9ca3af',
                        fontStyle: hasModules ? 'normal' : 'italic',
                      }}
                      disabled={!hasModules}
                    >
                      {group.title}{!hasModules ? ' (Empty group, add module first)' : ''}
                    </option>
                  );
                })}
              </select>
              <p className={cssStyles.formHelpText}>
                Groups without modules are grayed out and cannot be selected. Add modules to a group first before creating assignments.
              </p>
            </div>
          )}

          <div className={cssStyles.formGroup}>
            <label className={cssStyles.formCheckboxLabel}>
              <input
                type="checkbox"
                name="showResultsImmediately"
                checked={formData.showResultsImmediately}
                onChange={handleInputChange}
                className={cssStyles.formCheckbox}
              />
              Show results immediately after completion
            </label>
          </div>

          <div className={cssStyles.formGroup}>
            <label className={cssStyles.formCheckboxLabel}>
              <input
                type="checkbox"
                name="randomizeQuestions"
                checked={formData.randomizeQuestions}
                onChange={handleInputChange}
                className={cssStyles.formCheckbox}
              />
              Randomize question order
            </label>
          </div>

          <div className={cssStyles.formGroup}>
            <label className={cssStyles.formCheckboxLabel}>
              <input
                type="checkbox"
                name="randomizeAnswers"
                checked={formData.randomizeAnswers}
                onChange={handleInputChange}
                className={cssStyles.formCheckbox}
              />
              Randomize answer order
            </label>
          </div>

          {error && <p className={cssStyles.formError}>{error}</p>}
          <p className={cssStyles.keyboardShortcuts}>
            <kbd className={cssStyles.kbd}>Ctrl</kbd> + <kbd className={cssStyles.kbd}>Enter</kbd> to confirm, <kbd className={cssStyles.kbd}>Esc</kbd> to cancel
          </p>
        </div>
        <div className={cssStyles.modalActions}>
          <button 
            onClick={onCancel} 
            className={cssStyles.modalCancelButton}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
              e.currentTarget.style.borderColor = '#9ca3af';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff';
              e.currentTarget.style.borderColor = '#d1d5db';
            }}
          >
            Cancel
          </button>
          <button 
            onClick={handleConfirm} 
            className={cssStyles.modalConfirmButton}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2563eb';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 6px 8px -2px rgba(59, 130, 246, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#3b82f6';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(59, 130, 246, 0.3)';
            }}
          >
            {assignment ? 'Update Assignment' : 'Create Assignment'}
          </button>
        </div>
      </div>
    </div>
  );
};

const DeleteConfirmationModal = ({ isOpen, assignmentTitle, onConfirm, onCancel }: DeleteConfirmationModalProps) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen) {
        if (e.key === 'Escape') {
          e.preventDefault();
          onCancel();
        } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          e.preventDefault();
          onConfirm();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onConfirm, onCancel]);

  if (!isOpen) return null;

  return (
    <div className={cssStyles.modalOverlay}>
      <div className={cssStyles.modal}>
        <h3 className={cssStyles.modalTitle}>Confirm Assignment Deletion</h3>
        <p className={cssStyles.modalMessage}>
          Are you sure you want to delete the assignment: <strong>{assignmentTitle}</strong>?
        </p>
        <p className={cssStyles.modalWarning}>
          This action cannot be undone and will remove all exam taker assignments.
        </p>
        <p className={cssStyles.keyboardShortcuts}>
          <kbd className={cssStyles.kbd}>Ctrl</kbd> + <kbd className={cssStyles.kbd}>Enter</kbd> to confirm, <kbd className={cssStyles.kbd}>Esc</kbd> to cancel
        </p>
        <div className={cssStyles.modalActions}>
          <button 
            onClick={onCancel} 
            className={cssStyles.modalCancelButton}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
              e.currentTarget.style.borderColor = '#9ca3af';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff';
              e.currentTarget.style.borderColor = '#d1d5db';
            }}
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm} 
            className={cn(cssStyles.modalConfirmButton, cssStyles.actionButtonDanger)}
            style={{
              backgroundColor: '#dc2626',
              boxShadow: '0 4px 6px -1px rgba(220, 38, 38, 0.3)',
            }}
          >
            Delete Assignment
          </button>
        </div>
      </div>
    </div>
  );
};

interface ExamTakerManagementModalProps {
  isOpen: boolean;
  assignmentTitle: string;
  currentExamTakers: string[];
  currentAssignedUsers: User[]; // Add this to pass the full user objects
  onConfirm: (examTakerIds: string[]) => void;
  onCancel: () => void;
}

const ExamTakerManagementModal: React.FC<ExamTakerManagementModalProps> = ({ 
  isOpen, 
  assignmentTitle, 
  currentExamTakers, 
  currentAssignedUsers,
  onConfirm, 
  onCancel 
}) => {
  const [selectedAvailable, setSelectedAvailable] = useState<string[]>([]);
  const [selectedAssigned, setSelectedAssigned] = useState<string[]>([]);
  const [assignedUsers, setAssignedUsers] = useState<User[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [availableUsersCurrentPage, setAvailableUsersCurrentPage] = useState(1);
  const [availableUsersTotalPages, setAvailableUsersTotalPages] = useState(1);
  const [availableUsersLoading, setAvailableUsersLoading] = useState(false);
  const [availableUsersSearch, setAvailableUsersSearch] = useState('');
  const [availableUsersPageSize, setAvailableUsersPageSize] = useState(10);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadData();
      setError('');
    }
  }, [isOpen, currentExamTakers]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen) {
        if (e.key === 'Escape') {
          e.preventDefault();
          onCancel();
        } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          e.preventDefault();
          handleConfirm();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  const loadAvailableUsers = async (page: number = 1, searchTerm: string = '', currentPageSize: number = availableUsersPageSize) => {
    setAvailableUsersLoading(true);
    try {
      let response;
      if (searchTerm.trim()) {
        // Search users with the search term
        response = await userService.searchUsers(searchTerm, '', page, currentPageSize);
      } else {
        // Fetch users with pagination
        response = await userService.fetchUsers(page, currentPageSize);
      }
      
      const users = response.data.data || [];
      const totalPages = response.data.totalPages || 1;
      
      setAvailableUsers(users);
      setAvailableUsersTotalPages(totalPages);
      setAvailableUsersCurrentPage(page);
    } catch (error) {
      setError('Failed to load available users');
      setAvailableUsers([]);
      setAvailableUsersTotalPages(1);
      setAvailableUsersCurrentPage(1);
    } finally {
      setAvailableUsersLoading(false);
    }
  };

  const loadData = () => {
    // Use the passed assigned users instead of fetching them again
    setAssignedUsers(currentAssignedUsers);
    
    // Load available users separately (this has its own loading state)
    loadAvailableUsers(1, '');
  };

  const handleAvailableUsersPageChange = (page: number) => {
    loadAvailableUsers(page, availableUsersSearch, availableUsersPageSize);
  };

  const handleAvailableUsersSearchChange = (searchTerm: string) => {
    setAvailableUsersSearch(searchTerm);
    loadAvailableUsers(1, searchTerm, availableUsersPageSize);
  };

  const handleAvailableUsersPageSizeChange = (newPageSize: number) => {
    setAvailableUsersPageSize(newPageSize);
    loadAvailableUsers(1, availableUsersSearch, newPageSize);
  };

  const handleAvailableUserSelect = (userId: string) => {
    setSelectedAvailable(prev => [...prev, userId]);
    // Clear messages when user makes new selections
    setError('');
  };

  const handleAvailableUserDeselect = (userId: string) => {
    setSelectedAvailable(prev => prev.filter(id => id !== userId));
  };

  const handleAssignedUserSelect = (userId: string) => {
    setSelectedAssigned(prev => [...prev, userId]);
    // Clear messages when user makes new selections
    setError('');
  };

  const handleAssignedUserDeselect = (userId: string) => {
    setSelectedAssigned(prev => prev.filter(id => id !== userId));
  };

  const moveToAssigned = async () => {
    // Move selected users from available to assigned
    if (selectedAvailable.length > 0) {
      try {
        // Get the users to move from the available users list
        const usersToMove = availableUsers.filter(user => selectedAvailable.includes(user.id));
        
        // Check if any users are already assigned to this assignment
        const alreadyAssignedUsers = usersToMove.filter(user => 
          assignedUsers.some(assignedUser => assignedUser.id === user.id)
        );
        
        if (alreadyAssignedUsers.length > 0) {
          const userNames = alreadyAssignedUsers.map(user => 
            user.fullName || user.email
          ).join(', ');
          
          if (alreadyAssignedUsers.length === 1) {
            setError(`User ${userNames} is already assigned to this assignment.`);
          } else {
            setError(`The following users are already assigned to this assignment: ${userNames}`);
          }
          
          // Clear selection to help user understand which action to take
          setSelectedAvailable([]);
          return;
        }
        
        if (usersToMove.length > 0) {
          // Add to assigned users
          setAssignedUsers(prev => [...prev, ...usersToMove]);
          
          // Remove from current available users display
          setAvailableUsers(prev => prev.filter(user => !selectedAvailable.includes(user.id)));
          
          // Clear selection
          setSelectedAvailable([]);
          
          // Clear any previous error
          setError('');
        }
      } catch (error) {
        setError('Failed to move users');
      }
    }
  };

  const moveToUnassigned = () => {
    if (selectedAssigned.length > 0) {
      // Get the users to move from the assigned users list
      const usersToMove = assignedUsers.filter(user => selectedAssigned.includes(user.id));
      
      // Remove from assigned users
      setAssignedUsers(prev => prev.filter(user => !selectedAssigned.includes(user.id)));
      
      // Clear selection
      setSelectedAssigned([]);
      
      // Note: We don't add them back to available users since we're using pagination
      // The user would need to search/navigate to find them again
    }
  };

  const handleConfirm = () => {
    const finalExamTakerIds = assignedUsers.map(user => user.id);
    onConfirm(finalExamTakerIds);
  };

  if (!isOpen) return null;

  return (
    <div className={cssStyles.modalOverlay}>
      <div className={cn(cssStyles.modal, cssStyles.examTakerModal)}>
        <h3 className={cssStyles.modalTitle}>
          Manage Exam Takers for "{assignmentTitle}"
        </h3>
        <div className={cssStyles.examTakerContainer}>
          {/* Available Users Panel */}
          <div className={cssStyles.userPanel}>
            <UserTable
              users={availableUsers}
              selectedUsers={selectedAvailable}
              onUserSelect={handleAvailableUserSelect}
              onUserDeselect={handleAvailableUserDeselect}
              selectionMode="multiple"
              title="All Users"
              emptyMessage="No available users found"
              searchPlaceholder="Search available users..."
              maxHeight="400px"
              enableSearch={true}
              enablePagination={true}
              pageSize={availableUsersPageSize}
              onPageSizeChange={handleAvailableUsersPageSizeChange}
              totalPages={availableUsersTotalPages}
              currentPage={availableUsersCurrentPage}
              onPageChange={handleAvailableUsersPageChange}
              onSearchChange={handleAvailableUsersSearchChange}
              loading={availableUsersLoading}
              externalDataLoaded={true}
            />
          </div>

          {/* Transfer Controls */}
          <div className={cssStyles.transferControls}>
            <button 
              onClick={moveToAssigned}
              disabled={selectedAvailable.length === 0}
              className={cn(cssStyles.transferButton, {
                [cssStyles.transferButtonDisabled]: selectedAvailable.length === 0
              })}
              title="Assign selected users"
            >
              →
            </button>
            <button 
              onClick={moveToUnassigned}
              disabled={selectedAssigned.length === 0}
              className={cn(cssStyles.transferButton, {
                [cssStyles.transferButtonDisabled]: selectedAssigned.length === 0
              })}
              title="Unassign selected users"
            >
              ←
            </button>
          </div>

          {/* Assigned Users Panel */}
          <div className={cssStyles.userPanel}>
            <UserTable
              users={assignedUsers}
              selectedUsers={selectedAssigned}
              onUserSelect={handleAssignedUserSelect}
              onUserDeselect={handleAssignedUserDeselect}
              selectionMode="multiple"
              title={`Assigned Exam Takers (${assignedUsers.length})`}
              emptyMessage="No exam takers assigned"
              searchPlaceholder="Search assigned users..."
              maxHeight="400px"
              enableSearch={true}
              enablePagination={false}
              externalDataLoaded={true}
            />
          </div>
        </div>
        
        {/* Messages displayed horizontally below the panels */}
        {error && <p className={cssStyles.formError}>{error}</p>}
        
        <div className={cssStyles.examTakerFooter}>
          <p className={cssStyles.keyboardShortcuts}>
            <kbd className={cssStyles.kbd}>Ctrl</kbd> + <kbd className={cssStyles.kbd}>Enter</kbd> to confirm, <kbd className={cssStyles.kbd}>Esc</kbd> to cancel
          </p>
          <div className={cssStyles.modalActions}>
            <button 
              onClick={onCancel} 
              className={cssStyles.modalCancelButton}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
                e.currentTarget.style.borderColor = '#9ca3af';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.borderColor = '#d1d5db';
              }}
            >
              Cancel
            </button>
            <button 
              onClick={handleConfirm} 
              className={cssStyles.modalConfirmButton}
              disabled={availableUsersLoading}
            >
              Update Exam Takers
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface AssignmentManagementProps {
  assignmentManagementData: {
    assignments: Assignment[];
    totalPages: number;
    currentPage: number;
    dataLoaded: boolean;
  };
  setAssignmentManagementData: React.Dispatch<React.SetStateAction<{
    assignments: Assignment[];
    totalPages: number;
    currentPage: number;
    dataLoaded: boolean;
  }>>;
}

const AssignmentManagement = ({ assignmentManagementData, setAssignmentManagementData }: AssignmentManagementProps) => {
  const { assignments, totalPages, currentPage: pageNumber, dataLoaded } = assignmentManagementData;
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const initialMountRef = useRef(true);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    assignmentId: string;
    assignmentTitle: string;
  }>({ isOpen: false, assignmentId: '', assignmentTitle: '' });
  const [formModal, setFormModal] = useState<{
    isOpen: boolean;
    assignment?: Assignment;
    apiError?: string;
  }>({ isOpen: false });
  const [examTakerModal, setExamTakerModal] = useState<{
    isOpen: boolean;
    assignmentId: string;
    assignmentTitle: string;
    currentExamTakers: string[];
    currentAssignedUsers: User[];
  }>({ isOpen: false, assignmentId: '', assignmentTitle: '', currentExamTakers: [], currentAssignedUsers: [] });

  // Handle Ctrl+N keyboard shortcut for creating new assignment
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n' && !formModal.isOpen && !examTakerModal.isOpen) {
        e.preventDefault();
        handleCreateAssignment();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [formModal.isOpen, examTakerModal.isOpen]);

  // Add mobile responsive styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @media (max-width: 768px) {
        .assignment-management-header {
          flex-direction: column !important;
          align-items: stretch !important;
          gap: 16px !important;
        }
        .assignment-management-header h2 {
          text-align: center !important;
          margin-bottom: 8px !important;
        }
        .assignment-management-create-button {
          width: 100% !important;
          max-width: 300px !important;
          margin: 0 auto !important;
          font-size: 14px !important;
          padding: 12px 24px !important;
          white-space: nowrap !important;
        }
        .assignment-management-table-container {
          overflow-x: auto !important;
          -webkit-overflow-scrolling: touch !important;
          margin: 0 -20px !important;
          padding: 0 20px !important;
        }
        .assignment-management-table {
          min-width: 900px !important;
        }
        .assignment-management-pagination {
          flex-direction: column !important;
          gap: 16px !important;
          align-items: center !important;
        }
        .assignment-management-pagination-controls {
          gap: 12px !important;
          justify-content: center !important;
        }
        .assignment-management-pagination-button {
          min-height: 44px !important;
          height: 44px !important;
          min-width: 80px !important;
          font-size: 14px !important;
          padding: 10px 16px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          text-align: center !important;
        }
        .assignment-management-page-size {
          justify-content: center !important;
          gap: 8px !important;
        }
        .assignment-management-spacer {
          display: none !important;
        }
      }
      @media (max-width: 480px) {
        .assignment-management-create-button {
          max-width: 280px !important;
          font-size: 13px !important;
          padding: 10px 20px !important;
        }
        .assignment-management-table-container {
          margin: 0 -16px !important;
          padding: 0 16px !important;
        }
        .assignment-management-table {
          min-width: 800px !important;
        }
        .assignment-management-pagination-controls {
          gap: 8px !important;
        }
        .assignment-management-pagination-button {
          min-width: 70px !important;
          height: 44px !important;
          font-size: 12px !important;
          padding: 8px 12px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          text-align: center !important;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const loadAssignments = async (page: number = pageNumber, searchTerm: string = '', currentPageSize: number = pageSize) => {
    setLoading(true);
    setError('');

    try {
      // Pass searchTerm as filterTitle to the API
      const response = await assignmentService.getAssignmentsAsync(page, currentPageSize, searchTerm.trim() || undefined);
      
      const filteredAssignments = response.data?.data || [];
      
      setAssignmentManagementData(prev => ({
        ...prev,
        assignments: filteredAssignments,
        totalPages: response.data?.totalPages || 1,
        currentPage: page,
        dataLoaded: true,
      }));
    } catch (err: any) {
      setError('Failed to load assignments: ' + (err.response?.data?.message || err.message));
      // Set empty array on error to prevent map errors
      setAssignmentManagementData(prev => ({
        ...prev,
        assignments: [],
        totalPages: 1,
        currentPage: 1,
        dataLoaded: true,
      }));
    } finally {
      setLoading(false);
    }
  };

  // Load assignments only if data hasn't been loaded yet
  useEffect(() => {
    if (!dataLoaded) {
      loadAssignments(1);
    }
  }, [dataLoaded]);

  // Handle page size changes
  useEffect(() => {
    if (initialMountRef.current) {
      initialMountRef.current = false;
      return;
    }
    
    // Reset to page 1 when page size changes and reload data
    loadAssignments(1, search, pageSize);
  }, [pageSize]);

  const handlePrevious = () => {
    if (pageNumber > 1) {
      const newPage = pageNumber - 1;
      loadAssignments(newPage, search, pageSize);
    }
  };

  const handleNext = () => {
    if (pageNumber < totalPages) {
      const newPage = pageNumber + 1;
      loadAssignments(newPage, search, pageSize);
    }
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
  };

  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchValue = e.target.value;
    setSearch(searchValue);
    loadAssignments(1, searchValue, pageSize);
  };

  const handleCreateAssignment = () => {
    setFormModal({ isOpen: true });
  };

  const handleEditAssignment = (assignment: Assignment) => {
    setFormModal({ isOpen: true, assignment });
  };

  const handleDeleteAssignment = (assignmentId: string, assignmentTitle: string) => {
    setDeleteModal({ isOpen: true, assignmentId, assignmentTitle });
  };

  const handlePublishAssignment = async (assignmentId: string) => {
    setLoading(true);
    setError('');
    
    try {
      await assignmentService.publishAssignment(assignmentId);
      // Reload assignments after successful operation
      await loadAssignments(pageNumber, search, pageSize);
    } catch (err: any) {
      setError('Failed to publish assignment: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const confirmCreateOrUpdateAssignment = async (assignmentData: AssignmentCreate | AssignmentUpdate) => {
    setLoading(true);
    setError('');
    
    try {
      if ('id' in assignmentData) {
        // Update existing assignment
        await assignmentService.updateAssignment(assignmentData.id, assignmentData);
      } else {
        // Create new assignment
        await assignmentService.createAssignment(assignmentData);
      }
      setFormModal({ isOpen: false });
      // Reload assignments after successful operation
      await loadAssignments(pageNumber, search, pageSize);
    } catch (err: any) {
      // Handle API errors and keep modal open with error message
      const errorMessage = err.response?.data?.message || err.message || 'An unexpected error occurred';
      setFormModal({ 
        isOpen: true, 
        assignment: formModal.assignment,
        apiError: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  const cancelFormModal = () => {
    setFormModal({ isOpen: false });
  };

  const confirmDeleteAssignment = async () => {
    setLoading(true);
    setError('');
    
    try {
      await assignmentService.deleteAssignment(deleteModal.assignmentId);
      setDeleteModal({ isOpen: false, assignmentId: '', assignmentTitle: '' });
      // Reload assignments after successful deletion
      await loadAssignments(pageNumber, search, pageSize);
    } catch (err: any) {
      setError('Failed to delete assignment: ' + (err.response?.data?.message || err.message));
      setDeleteModal({ isOpen: false, assignmentId: '', assignmentTitle: '' });
    } finally {
      setLoading(false);
    }
  };

  const cancelDeleteAssignment = () => {
    setDeleteModal({ isOpen: false, assignmentId: '', assignmentTitle: '' });
  };

  const handleManageExamTakers = async (assignment: Assignment) => {
    setLoading(true);
    try {
      // Fetch current exam takers using the API
      const examTakersResponse = await assignmentService.getExamTakers(assignment.id);
      const currentExamTakerUsers = examTakersResponse.data || [];
      const currentExamTakerIds = currentExamTakerUsers.map(user => user.id);
      
      setExamTakerModal({
        isOpen: true,
        assignmentId: assignment.id,
        assignmentTitle: assignment.title,
        currentExamTakers: currentExamTakerIds,
        currentAssignedUsers: currentExamTakerUsers,
      });
    } catch (error) {
      setError('Failed to load exam takers: ' + (error as any).response?.data?.message || (error as any).message);
    } finally {
      setLoading(false);
    }
  };

  const confirmExamTakerManagement = async (newExamTakerIds: string[]) => {
    setLoading(true);
    setError('');
    
    try {
      const currentExamTakerIds = examTakerModal.currentExamTakers;
      
      // Find users to add and remove
      const toAdd = newExamTakerIds.filter(id => !currentExamTakerIds.includes(id));
      const toRemove = currentExamTakerIds.filter(id => !newExamTakerIds.includes(id));
      
      // Remove exam takers first if any
      if (toRemove.length > 0) {
        await assignmentService.deleteExamTakers(examTakerModal.assignmentId, toRemove);
      }
      
      // Add new exam takers if any
      if (toAdd.length > 0) {
        await assignmentService.addExamTakers(examTakerModal.assignmentId, toAdd);
      }
      
      setExamTakerModal({ isOpen: false, assignmentId: '', assignmentTitle: '', currentExamTakers: [], currentAssignedUsers: [] });
      // Reload assignments after successful operation
      await loadAssignments(pageNumber, search, pageSize);
    } catch (err: any) {
      setError('Failed to manage exam takers: ' + (err.response?.data?.message || err.message));
      setExamTakerModal({ isOpen: false, assignmentId: '', assignmentTitle: '', currentExamTakers: [], currentAssignedUsers: [] });
    } finally {
      setLoading(false);
    }
  };

  const cancelExamTakerManagement = () => {
    setExamTakerModal({ isOpen: false, assignmentId: '', assignmentTitle: '', currentExamTakers: [], currentAssignedUsers: [] });
  };

  const handleDownloadExamTakers = async (assignmentId: string, assignmentTitle: string) => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch assignment details and exam takers
      const [assignmentResponse, examTakersResponse] = await Promise.all([
        assignmentService.getAssignmentById(assignmentId),
        assignmentService.getExamTakers(assignmentId)
      ]);
      
      if (!examTakersResponse.isSuccess || !examTakersResponse.data) {
        throw new Error(examTakersResponse.message || 'Failed to fetch exam takers');
      }
      
      if (!assignmentResponse.isSuccess || !assignmentResponse.data) {
        throw new Error(assignmentResponse.message || 'Failed to fetch assignment details');
      }
      
      const examTakers = examTakersResponse.data;
      const assignment = assignmentResponse.data;
      
      if (examTakers.length === 0) {
        setError('No exam takers found for this assignment');
        return;
      }
      
      // Get local timezone full name
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      // Generate CSV content
      const headers = [
        'Assignment Title', 
        'Direct Assignment Link', 
        'Start Date', 
        'End Date',
        'Timezone', 
        'User ID', 
        'Full Name', 
        'Email', 
        'Date of Birth'
      ];
      const rows = examTakers.map(user => [
        assignmentTitle,
        `${window.location.origin}/assignment/${assignmentId}/${user.id}`,
        formatDateToLocal(assignment.startDateUtc),
        formatDateToLocal(assignment.endDateUtc),
        timezone,
        user.id,
        user.fullName || 'N/A',
        user.email,
        user.dateOfBirth || 'N/A'
      ]);
      
      // Create CSV string
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `${assignmentTitle.replace(/[^a-z0-9]/gi, '_')}_exam_takers.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError('Failed to download exam takers: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AssignmentFormModal
        isOpen={formModal.isOpen}
        assignment={formModal.assignment}
        apiError={formModal.apiError}
        onConfirm={confirmCreateOrUpdateAssignment}
        onCancel={cancelFormModal}
      />
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        assignmentTitle={deleteModal.assignmentTitle}
        onConfirm={confirmDeleteAssignment}
        onCancel={cancelDeleteAssignment}
      />
      <ExamTakerManagementModal
        isOpen={examTakerModal.isOpen}
        assignmentTitle={examTakerModal.assignmentTitle}
        currentExamTakers={examTakerModal.currentExamTakers}
        currentAssignedUsers={examTakerModal.currentAssignedUsers}
        onConfirm={confirmExamTakerManagement}
        onCancel={cancelExamTakerManagement}
      />
      <div className={cssStyles.container}>
        <div className={cssStyles.header}>
          <h2 className={cssStyles.title}><img src="/images/icons/clipboard.svg" alt="" style={{width: '28px', height: '28px', marginRight: '10px'}} />Assignment Management</h2>
          <button 
            onClick={handleCreateAssignment}
            className={cn(cssStyles.createButton, "assignment-management-create-button")}
            title="Create new assignment (Ctrl+N)"
          >
            Create New Assignment
          </button>
        </div>

        <div className={cssStyles.infoSection}>
          <div className={cssStyles.infoHeader}>
            <span className={cssStyles.infoIcon}><img src="/images/icons/information.svg" alt="" style={{width: '16px', height: '16px', verticalAlign: 'middle'}} /></span>
            <span className={cssStyles.infoTitle}>Assignment Settings Information</span>
          </div>
          <div className={cssStyles.infoContent}>
            <p className={cssStyles.infoText}>
              <strong>Randomization:</strong> Question and answer randomization helps reduce cheating by presenting content in different orders to each student.
            </p>
            <p className={cssStyles.infoText}>
              <strong>Results Display:</strong> Control when students can see their scores and feedback after completing the assignment.
            </p>
            <p className={cssStyles.infoText}>
              <strong>Keyboard Shortcut:</strong> Press <kbd className={cssStyles.kbd}>Ctrl+N</kbd> to quickly create a new assignment.
            </p>
          </div>
        </div>

        <input
          type="text"
          placeholder="Search by title..."
          value={search}
          onChange={handleSearchChange}
          className={cssStyles.search}
        />

        {error && <p className={cssStyles.error}>{error}</p>}
        
          {loading ? (
            <p>Loading assignments...</p>
          ) : (
          <>
            <div className={cn(cssStyles.tableContainer, "assignment-management-table-container")}>
              <table className={cn(cssStyles.table, "assignment-management-table")}>
              <thead>
                <tr>
                  <th className={cssStyles.th}>ID</th>
                  <th className={cssStyles.th}>Title</th>
                  <th className={cssStyles.th}>Description</th>
                  <th className={cssStyles.th}>Group</th>
                  <th className={cssStyles.th}>Start Date</th>
                  <th className={cssStyles.th}>End Date</th>
                  <th className={cssStyles.th}>Status</th>
                  <th className={cssStyles.th}>Settings</th>
                  <th className={cssStyles.th}>Created</th>
                  <th className={cssStyles.th}>Last Updated</th>
                  <th className={cssStyles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(assignments) && assignments.map((assignment) => (
                  <tr 
                    key={assignment.id} 
                    className={cssStyles.tr}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f9fafb';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <td className={cssStyles.td}>
                      <div className={cssStyles.idCell}>
                        {assignment.id}
                      </div>
                    </td>
                    <td className={cssStyles.td}>{assignment.title}</td>
                    <td className={cssStyles.td}>
                      <div 
                        className={cssStyles.descriptionCell}
                        title={assignment.description || 'No description available'}
                      >
                        {assignment.description 
                          ? assignment.description.length > 50 
                            ? `${assignment.description.substring(0, 50).split(' ').slice(0, -1).join(' ')}...` 
                            : assignment.description
                          : 'N/A'
                        }
                      </div>
                    </td>
                    <td className={cssStyles.td}>
                      <div className={cssStyles.groupCell}>
                        {assignment.groupTitle || 'No group'}
                      </div>
                    </td>
                    <td className={cssStyles.td}>{formatDateToLocal(assignment.startDateUtc)}</td>
                    <td className={cssStyles.td}>{formatDateToLocal(assignment.endDateUtc)}</td>
                    <td className={cssStyles.td}>
                      <span className={cssStyles.badge} style={{
                        backgroundColor: assignment.isPublished ? '#dcfce7' : '#fef3c7',
                        color: assignment.isPublished ? '#166534' : '#92400e',
                      }}>
                        {assignment.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className={cssStyles.td}>
                      <div className={cssStyles.settingsCell}>
                        {assignment.showResultsImmediately && (
                          <span className={cssStyles.settingTag}>Show Results</span>
                        )}
                        {assignment.randomizeQuestions && (
                          <span className={cssStyles.settingTag}>Random Q</span>
                        )}
                        {assignment.randomizeAnswers && (
                          <span className={cssStyles.settingTag}>Random A</span>
                        )}
                      </div>
                    </td>
                    <td className={cssStyles.td}>
                      <div className={cssStyles.createdCell}>
                        <div>{formatDateToLocal(assignment.createdAtUtc)}</div>
                        <div className={cssStyles.createdBy}>
                          by {assignment.createdByUser || 'Unknown'}
                        </div>
                      </div>
                    </td>
                    <td className={cssStyles.td}>
                      <div className={cssStyles.updatedCell}>
                        {assignment.updatedByUser && assignment.updatedAtUtc ? (
                          <>
                            <div>{formatDateToLocal(assignment.updatedAtUtc)}</div>
                            <div className={cssStyles.createdBy}>
                              by {assignment.updatedByUser}
                            </div>
                          </>
                        ) : (
                          <div className={cssStyles.notUpdated}>N/A</div>
                        )}
                      </div>
                    </td>
                    <td className={cssStyles.td}>
                      <div className={cssStyles.actionContainer}>
                        {!assignment.isPublished && (
                          <button 
                            onClick={() => handlePublishAssignment(assignment.id)} 
                            className={cssStyles.actionButtonPublish}
                          >
                            Publish
                          </button>
                        )}
                        <button 
                          onClick={() => handleEditAssignment(assignment)} 
                          className={cssStyles.actionButton}
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleManageExamTakers(assignment)} 
                          className={cssStyles.actionButtonSecondary}
                        >
                          Exam Takers
                        </button>
                        <button 
                          onClick={() => handleDownloadExamTakers(assignment.id, assignment.title)} 
                          className={cssStyles.actionButtonPublish}
                          title="Download exam takers CSV"
                        >
                          Download CSV
                        </button>
                        <button 
                          onClick={() => handleDeleteAssignment(assignment.id, assignment.title)} 
                          className={cssStyles.actionButtonDanger}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {(!Array.isArray(assignments) || assignments.length === 0) && (
                  <tr>
                    <td colSpan={11} className={cn(cssStyles.td, cssStyles.emptyRow)}>
                      {loading ? 'Loading assignments...' : 'No assignments found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>

            <div className={cn(cssStyles.pagination, "assignment-management-pagination")}>
              <div className={cn(cssStyles.pageSizeContainer, "assignment-management-page-size")}>
                <label className={cssStyles.pageSizeLabel}>Items per page:</label>
                <select 
                  value={pageSize} 
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className={cssStyles.pageSizeSelect}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              
              <div className={cn(cssStyles.paginationControls, "assignment-management-pagination-controls")}>
                <button 
                  onClick={handlePrevious} 
                  disabled={pageNumber === 1 || loading} 
                  className={cn(cssStyles.button, "assignment-management-pagination-button")}
                  style={{
                    opacity: pageNumber === 1 ? 0.5 : 1,
                    cursor: pageNumber === 1 ? 'not-allowed' : 'pointer',
                  }}
                >
                  ◀ Previous
                </button>
                
                <span className={cssStyles.pageInfo}>
                  Page {pageNumber} of {Math.max(totalPages, 1)}
                </span>
                
                <button 
                  onClick={handleNext} 
                  disabled={pageNumber === totalPages || totalPages <= 1 || loading} 
                  className={cn(cssStyles.button, "assignment-management-pagination-button")}
                  style={{
                    opacity: (pageNumber === totalPages || totalPages <= 1) ? 0.5 : 1,
                    cursor: (pageNumber === totalPages || totalPages <= 1) ? 'not-allowed' : 'pointer',
                  }}
                >
                  Next ▶
                </button>
              </div>

              {/* Spacer to balance the layout */}
              <div style={{ width: '120px' }} className="assignment-management-spacer"></div>
            </div>
            </>
          )}
      </div>
    </>
  );
};

export default AssignmentManagement;
