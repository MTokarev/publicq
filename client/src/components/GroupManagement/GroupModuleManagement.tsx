import React, { useEffect, useState } from 'react';
import { Group } from '../../models/group';
import { AssessmentModuleDto } from '../../models/assessment-module';
import { groupService } from '../../services/groupService';
import { assessmentService } from '../../services/assessmentService';
import { config } from '../../config';
import { GroupMemberCreate } from '../../models/group-member';

interface GroupModuleManagementProps {
  isOpen: boolean;
  group: Group;
  onClose: () => void;
  onGroupUpdated: (updatedGroup: Group) => void;
}

interface AddModuleModalProps {
  isOpen: boolean;
  availableModules: AssessmentModuleDto[];
  loading: boolean;
  onConfirm: (moduleId: string) => void;
  onCancel: () => void;
}

const AddModuleModal = ({ isOpen, availableModules, loading, onConfirm, onCancel }: AddModuleModalProps) => {
  const [selectedModuleId, setSelectedModuleId] = useState<string>('');
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedModuleId('');
      setError('');
      setSearchTerm('');
      setIsDropdownOpen(false);
    }
  }, [isOpen]);

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
  }, [isOpen, selectedModuleId]);

  const handleConfirm = () => {
    if (!selectedModuleId) {
      setError('Please select an assessment module');
      return;
    }
    
    // Check if the selected module is published and current
    const selectedModule = availableModules.find(m => m.id === selectedModuleId);
    if (!selectedModule?.hasPublishedVersions || !selectedModule?.latestVersion?.isPublished) {
      setError('Selected module must have a published current version before it can be added to a group');
      return;
    }
    
    setError('');
    onConfirm(selectedModuleId);
  };

  if (!isOpen) return null;

  // Filter modules based on search term
  const filteredModules = availableModules.filter(module => {
    const title = module.latestVersion?.title || '';
    const searchLower = searchTerm.toLowerCase();
    return title.toLowerCase().includes(searchLower);
  });

  // Limit to configured maximum
  const displayModules = filteredModules.slice(0, config.ui.maxModulesInDropdown);
  const hasMoreModules = filteredModules.length > config.ui.maxModulesInDropdown;
  const canConfirm = selectedModuleId && availableModules.find(m => m.id === selectedModuleId)?.hasPublishedVersions && availableModules.find(m => m.id === selectedModuleId)?.latestVersion?.isPublished;

  const selectedModule = availableModules.find(m => m.id === selectedModuleId);
  const getModuleStatusText = (module: AssessmentModuleDto) => {
    if (!module.hasPublishedVersions) {
      return '(No Published Versions)';
    }
    if (!module.latestVersion?.isPublished) {
      return '(Outdated - Latest Version Not Published)';
    }
    return '(Published)';
  };
  
  const displayValue = selectedModule ? 
    `${selectedModule.latestVersion?.title || 'Untitled Module'} ${getModuleStatusText(selectedModule)}` : 
    searchTerm;

  const handleModuleSelect = (module: AssessmentModuleDto) => {
    setSelectedModuleId(module.id);
    setSearchTerm('');
    setIsDropdownOpen(false);
    if (error) setError('');
  };

  return (
    <div style={styles.addModalOverlay}>
      <div style={styles.modal}>
        <h3 style={styles.modalTitle}>Add Assessment Module</h3>
        <div style={styles.formContainer}>
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Select Assessment Module:</label>
            {availableModules.length === 0 ? (
              <p style={styles.loadingText}>{loading ? 'Loading available modules...' : 'No modules available'}</p>
            ) : (
              <div style={styles.searchableDropdown}>
                <div style={styles.searchInputContainer}>
                  <input
                    type="text"
                    value={displayValue}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setSelectedModuleId('');
                      setIsDropdownOpen(true);
                    }}
                    onFocus={() => {
                      setIsDropdownOpen(true);
                      if (selectedModuleId) {
                        setSearchTerm('');
                        setSelectedModuleId('');
                      }
                    }}
                    onBlur={() => {
                      // Delay hiding dropdown to allow clicking on options
                      setTimeout(() => setIsDropdownOpen(false), 200);
                    }}
                    placeholder="Search by module title..."
                    style={styles.searchDropdownInput}
                  />
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    style={styles.dropdownToggle}
                  >
                    {isDropdownOpen ? '▲' : '▼'}
                  </button>
                </div>
                
                {isDropdownOpen && (
                  <div style={styles.dropdownList}>
                    {displayModules.length === 0 && searchTerm ? (
                      <div style={styles.noResultsItem}>
                        No modules found matching "{searchTerm}"
                      </div>
                    ) : (
                      displayModules.map((module) => (
                        <div
                          key={module.id}
                          onClick={() => (module.hasPublishedVersions && module.latestVersion?.isPublished) ? handleModuleSelect(module) : null}
                          style={{
                            ...styles.dropdownItem,
                            cursor: (module.hasPublishedVersions && module.latestVersion?.isPublished) ? 'pointer' : 'not-allowed',
                            opacity: (module.hasPublishedVersions && module.latestVersion?.isPublished) ? 1 : 0.5,
                            color: (module.hasPublishedVersions && module.latestVersion?.isPublished) ? '#000000' : '#9ca3af',
                            fontStyle: (module.hasPublishedVersions && module.latestVersion?.isPublished) ? 'normal' : 'italic',
                          }}
                        >
                          <div style={styles.moduleTitle}>
                            {module.latestVersion?.title || 'Untitled Module'}
                          </div>
                          <div style={styles.moduleStatus}>
                            {getModuleStatusText(module)}
                          </div>
                        </div>
                      ))
                    )}
                    {hasMoreModules && (
                      <div style={styles.limitWarningItem}>
                        Showing first {config.ui.maxModulesInDropdown} of {filteredModules.length} modules. Continue typing to narrow results.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          
          {selectedModule && (
            <div style={styles.selectedModuleInfo}>
              <p style={styles.selectedModuleText}>
                <strong>Selected:</strong> {selectedModule.latestVersion?.title}
                <span style={{
                  ...styles.statusBadge,
                  backgroundColor: (selectedModule.hasPublishedVersions && selectedModule.latestVersion?.isPublished) ? '#dcfce7' : 
                                   selectedModule.hasPublishedVersions ? '#fef3c7' : '#fef2f2',
                  color: (selectedModule.hasPublishedVersions && selectedModule.latestVersion?.isPublished) ? '#166534' : 
                         selectedModule.hasPublishedVersions ? '#92400e' : '#dc2626',
                  marginLeft: '8px',
                }}>
                  {getModuleStatusText(selectedModule)}
                </span>
              </p>
            </div>
          )}

          <div style={styles.moduleHelpText}>
            <p style={styles.helpText}>
              <strong>Note:</strong> Only modules with published current versions can be added to groups. 
              Modules with outdated versions (where the latest version is not published) must have their latest version published first.
            </p>
          </div>
          
          {error && <p style={styles.formError}>{error}</p>}
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
            disabled={availableModules.length === 0 || !canConfirm}
            style={{
              ...styles.modalConfirmButton,
              opacity: (availableModules.length === 0 || !canConfirm) ? 0.5 : 1,
              cursor: (availableModules.length === 0 || !canConfirm) ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={(e) => {
              if (canConfirm) {
                e.currentTarget.style.backgroundColor = '#2563eb';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 8px -2px rgba(59, 130, 246, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              if (canConfirm) {
                e.currentTarget.style.backgroundColor = '#3b82f6';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(59, 130, 246, 0.3)';
              }
            }}
          >
            Add Module
          </button>
        </div>
      </div>
    </div>
  );
};

const GroupModuleManagement = ({ isOpen, group, onClose, onGroupUpdated }: GroupModuleManagementProps) => {
  const [availableModules, setAvailableModules] = useState<AssessmentModuleDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [addModuleModal, setAddModuleModal] = useState(false);
  const [localGroup, setLocalGroup] = useState<Group>(group);

  // Update local group state when group prop changes
  useEffect(() => {
    setLocalGroup(group);
  }, [group]);

  // Only load available modules when opening the add module modal
  useEffect(() => {
    if (addModuleModal) {
      loadAvailableModules();
    }
  }, [addModuleModal]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen && e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  const loadAvailableModules = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await assessmentService.fetchAllModules(1, 100);
      if (!response.isFailed) {
        // Show all modules, but filter out ones already in the group
        const existingModuleIds = localGroup.groupMembers.map(member => member.assessmentModuleId);
        const filteredModules = response.data.data.filter(
          module => !existingModuleIds.includes(module.id)
        );
        setAvailableModules(filteredModules);
      } else {
        setError('Failed to load assessment modules');
      }
    } catch (err: any) {
      setError('Failed to load assessment modules: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleAddModule = async (moduleId: string) => {
    setLoading(true);
    setError('');

    try {
      // Get the next order number
      const maxOrder = localGroup.groupMembers.length > 0 
        ? Math.max(...localGroup.groupMembers.map(member => member.orderNumber))
        : 0;

      const newMember: GroupMemberCreate = {
        assessmentModuleId: moduleId,
        orderNumber: maxOrder + 1,
      };

      const updatedGroup = await groupService.addGroupMember(localGroup.id, newMember);
      setLocalGroup(updatedGroup); // Update local state immediately
      onGroupUpdated(updatedGroup);
      setAddModuleModal(false);
    } catch (err: any) {
      setError('Failed to add module: ' + (err.response?.data?.message || err.message));
      setAddModuleModal(false);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveModule = async (memberId: string) => {
    setLoading(true);
    setError('');

    try {
      const updatedGroup = await groupService.removeGroupMember(memberId);
      setLocalGroup(updatedGroup); // Update local state immediately
      onGroupUpdated(updatedGroup);
    } catch (err: any) {
      setError('Failed to remove module: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleMoveUp = async (member: any, index: number) => {
    if (index === 0) return;

    setLoading(true);
    setError('');

    try {
      const prevMember = localGroup.groupMembers[index - 1];
      
      // Single API call to swap the two members
      const swapRequest = {
        groupId: localGroup.id,
        FirstMemberId: member.id,
        SecondMemberId: prevMember.id
      };
      
      const updatedGroup = await groupService.swapGroupMembersOrder(swapRequest);
      setLocalGroup(updatedGroup); // Update local state immediately
      onGroupUpdated(updatedGroup);
    } catch (err: any) {
      setError('Failed to update order: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleMoveDown = async (member: any, index: number) => {
    if (index === localGroup.groupMembers.length - 1) return;

    setLoading(true);
    setError('');

    try {
      const nextMember = localGroup.groupMembers[index + 1];
      
      // Single API call to swap the two members
      const swapRequest = {
        groupId: localGroup.id,
        FirstMemberId: member.id,
        SecondMemberId: nextMember.id
      };
      
      const updatedGroup = await groupService.swapGroupMembersOrder(swapRequest);
      setLocalGroup(updatedGroup); // Update local state immediately
      onGroupUpdated(updatedGroup);
    } catch (err: any) {
      setError('Failed to update order: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <AddModuleModal
        isOpen={addModuleModal}
        availableModules={availableModules}
        loading={loading}
        onConfirm={handleAddModule}
        onCancel={() => setAddModuleModal(false)}
      />
      <div style={styles.modalOverlay}>
        <div style={styles.largeModal}>
          <div style={styles.modalHeader}>
            <h3 style={styles.modalTitle}>Manage Modules for "{localGroup.title}"</h3>
            <button
              onClick={onClose}
              style={styles.closeButton}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              ✕
            </button>
          </div>

          <div style={styles.moduleActions}>
            <button 
              onClick={() => setAddModuleModal(true)}
              disabled={loading}
              style={{
                ...styles.addButton,
                opacity: loading ? 0.5 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = '#059669';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 8px -2px rgba(5, 150, 105, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = '#10b981';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(5, 150, 105, 0.3)';
                }
              }}
            >
              Add Module
            </button>
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <div style={styles.moduleList}>
            {localGroup.groupMembers && localGroup.groupMembers.length > 0 ? (
              <div style={styles.moduleTable}>
                <div style={styles.tableHeader}>
                  <span style={styles.headerCell}>Order</span>
                  <span style={styles.headerCell}>Module Title</span>
                  <span style={styles.headerCell}>Status</span>
                  <span style={styles.headerCell}>Actions</span>
                </div>
                {localGroup.groupMembers
                  .sort((a, b) => a.orderNumber - b.orderNumber)
                  .map((member, index) => (
                    <div key={member.id} style={styles.tableRow}>
                      <span style={styles.tableCell}>{member.orderNumber}</span>
                      <span style={styles.tableCell}>
                        {member.assessmentModuleTitle || 'Unknown Module'}
                      </span>
                      <span style={styles.tableCell}>
                        <span style={{
                          ...styles.statusBadge,
                          backgroundColor: '#dcfce7',
                          color: '#166534',
                        }}>
                          Published
                        </span>
                      </span>
                      <span style={styles.tableCell}>
                        <div style={styles.actionButtons}>
                          <button 
                            onClick={() => handleMoveUp(member, index)}
                            disabled={loading || index === 0}
                            style={{
                              ...styles.orderButton,
                              opacity: loading || index === 0 ? 0.5 : 1,
                              cursor: loading || index === 0 ? 'not-allowed' : 'pointer',
                            }}
                            title="Move up"
                          >
                            ↑
                          </button>
                          <button 
                            onClick={() => handleMoveDown(member, index)}
                            disabled={loading || index === localGroup.groupMembers.length - 1}
                            style={{
                              ...styles.orderButton,
                              opacity: loading || index === localGroup.groupMembers.length - 1 ? 0.5 : 1,
                              cursor: loading || index === localGroup.groupMembers.length - 1 ? 'not-allowed' : 'pointer',
                            }}
                            title="Move down"
                          >
                            ↓
                          </button>
                          <button 
                            onClick={() => handleRemoveModule(member.id)}
                            disabled={loading}
                            style={{
                              ...styles.removeButton,
                              opacity: loading ? 0.5 : 1,
                              cursor: loading ? 'not-allowed' : 'pointer',
                            }}
                            onMouseEnter={(e) => {
                              if (!loading) {
                                e.currentTarget.style.backgroundColor = '#b91c1c';
                                e.currentTarget.style.transform = 'translateY(-1px)';
                                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(220, 38, 38, 0.3)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!loading) {
                                e.currentTarget.style.backgroundColor = '#dc2626';
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
                              }
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      </span>
                    </div>
                  ))}
              </div>
            ) : (
              <div style={styles.emptyState}>
                <p style={styles.emptyText}>No modules added to this group yet.</p>
                <p style={styles.emptySubtext}>Click "Add Module" to get started.</p>
              </div>
            )}
          </div>

          {loading && <p style={styles.loadingText}>Loading...</p>}

          <div style={styles.modalFooter}>
            <p style={styles.keyboardShortcuts}>
              Press <kbd style={styles.kbd}>Esc</kbd> to close
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

const styles: Record<string, React.CSSProperties> = {
  addModalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1500, // Higher than the main modal
    backdropFilter: 'blur(4px)',
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
  largeModal: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '32px',
    maxWidth: '800px',
    width: '90%',
    maxHeight: '80vh',
    overflow: 'auto',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.8)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: 700,
    margin: 0,
    color: '#111827',
    letterSpacing: '-0.025em',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '8px',
    color: '#6b7280',
    transition: 'all 0.2s ease-in-out',
  },
  moduleActions: {
    marginBottom: '24px',
    display: 'flex',
    justifyContent: 'flex-start',
  },
  addButton: {
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
  error: {
    fontSize: '14px',
    color: '#dc2626',
    marginBottom: '16px',
    padding: '12px 16px',
    backgroundColor: '#fef2f2',
    borderRadius: '8px',
    border: '1px solid #fecaca',
  },
  moduleList: {
    marginBottom: '24px',
  },
  moduleTable: {
    width: '100%',
  },
  tableHeader: {
    display: 'grid',
    gridTemplateColumns: '80px 1fr 120px 200px',
    gap: '16px',
    padding: '12px 16px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px 8px 0 0',
    borderBottom: '1px solid #e5e7eb',
    fontWeight: 600,
    fontSize: '14px',
    color: '#374151',
  },
  headerCell: {
    display: 'flex',
    alignItems: 'center',
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '80px 1fr 120px 200px',
    gap: '16px',
    padding: '16px',
    borderBottom: '1px solid #f3f4f6',
    transition: 'background-color 0.2s ease-in-out',
    alignItems: 'center',
  },
  tableCell: {
    fontSize: '14px',
    color: '#374151',
    display: 'flex',
    alignItems: 'center',
  },
  statusBadge: {
    display: 'inline-block',
    padding: '4px 8px',
    fontSize: '12px',
    fontWeight: 500,
    borderRadius: '6px',
  },
  actionButtons: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  orderButton: {
    padding: '4px 8px',
    fontSize: '12px',
    fontWeight: 600,
    borderRadius: '4px',
    border: '1px solid #d1d5db',
    backgroundColor: '#ffffff',
    color: '#374151',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    minWidth: '28px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButton: {
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
  emptyState: {
    textAlign: 'center',
    padding: '48px 24px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  },
  emptyText: {
    fontSize: '16px',
    color: '#374151',
    margin: '0 0 8px 0',
    fontWeight: 500,
  },
  emptySubtext: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
  },
  loadingText: {
    textAlign: 'center',
    fontSize: '14px',
    color: '#6b7280',
    margin: '16px 0',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'center',
    paddingTop: '24px',
    borderTop: '1px solid #e5e7eb',
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
  formSelect: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '14px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    backgroundColor: '#ffffff',
    boxSizing: 'border-box',
    transition: 'all 0.2s ease-in-out',
    outline: 'none',
    cursor: 'pointer',
  },
  formError: {
    fontSize: '12px',
    color: '#dc2626',
    margin: '8px 0 0 0',
    padding: '8px 12px',
    backgroundColor: '#fef2f2',
    borderRadius: '6px',
    border: '1px solid #fecaca',
  },
  moduleHelpText: {
    marginTop: '12px',
    padding: '12px',
    backgroundColor: '#f0f9ff',
    borderRadius: '6px',
    border: '1px solid #bae6fd',
  },
  helpText: {
    fontSize: '12px',
    color: '#1e40af',
    margin: 0,
    lineHeight: '1.4',
  },
  limitWarning: {
    fontSize: '12px',
    color: '#f59e0b',
    margin: '8px 0 0 0',
    fontStyle: 'italic',
    padding: '8px 12px',
    backgroundColor: '#fffbeb',
    borderRadius: '6px',
    border: '1px solid #fed7aa',
  },
  noResultsText: {
    fontSize: '12px',
    color: '#6b7280',
    margin: '8px 0 0 0',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: '12px',
  },
  searchableDropdown: {
    position: 'relative',
    width: '100%',
  },
  searchInputContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  searchDropdownInput: {
    width: '100%',
    padding: '12px 40px 12px 16px',
    fontSize: '14px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    backgroundColor: '#ffffff',
    boxSizing: 'border-box',
    transition: 'all 0.2s ease-in-out',
    outline: 'none',
  },
  dropdownToggle: {
    position: 'absolute',
    right: '8px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    fontSize: '12px',
    color: '#6b7280',
    borderRadius: '4px',
    transition: 'all 0.2s ease-in-out',
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    border: '1px solid #d1d5db',
    borderTop: 'none',
    borderRadius: '0 0 8px 8px',
    maxHeight: '300px',
    overflowY: 'auto',
    zIndex: 1600,
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  },
  dropdownItem: {
    padding: '12px 16px',
    borderBottom: '1px solid #f3f4f6',
    transition: 'background-color 0.2s ease-in-out',
  },
  moduleTitle: {
    fontSize: '14px',
    fontWeight: 500,
    marginBottom: '4px',
  },
  moduleStatus: {
    fontSize: '12px',
    fontWeight: 400,
    marginBottom: '4px',
  },
  moduleDescription: {
    fontSize: '12px',
    color: '#6b7280',
    lineHeight: '1.4',
  },
  noResultsItem: {
    padding: '16px',
    textAlign: 'center',
    fontSize: '12px',
    color: '#6b7280',
    fontStyle: 'italic',
  },
  limitWarningItem: {
    padding: '12px 16px',
    backgroundColor: '#fffbeb',
    borderTop: '1px solid #fed7aa',
    fontSize: '12px',
    color: '#f59e0b',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  selectedModuleInfo: {
    marginBottom: '16px',
    padding: '12px',
    backgroundColor: '#f0f9ff',
    borderRadius: '6px',
    border: '1px solid #bae6fd',
  },
  selectedModuleText: {
    fontSize: '13px',
    color: '#1e40af',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
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
};

export default GroupModuleManagement;
