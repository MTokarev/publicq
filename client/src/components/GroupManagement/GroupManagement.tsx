import React, { useEffect, useState, useRef } from 'react';
import { Group, GroupCreate, GroupUpdate } from '../../models/group';
import { Assignment } from '../../models/assignment-base';
import { groupService } from '../../services/groupService';
import { formatDateToLocal } from '../../utils/dateUtils';
import GroupModuleManagement from './GroupModuleManagement';
import { VALIDATION_CONSTRAINTS } from '../../constants/contstants';
import { ValidationMessage } from '../Shared/ValidationComponents';
import cssStyles from './GroupManagement.module.css';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  groupId: string;
  groupTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}

interface GroupFormModalProps {
  isOpen: boolean;
  group?: Group;
  apiError?: string;
  onConfirm: (group: GroupCreate | GroupUpdate) => void;
  onCancel: () => void;
}

const GroupFormModal = ({ isOpen, group, apiError, onConfirm, onCancel }: GroupFormModalProps) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    waitModuleCompletion: false,
    isMemberOrderLocked: false,
  });
  const [error, setError] = useState('');
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (group) {
        setFormData({
          title: group.title,
          description: group.description,
          waitModuleCompletion: group.waitModuleCompletion,
          isMemberOrderLocked: group.isMemberOrderLocked,
        });
      } else {
        setFormData({
          title: '',
          description: '',
          waitModuleCompletion: false,
          isMemberOrderLocked: false,
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
  }, [isOpen, group]);

  useEffect(() => {
    // Set API error when it's provided
    if (apiError) {
      setError(apiError);
    }
  }, [apiError]);

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

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      setError('Title is required');
      return false;
    }
    if (formData.title.length > VALIDATION_CONSTRAINTS.GROUP.TITLE_MAX_LENGTH) {
      setError(`Title must not exceed ${VALIDATION_CONSTRAINTS.GROUP.TITLE_MAX_LENGTH} characters`);
      return false;
    }
    if (formData.description.length > VALIDATION_CONSTRAINTS.GROUP.DESCRIPTION_MAX_LENGTH) {
      setError(`Description must not exceed ${VALIDATION_CONSTRAINTS.GROUP.DESCRIPTION_MAX_LENGTH} characters`);
      return false;
    }
    setError('');
    return true;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
    if (error) setError('');
  };

  const handleConfirm = () => {
    if (validateForm()) {
      if (group) {
        // Update existing group
        onConfirm({
          id: group.id,
          title: formData.title.trim(),
          description: formData.description.trim(),
          waitModuleCompletion: formData.waitModuleCompletion,
          isMemberOrderLocked: formData.isMemberOrderLocked,
          groupMembers: group.groupMembers,
        });
      } else {
        // Create new group
        onConfirm({
          title: formData.title.trim(),
          description: formData.description.trim(),
          waitModuleCompletion: formData.waitModuleCompletion,
          isMemberOrderLocked: formData.isMemberOrderLocked,
          groupMembers: [],
        });
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>
        <h3 style={styles.modalTitle}>
          {group ? 'Edit Group' : 'Create New Group'}
        </h3>
        {error && (
          <ValidationMessage type="error" message={error} />
        )}
        <div style={styles.formContainer}>
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Title:</label>
            <input
              ref={titleInputRef}
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              style={styles.formInput}
              placeholder="Enter group title"
              maxLength={VALIDATION_CONSTRAINTS.GROUP.TITLE_MAX_LENGTH}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#3b82f6';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = error ? '#dc2626' : '#d1d5db';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            <div style={{
              ...styles.characterCounter,
              color: formData.title.length > VALIDATION_CONSTRAINTS.GROUP.TITLE_MAX_LENGTH * 0.9 ? '#dc2626' : '#6b7280'
            }}>
              {formData.title.length}/{VALIDATION_CONSTRAINTS.GROUP.TITLE_MAX_LENGTH}
            </div>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Description (optional):</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              style={styles.formTextarea}
              placeholder="Enter group description (optional)"
              rows={3}
              maxLength={VALIDATION_CONSTRAINTS.GROUP.DESCRIPTION_MAX_LENGTH}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#3b82f6';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = error ? '#dc2626' : '#d1d5db';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            <div style={{
              ...styles.characterCounter,
              color: formData.description.length > VALIDATION_CONSTRAINTS.GROUP.DESCRIPTION_MAX_LENGTH * 0.9 ? '#dc2626' : '#6b7280'
            }}>
              {formData.description.length}/{VALIDATION_CONSTRAINTS.GROUP.DESCRIPTION_MAX_LENGTH}
            </div>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.formCheckboxLabel}>
              <input
                type="checkbox"
                name="waitModuleCompletion"
                checked={formData.waitModuleCompletion}
                onChange={handleInputChange}
                style={styles.formCheckbox}
              />
              Enable progression control (students must wait for full duration)
            </label>
            <p style={styles.formHelpText}>
              When enabled, students cannot start the next module until the current module's time duration has elapsed, even if completed early.
            </p>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.formCheckboxLabel}>
              <input
                type="checkbox"
                name="isMemberOrderLocked"
                checked={formData.isMemberOrderLocked}
                onChange={handleInputChange}
                style={styles.formCheckbox}
              />
              Lock order (enforce sequential module access)
            </label>
            <p style={styles.formHelpText}>
              When enabled, exam takers cannot launch modules out of order and must complete them sequentially.
            </p>
          </div>
          <p style={styles.keyboardShortcuts}>
            <kbd style={styles.kbd}>Ctrl</kbd> + <kbd style={styles.kbd}>Enter</kbd> to confirm, <kbd style={styles.kbd}>Esc</kbd> to cancel
          </p>
        </div>
        <div style={styles.modalActions}>
          <button 
            onClick={onCancel} 
            style={styles.modalCancelButton}
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
            style={styles.modalConfirmButton}
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
            {group ? 'Update Group' : 'Create Group'}
          </button>
        </div>
      </div>
    </div>
  );
};

const DeleteConfirmationModal = ({ isOpen, groupId, groupTitle, onConfirm, onCancel }: DeleteConfirmationModalProps) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);

  useEffect(() => {
    const fetchAssignments = async () => {
      if (isOpen && groupId) {
        setLoadingAssignments(true);
        try {
          const response = await groupService.getGroupAssignments(groupId);
          if (response.isSuccess) {
            setAssignments(response.data || []);
          }
        } catch (error) {
          setAssignments([]);
        } finally {
          setLoadingAssignments(false);
        }
      }
    };

    fetchAssignments();
  }, [isOpen, groupId]);

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
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>
        <h3 style={styles.modalTitle}>Confirm Group Deletion</h3>
        <p style={styles.modalMessage}>
          Are you sure you want to delete the group: <strong>{groupTitle}</strong>?
        </p>
        <p style={styles.modalWarning}>
          This action cannot be undone and will remove all group members.
        </p>
        
        {loadingAssignments ? (
          <div style={styles.assignmentSection}>
            <p style={styles.assignmentSectionTitle}>📋 Checking associated assignments...</p>
          </div>
        ) : assignments.length > 0 ? (
          <div style={styles.assignmentSection}>
            <p style={styles.assignmentSectionTitle}>
              ⚠️ <strong>Warning:</strong> This group has {assignments.length} associated assignment{assignments.length > 1 ? 's' : ''}:
            </p>
            <ul style={styles.assignmentList}>
              {assignments.map((assignment) => (
                <li key={assignment.id} style={styles.assignmentItem}>
                  <strong>{assignment.title}</strong>
                  {assignment.description && ` - ${assignment.description}`}
                </li>
              ))}
            </ul>
            <p style={styles.assignmentWarning}>
              <strong>Deleting this group will also permanently delete all these assignments!</strong>
            </p>
          </div>
        ) : (
          <div style={styles.assignmentSection}>
            <p style={styles.noAssignments}><img src="/images/icons/check.svg" alt="Check" style={{width: '16px', height: '16px', marginRight: '6px', verticalAlign: 'middle', display: 'inline-block'}} /> No assignments are associated with this group.</p>
          </div>
        )}
        <p style={styles.keyboardShortcuts}>
          <kbd style={styles.kbd}>Ctrl</kbd> + <kbd style={styles.kbd}>Enter</kbd> to confirm, <kbd style={styles.kbd}>Esc</kbd> to cancel
        </p>
        <div style={styles.modalActions}>
          <button 
            onClick={onCancel} 
            style={styles.modalCancelButton}
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
            style={{
              ...styles.modalConfirmButton,
              backgroundColor: '#dc2626',
              boxShadow: '0 4px 6px -1px rgba(220, 38, 38, 0.3)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#b91c1c';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 6px 8px -2px rgba(220, 38, 38, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#dc2626';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(220, 38, 38, 0.3)';
            }}
          >
            Delete Group
          </button>
        </div>
      </div>
    </div>
  );
};

interface GroupManagementProps {
  groupManagementData: {
    groups: Group[];
    totalPages: number;
    currentPage: number;
    dataLoaded: boolean;
  };
  setGroupManagementData: React.Dispatch<React.SetStateAction<{
    groups: Group[];
    totalPages: number;
    currentPage: number;
    dataLoaded: boolean;
  }>>;
}

const GroupManagement = ({ groupManagementData, setGroupManagementData }: GroupManagementProps) => {
  const { groups, totalPages, currentPage: pageNumber, dataLoaded } = groupManagementData;
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const initialMountRef = useRef(true);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    groupId: string;
    groupTitle: string;
  }>({ isOpen: false, groupId: '', groupTitle: '' });
  const [formModal, setFormModal] = useState<{
    isOpen: boolean;
    group?: Group;
    apiError?: string;
  }>({ isOpen: false });
  const [moduleManagement, setModuleManagement] = useState<{
    isOpen: boolean;
    group?: Group;
  }>({ isOpen: false });

  // Handle Ctrl+N keyboard shortcut for creating new group
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n' && !formModal.isOpen && !moduleManagement.isOpen) {
        e.preventDefault();
        handleCreateGroup();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [formModal.isOpen, moduleManagement.isOpen]);

  // Add mobile responsive styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @media (max-width: 768px) {
        .group-management-header {
          flex-direction: column !important;
          align-items: stretch !important;
          gap: 16px !important;
        }
        .group-management-header h2 {
          text-align: center !important;
          margin-bottom: 8px !important;
        }
        .group-management-create-button {
          width: 100% !important;
          max-width: 300px !important;
          margin: 0 auto !important;
          font-size: 14px !important;
          padding: 12px 24px !important;
          white-space: nowrap !important;
        }
        .group-management-table-container {
          overflow-x: auto !important;
          -webkit-overflow-scrolling: touch !important;
          margin: 0 -20px !important;
          padding: 0 20px !important;
        }
        .group-management-table {
          min-width: 700px !important;
        }
        .group-management-pagination {
          flex-direction: column !important;
          gap: 16px !important;
          align-items: center !important;
        }
        .group-management-pagination-controls {
          gap: 12px !important;
          justify-content: center !important;
        }
        .group-management-pagination-button {
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
        .group-management-page-size {
          justify-content: center !important;
          gap: 8px !important;
        }
        .group-management-spacer {
          display: none !important;
        }
      }
      @media (max-width: 480px) {
        .group-management-create-button {
          max-width: 280px !important;
          font-size: 13px !important;
          padding: 10px 20px !important;
        }
        .group-management-table-container {
          margin: 0 -16px !important;
          padding: 0 16px !important;
        }
        .group-management-table {
          min-width: 600px !important;
        }
        .group-management-pagination-controls {
          gap: 8px !important;
        }
        .group-management-pagination-button {
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

  const loadGroups = async (page: number = pageNumber, searchTerm: string = '', currentPageSize: number = pageSize) => {
    setLoading(true);
    setError('');

    try {
      const response = await groupService.getGroups(page, currentPageSize);
      
      // Filter by search term if provided (client-side filtering for now)
      let filteredGroups = response.data || [];
      if (searchTerm && Array.isArray(filteredGroups)) {
        filteredGroups = filteredGroups.filter(group => 
          group.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          group.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      setGroupManagementData(prev => ({
        ...prev,
        groups: filteredGroups,
        totalPages: response.totalPages || 1,
        currentPage: page,
        dataLoaded: true,
      }));
    } catch (err: any) {
      setError('Failed to load groups: ' + (err.response?.data?.message || err.message));
      // Set empty array on error to prevent map errors
      setGroupManagementData(prev => ({
        ...prev,
        groups: [],
        totalPages: 1,
        currentPage: 1,
        dataLoaded: true,
      }));
    } finally {
      setLoading(false);
    }
  };

  // Load groups only if data hasn't been loaded yet
  useEffect(() => {
    if (!dataLoaded) {
      loadGroups(1);
    }
  }, [dataLoaded]);

  // Handle page size changes
  useEffect(() => {
    if (initialMountRef.current) {
      initialMountRef.current = false;
      return;
    }
    
    // Reset to page 1 when page size changes and reload data
    loadGroups(1, search, pageSize);
  }, [pageSize]);

  const handlePrevious = () => {
    if (pageNumber > 1) {
      const newPage = pageNumber - 1;
      loadGroups(newPage, search, pageSize);
    }
  };

  const handleNext = () => {
    if (pageNumber < totalPages) {
      const newPage = pageNumber + 1;
      loadGroups(newPage, search, pageSize);
    }
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
  };

  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchValue = e.target.value;
    setSearch(searchValue);
    loadGroups(1, searchValue, pageSize);
  };

  const handleCreateGroup = () => {
    setFormModal({ isOpen: true });
  };

  const handleEditGroup = (group: Group) => {
    setFormModal({ isOpen: true, group });
  };

  const handleDeleteGroup = (groupId: string, groupTitle: string) => {
    setDeleteModal({ isOpen: true, groupId, groupTitle });
  };

  const handleManageModules = (group: Group) => {
    setModuleManagement({ isOpen: true, group });
  };

  const confirmCreateOrUpdateGroup = async (groupData: GroupCreate | GroupUpdate) => {
    setLoading(true);
    setError('');
    
    try {
      if ('id' in groupData) {
        // Update existing group
        await groupService.updateGroup(groupData);
      } else {
        // Create new group
        await groupService.createGroup(groupData);
      }
      setFormModal({ isOpen: false });
      // Reload groups after successful operation
      await loadGroups(pageNumber, search, pageSize);
    } catch (err: any) {
      // Handle API errors and keep modal open with error message
      const errorMessage = err.response?.data?.message || err.message || 'An unexpected error occurred';
      setFormModal({ 
        isOpen: true, 
        group: formModal.group,
        apiError: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  const cancelFormModal = () => {
    setFormModal({ isOpen: false });
  };

  const confirmDeleteGroup = async () => {
    setLoading(true);
    setError('');
    
    try {
      await groupService.deleteGroup(deleteModal.groupId);
      setDeleteModal({ isOpen: false, groupId: '', groupTitle: '' });
      // Reload groups after successful deletion
      await loadGroups(pageNumber, search, pageSize);
    } catch (err: any) {
      setError('Failed to delete group: ' + (err.response?.data?.message || err.message));
      setDeleteModal({ isOpen: false, groupId: '', groupTitle: '' });
    } finally {
      setLoading(false);
    }
  };

  const cancelDeleteGroup = () => {
    setDeleteModal({ isOpen: false, groupId: '', groupTitle: '' });
  };

  const handleGroupUpdated = (updatedGroup: Group) => {
    setGroupManagementData(prev => ({
      ...prev,
      groups: prev.groups.map(g => g.id === updatedGroup.id ? updatedGroup : g),
    }));
    
    // Also update the moduleManagement group if it's the same group
    setModuleManagement(prev => {
      if (prev.group && prev.group.id === updatedGroup.id) {
        return { ...prev, group: updatedGroup };
      }
      return prev;
    });
  };

  return (
    <>
      <GroupFormModal
        isOpen={formModal.isOpen}
        group={formModal.group}
        apiError={formModal.apiError}
        onConfirm={confirmCreateOrUpdateGroup}
        onCancel={cancelFormModal}
      />
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        groupId={deleteModal.groupId}
        groupTitle={deleteModal.groupTitle}
        onConfirm={confirmDeleteGroup}
        onCancel={cancelDeleteGroup}
      />
      {moduleManagement.group && (
        <GroupModuleManagement
          isOpen={moduleManagement.isOpen}
          group={moduleManagement.group}
          onClose={() => setModuleManagement({ isOpen: false })}
          onGroupUpdated={handleGroupUpdated}
        />
      )}
      <div style={styles.container}>
        <div style={styles.header} className="group-management-header">
          <h2 className={cssStyles.title} style={{...styles.title, display: 'flex', alignItems: 'center'}}><img src="/images/icons/group.svg" alt="" style={{width: '28px', height: '28px', marginRight: '10px'}} />Group Management</h2>
          <button 
            onClick={handleCreateGroup}
            style={styles.createButton}
            className="group-management-create-button"
            title="Create new group (Ctrl+N)"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#059669';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 6px 8px -2px rgba(5, 150, 105, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#10b981';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(5, 150, 105, 0.3)';
            }}
          >
            Create New Group
          </button>
        </div>

        <div style={styles.infoSection}>
          <div style={styles.infoHeader}>
            <span style={styles.infoIcon}><img src="/images/icons/information.svg" alt="" style={{width: '16px', height: '16px', verticalAlign: 'middle'}} /></span>
            <span style={styles.infoTitle}>Group Settings Information</span>
          </div>
          <div style={styles.infoContent}>
            <p style={styles.infoText}>
              <strong>Progression Control:</strong> When enabled, students must wait for the full duration of each module to elapse before they can start the next module, even if they complete it early.
            </p>
            <p style={styles.infoText}>
              <strong>Order Lock:</strong> When enabled, exam takers cannot launch modules out of order and must complete them sequentially based on the group member arrangement.
            </p>
            <p style={styles.infoText}>
              These settings help ensure students spend adequate time on learning material and maintain proper learning progression through the curriculum.
            </p>
            <p style={styles.infoText}>
              <strong>Keyboard Shortcut:</strong> Press <kbd style={styles.kbd}>Ctrl+N</kbd> to quickly create a new group.
            </p>
          </div>
        </div>

        <input
          type="text"
          placeholder="Search by title or description..."
          value={search}
          onChange={handleSearchChange}
          style={styles.search}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#3b82f6';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = '#d1d5db';
            e.currentTarget.style.boxShadow = 'none';
          }}
        />

        {error && (
          <ValidationMessage type="error" message={error} />
        )}
        {loading ? (
          <p>Loading groups...</p>
        ) : (
          <>
            <div className="group-management-table-container" style={styles.tableContainer}>
              <table style={styles.table} className="group-management-table">
              <thead>
                <tr>
                  <th style={styles.th}>Title</th>
                  <th style={styles.th}>Description</th>
                  <th style={styles.th}>Members</th>
                  <th style={styles.th}>Progression Control</th>
                  <th style={styles.th}>Order Lock</th>
                  <th style={styles.th}>Created</th>
                  <th style={styles.th}>Last Updated</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(groups) && groups.map((group) => (
                  <tr 
                    key={group.id} 
                    style={styles.tr}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f9fafb';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <td style={styles.td}>{group.title}</td>
                    <td style={styles.td}>
                      <div 
                        style={styles.descriptionCell}
                        title={group.description || 'No description available'}
                      >
                        {group.description 
                          ? group.description.length > 50 
                            ? `${group.description.substring(0, 50).split(' ').slice(0, -1).join(' ')}...` 
                            : group.description
                          : 'N/A'
                        }
                      </div>
                    </td>
                    <td style={styles.td}>{group.groupMembers?.length || 0}</td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.badge,
                        backgroundColor: group.waitModuleCompletion ? '#dcfce7' : '#fef3c7',
                        color: group.waitModuleCompletion ? '#166534' : '#92400e',
                      }}>
                        {group.waitModuleCompletion ? 'Enabled' : 'Disabled'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.badge,
                        backgroundColor: group.isMemberOrderLocked ? '#dcfce7' : '#fef3c7',
                        color: group.isMemberOrderLocked ? '#166534' : '#92400e',
                      }}>
                        {group.isMemberOrderLocked ? 'Locked' : 'Unlocked'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.createdCell}>
                        <div>{formatDateToLocal(group.createdAtUtc)}</div>
                        <div style={styles.createdBy}>
                          by {group.createdByUser || 'Unknown'}
                        </div>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.updatedCell}>
                        {group.updatedByUserId ? (
                          <>
                            <div>{formatDateToLocal(group.updatedAtUtc)}</div>
                            <div style={styles.createdBy}>
                              by {group.updatedByUserId}
                            </div>
                          </>
                        ) : (
                          <div style={styles.notUpdated}>N/A</div>
                        )}
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.actionContainer}>
                        <button 
                          onClick={() => handleManageModules(group)} 
                          style={styles.actionButtonModule}
                        >
                          Modules
                        </button>
                        <button 
                          onClick={() => handleEditGroup(group)} 
                          style={styles.actionButton}
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteGroup(group.id, group.title)} 
                          style={styles.actionButtonDanger}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {(!Array.isArray(groups) || groups.length === 0) && (
                  <tr>
                    <td colSpan={8} style={{ ...styles.td, textAlign: 'center', fontStyle: 'italic', color: '#6b7280' }}>
                      {loading ? 'Loading groups...' : 'No groups found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>

            <div style={styles.pagination} className="group-management-pagination">
              <div style={styles.pageSizeContainer} className="group-management-page-size">
                <label style={styles.pageSizeLabel}>Items per page:</label>
                <select 
                  value={pageSize} 
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  style={styles.pageSizeSelect}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              
              <div style={styles.paginationControls} className="group-management-pagination-controls">
                <button 
                  onClick={handlePrevious} 
                  disabled={pageNumber === 1 || loading} 
                  className="group-management-pagination-button"
                  style={{
                    ...styles.button,
                    opacity: pageNumber === 1 ? 0.5 : 1,
                    cursor: pageNumber === 1 ? 'not-allowed' : 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    if (pageNumber > 1) {
                      e.currentTarget.style.backgroundColor = '#2563eb';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(59, 130, 246, 0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (pageNumber > 1) {
                      e.currentTarget.style.backgroundColor = '#3b82f6';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
                    }
                  }}
                >
                  ◀ Previous
                </button>
                
                <span style={styles.pageInfo}>
                  Page {pageNumber} of {Math.max(totalPages, 1)}
                </span>
                
                <button 
                  onClick={handleNext} 
                  disabled={pageNumber === totalPages || totalPages <= 1 || loading} 
                  className="group-management-pagination-button"
                  style={{
                    ...styles.button,
                    opacity: (pageNumber === totalPages || totalPages <= 1) ? 0.5 : 1,
                    cursor: (pageNumber === totalPages || totalPages <= 1) ? 'not-allowed' : 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    if (pageNumber < totalPages && totalPages > 1) {
                      e.currentTarget.style.backgroundColor = '#2563eb';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(59, 130, 246, 0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (pageNumber < totalPages && totalPages > 1) {
                      e.currentTarget.style.backgroundColor = '#3b82f6';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
                    }
                  }}
                >
                  Next ▶
                </button>
              </div>

              {/* Spacer to balance the layout */}
              <div style={{ width: '120px' }} className="group-management-spacer"></div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '0',
    maxWidth: '100%',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 700,
    margin: '0',
    color: '#111827',
    letterSpacing: '-0.025em',
  },
  createButton: {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: 600,
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#10b981',
    color: '#ffffff',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    boxShadow: '0 4px 6px -1px rgba(5, 150, 105, 0.3)',
  },
  infoSection: {
    backgroundColor: '#f0f9ff',
    border: '1px solid #bae6fd',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '24px',
  },
  infoHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
  },
  infoIcon: {
    fontSize: '16px',
  },
  infoTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#1e40af',
  },
  infoContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  infoText: {
    fontSize: '13px',
    color: '#374151',
    margin: '0',
    lineHeight: '1.4',
  },
  search: {
    width: '100%',
    maxWidth: '400px',
    padding: '12px 16px',
    fontSize: '14px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    backgroundColor: '#ffffff',
    boxSizing: 'border-box',
    transition: 'all 0.2s ease-in-out',
    outline: 'none',
    marginBottom: '24px',
  },
  error: {
    fontSize: '14px',
    color: '#dc2626',
    marginBottom: '16px',
    padding: '12px 16px',
    backgroundColor: '#fef2f2',
    borderRadius: '8px',
    border: '1px solid #fecaca',
  },
  tableContainer: {
    overflowX: 'auto',
    WebkitOverflowScrolling: 'touch',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    backgroundColor: '#ffffff',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  },
  table: {
    width: '100%',
    minWidth: '900px',
    borderCollapse: 'collapse',
    backgroundColor: 'transparent',
    borderRadius: '0',
    overflow: 'visible',
    boxShadow: 'none',
    border: 'none',
  },
  th: {
    textAlign: 'left',
    padding: '16px 20px',
    backgroundColor: '#f9fafb',
    borderBottom: '1px solid #e5e7eb',
    fontWeight: 600,
    fontSize: '14px',
    color: '#374151',
    letterSpacing: '0.025em',
  },
  tr: {
    transition: 'background-color 0.2s ease-in-out',
  },
  td: {
    padding: '16px 20px',
    borderBottom: '1px solid #f3f4f6',
    fontSize: '14px',
    color: '#374151',
    verticalAlign: 'top',
  },
  descriptionCell: {
    maxWidth: '200px',
    wordWrap: 'break-word',
    lineHeight: '1.4',
    whiteSpace: 'pre-wrap',
  },
  createdCell: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  updatedCell: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  createdBy: {
    fontSize: '11px',
    color: '#6b7280',
    fontStyle: 'italic',
  },
  notUpdated: {
    fontSize: '12px',
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  badge: {
    display: 'inline-block',
    padding: '4px 8px',
    fontSize: '12px',
    fontWeight: 500,
    borderRadius: '6px',
  },
  pagination: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: '32px',
    gap: '16px',
  },
  pageSizeContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    minWidth: '120px',
  },
  pageSizeLabel: {
    fontSize: '14px',
    color: '#6b7280',
    fontWeight: 500,
  },
  pageSizeSelect: {
    padding: '6px 8px',
    fontSize: '14px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    backgroundColor: '#ffffff',
    color: '#374151',
    cursor: 'pointer',
    outline: 'none',
  },
  paginationControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  button: {
    padding: '10px 16px',
    fontSize: '14px',
    fontWeight: 500,
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    height: '44px',
    minHeight: '44px',
    minWidth: '100px',
    textAlign: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    whiteSpace: 'nowrap',
  },
  pageInfo: {
    fontSize: '14px',
    color: '#6b7280',
    fontWeight: 500,
  },
  actionContainer: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
  },
  actionButton: {
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: 500,
    borderRadius: '6px',
    border: 'none',
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  },
  actionButtonModule: {
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: 500,
    borderRadius: '6px',
    border: 'none',
    backgroundColor: '#10b981',
    color: '#ffffff',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  },
  actionButtonDanger: {
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: 500,
    borderRadius: '6px',
    border: 'none',
    backgroundColor: '#dc2626',
    color: '#ffffff',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(4px)',
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '32px',
    maxWidth: '500px',
    width: '90%',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.8)',
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: 700,
    marginBottom: '16px',
    color: '#111827',
    letterSpacing: '-0.025em',
  },
  modalMessage: {
    fontSize: '16px',
    marginBottom: '12px',
    color: '#374151',
    lineHeight: '1.5',
  },
  modalWarning: {
    fontSize: '14px',
    color: '#dc2626',
    marginBottom: '24px',
    fontStyle: 'italic',
    padding: '12px 16px',
    backgroundColor: '#fef2f2',
    borderRadius: '8px',
    border: '1px solid #fecaca',
  },
  assignmentSection: {
    marginBottom: '20px',
    padding: '16px',
    backgroundColor: '#fffbeb',
    borderRadius: '8px',
    border: '1px solid #fed7aa',
  },
  assignmentSectionTitle: {
    fontSize: '14px',
    color: '#92400e',
    fontWeight: '600',
    margin: '0 0 12px 0',
  },
  assignmentList: {
    margin: '8px 0',
    paddingLeft: '20px',
    maxHeight: '120px',
    overflowY: 'auto' as const,
  },
  assignmentItem: {
    fontSize: '13px',
    color: '#374151',
    marginBottom: '4px',
    lineHeight: '1.4',
  },
  assignmentWarning: {
    fontSize: '14px',
    color: '#dc2626',
    fontWeight: '600',
    margin: '12px 0 0 0',
  },
  noAssignments: {
    fontSize: '14px',
    color: '#059669',
    fontWeight: '500',
    margin: '0',
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '24px',
  },
  modalCancelButton: {
    padding: '12px 20px',
    fontSize: '14px',
    fontWeight: 500,
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    backgroundColor: '#ffffff',
    color: '#374151',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
  },
  modalConfirmButton: {
    padding: '12px 20px',
    fontSize: '14px',
    fontWeight: 600,
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)',
  },
  formContainer: {
    marginBottom: '24px',
  },
  formGroup: {
    marginBottom: '16px',
  },
  formLabel: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 600,
    marginBottom: '8px',
    color: '#374151',
  },
  formInput: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '14px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    backgroundColor: '#ffffff',
    boxSizing: 'border-box',
    transition: 'all 0.2s ease-in-out',
    outline: 'none',
  },
  formTextarea: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '14px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    backgroundColor: '#ffffff',
    boxSizing: 'border-box',
    transition: 'all 0.2s ease-in-out',
    outline: 'none',
    resize: 'vertical',
  },
  formCheckboxLabel: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '14px',
    color: '#374151',
    cursor: 'pointer',
  },
  formCheckbox: {
    marginRight: '8px',
    width: '16px',
    height: '16px',
    cursor: 'pointer',
  },
  formHelpText: {
    fontSize: '12px',
    color: '#6b7280',
    margin: '4px 0 0 24px',
    lineHeight: '1.4',
    fontStyle: 'italic',
  },
  formError: {
    fontSize: '12px',
    color: '#dc2626',
    margin: '16px 0 16px 0',
    padding: '8px 12px',
    backgroundColor: '#fef2f2',
    borderRadius: '6px',
    border: '1px solid #fecaca',
  },
  keyboardShortcuts: {
    fontSize: '11px',
    color: '#9ca3af',
    margin: '8px 0 0 0',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  kbd: {
    display: 'inline-block',
    padding: '2px 4px',
    fontSize: '10px',
    lineHeight: '1',
    color: '#495057',
    backgroundColor: '#f8f9fa',
    borderRadius: '3px',
    border: '1px solid #ced4da',
    boxShadow: 'inset 0 -1px 0 rgba(0,0,0,0.25)',
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
  },
  characterCounter: {
    fontSize: '12px',
    textAlign: 'right',
    marginTop: '4px',
    fontFamily: 'monospace',
  },
};

export default GroupManagement;
