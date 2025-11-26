import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AssessmentModuleDto } from '../../models/assessment-module';
import { assessmentService } from '../../services/assessmentService';
import { formatDateToLocal } from '../../utils/dateUtils';
import cssStyles from './ModuleManagement.module.css';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  moduleId: string;
  moduleTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
  error?: string;
  isLoading?: boolean;
}

const DeleteConfirmationModal = ({ isOpen, moduleId, moduleTitle, onConfirm, onCancel, error, isLoading }: DeleteConfirmationModalProps) => {
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
        <h3 style={styles.modalTitle}>Confirm Module Deletion</h3>
        <p style={styles.modalMessage}>
          Are you sure you want to delete the module: <strong>{moduleTitle}</strong>?
        </p>
        <p style={styles.modalWarning}>
          This action cannot be undone and will permanently remove the module and all its versions, questions, and associated data.
        </p>
        {error && (
          <div style={styles.modalError}>
            <strong>Error:</strong> {error}
          </div>
        )}
        <p style={styles.keyboardShortcuts}>
          <kbd style={styles.kbd}>Ctrl</kbd> + <kbd style={styles.kbd}>Enter</kbd> to confirm, <kbd style={styles.kbd}>Esc</kbd> to cancel
        </p>
        <div style={styles.modalActions}>
          <button 
            onClick={onCancel} 
            disabled={isLoading}
            style={{
              ...styles.modalCancelButton,
              opacity: isLoading ? 0.5 : 1,
              cursor: isLoading ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
                e.currentTarget.style.borderColor = '#9ca3af';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.borderColor = '#d1d5db';
              }
            }}
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm} 
            disabled={isLoading}
            style={{
              ...styles.modalConfirmButton,
              backgroundColor: '#dc2626',
              boxShadow: '0 4px 6px -1px rgba(220, 38, 38, 0.3)',
              opacity: isLoading ? 0.7 : 1,
              cursor: isLoading ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = '#b91c1c';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 8px -2px rgba(220, 38, 38, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = '#dc2626';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(220, 38, 38, 0.3)';
              }
            }}
          >
            {isLoading ? 'Deleting...' : 'Delete Module'}
          </button>
        </div>
      </div>
    </div>
  );
};

interface ModuleManagementProps {
  moduleManagementData: {
    modules: AssessmentModuleDto[]; // Now using AssessmentModuleDto with latestVersion property
    totalPages: number;
    currentPage: number;
    dataLoaded: boolean;
  };
  setModuleManagementData: React.Dispatch<React.SetStateAction<{
    modules: AssessmentModuleDto[];
    totalPages: number;
    currentPage: number;
    dataLoaded: boolean;
  }>>;
  onNavigateToGroups?: () => void;
}

const ModuleManagement = ({ moduleManagementData, setModuleManagementData, onNavigateToGroups }: ModuleManagementProps) => {
  const { modules, totalPages, currentPage: pageNumber, dataLoaded } = moduleManagementData;
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const initialMountRef = useRef(true);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    moduleId: string;
    moduleTitle: string;
    error?: string;
    isLoading: boolean;
  }>({ isOpen: false, moduleId: '', moduleTitle: '', isLoading: false });

  // Handle Ctrl+N keyboard shortcut for creating new module
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        handleCreateModule();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Add mobile responsive styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @media (max-width: 768px) {
        .module-management-header {
          flex-direction: column !important;
          align-items: stretch !important;
          gap: 16px !important;
        }
        .module-management-header h2 {
          text-align: center !important;
          margin-bottom: 8px !important;
        }
        .module-management-create-button {
          width: 100% !important;
          max-width: 300px !important;
          margin: 0 auto !important;
          font-size: 14px !important;
          padding: 12px 24px !important;
          white-space: nowrap !important;
        }
        .module-management-table-container {
          overflow-x: auto !important;
          -webkit-overflow-scrolling: touch !important;
          margin: 0 -20px !important;
          padding: 0 20px !important;
        }
        .module-management-table {
          min-width: 900px !important;
        }
        .module-management-pagination {
          flex-direction: column !important;
          gap: 16px !important;
          align-items: center !important;
        }
        .module-management-pagination-controls {
          gap: 12px !important;
          justify-content: center !important;
        }
        .module-management-pagination-button {
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
        .module-management-page-size {
          justify-content: center !important;
          gap: 8px !important;
        }
        .module-management-spacer {
          display: none !important;
        }
      }
      @media (max-width: 480px) {
        .module-management-create-button {
          max-width: 280px !important;
          font-size: 13px !important;
          padding: 10px 20px !important;
        }
        .module-management-table-container {
          margin: 0 -16px !important;
          padding: 0 16px !important;
        }
        .module-management-table {
          min-width: 800px !important;
        }
        .module-management-pagination-controls {
          gap: 8px !important;
        }
        .module-management-pagination-button {
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

  const loadModules = async (page: number = pageNumber, searchTerm: string = '', currentPageSize: number = pageSize) => {
    setLoading(true);
    setError('');

    try {
      let response;
      
      if (searchTerm.trim()) {
        // Use the search method when there's a search term
        response = await assessmentService.fetchAllModulesByTitle(searchTerm.trim(), page, currentPageSize);
      } else {
        // Use the general fetch method when no search term
        response = await assessmentService.fetchAllModules(page, currentPageSize);
      }
      
      if (!response.isFailed) {
        const modulesData = response.data?.data || [];
        const totalPagesCount = response.data?.totalPages || 1;
        
        // Validate and filter modules to ensure they have the required structure
        // The API returns AssessmentModuleDto[] with latestVersion property
        const validModules = modulesData.filter((module: AssessmentModuleDto) => {
          const isValid = module && module.id && module.latestVersion?.title;
          return isValid;
        });
        
        setModuleManagementData(prev => ({
          ...prev,
          modules: validModules,
          totalPages: totalPagesCount,
          currentPage: page,
          dataLoaded: true,
        }));
      } else {
        setError('Failed to load modules: ' + (response.errors?.join(', ') || 'Unknown error'));
        setModuleManagementData(prev => ({
          ...prev,
          modules: [],
          totalPages: 1,
          currentPage: 1,
          dataLoaded: true,
        }));
      }
    } catch (err: any) {
      setError('Failed to load modules: ' + (err.response?.data?.message || err.message));
      setModuleManagementData(prev => ({
        ...prev,
        modules: [],
        totalPages: 1,
        currentPage: 1,
        dataLoaded: true,
      }));
    } finally {
      setLoading(false);
    }
  };

  // Load modules only if data hasn't been loaded yet
  useEffect(() => {
    if (!dataLoaded) {
      loadModules(1);
    }
  }, [dataLoaded]);

  // Handle page size changes
  useEffect(() => {
    if (initialMountRef.current) {
      initialMountRef.current = false;
      return;
    }
    
    // Reset to page 1 when page size changes and reload data
    loadModules(1, search, pageSize);
  }, [pageSize]);

  const handlePrevious = () => {
    if (pageNumber > 1) {
      const newPage = pageNumber - 1;
      loadModules(newPage, search, pageSize);
    }
  };

  const handleNext = () => {
    if (pageNumber < totalPages) {
      const newPage = pageNumber + 1;
      loadModules(newPage, search, pageSize);
    }
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
  };

  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchValue = e.target.value;
    setSearch(searchValue);
    loadModules(1, searchValue, pageSize);
  };

  const handleViewDetails = (module: AssessmentModuleDto) => {
    // Navigate to the module builder with the existing module data
    if (module && module.id && module.latestVersion?.title) {
      // Navigate to module builder route with moduleId as query parameter
      navigate(`/module/build?moduleId=${module.id}`);
    } else {
      setError('Module data is incomplete and cannot be displayed.');
    }
  };

  const handleCreateModule = () => {
    // Navigate directly to create a new module
    navigate('/module/create');
  };

  const handleDeleteModule = (module: AssessmentModuleDto) => {
    setDeleteModal({ 
      isOpen: true, 
      moduleId: module.id, 
      moduleTitle: module.latestVersion.title,
      error: undefined,
      isLoading: false
    });
  };

  const confirmDeleteModule = async () => {
    setDeleteModal(prev => ({ ...prev, isLoading: true, error: undefined }));

    try {
      const response = await assessmentService.deleteModule(deleteModal.moduleId);
      
      if (response.isSuccess) {
        // Remove the module from the local state
        setModuleManagementData(prev => ({
          ...prev,
          modules: prev.modules.filter(m => m.id !== deleteModal.moduleId)
        }));
        
        setDeleteModal({ isOpen: false, moduleId: '', moduleTitle: '', isLoading: false });
      } else {
        const errorMessage = 'Failed to delete module: ' + (response.message || 'Unknown error');
        setDeleteModal(prev => ({ 
          ...prev, 
          error: errorMessage, 
          isLoading: false 
        }));
      }
    } catch (error: any) {
      const errorMessage = 'Failed to delete module: ' + (error.response?.data?.message || error.message || 'Please try again.');
      setDeleteModal(prev => ({ 
        ...prev, 
        error: errorMessage, 
        isLoading: false 
      }));
    }
  };

  const cancelDeleteModule = () => {
    setDeleteModal({ isOpen: false, moduleId: '', moduleTitle: '', isLoading: false });
  };

  const getModuleStatusBadge = (hasPublishedVersions: boolean, latestVersionIsPublished: boolean) => {
    if (hasPublishedVersions && latestVersionIsPublished) {
      return (
        <span style={{
          ...styles.badge,
          backgroundColor: '#dcfce7',
          color: '#166534',
        }}>
          Published
        </span>
      );
    } else if (hasPublishedVersions && !latestVersionIsPublished) {
      return (
        <span style={{
          ...styles.badge,
          backgroundColor: '#dbeafe',
          color: '#1e40af',
        }}>
          Published (Outdated)
        </span>
      );
    } else {
      return (
        <span style={{
          ...styles.badge,
          backgroundColor: '#fef3c7',
          color: '#92400e',
        }}>
          Not Published
        </span>
      );
    }
  };

  return (
    <>
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        moduleId={deleteModal.moduleId}
        moduleTitle={deleteModal.moduleTitle}
        onConfirm={confirmDeleteModule}
        onCancel={cancelDeleteModule}
        error={deleteModal.error}
        isLoading={deleteModal.isLoading}
      />
      <div style={styles.container}>
        <div style={styles.header} className="module-management-header">
          <h2 className={cssStyles.title} style={{...styles.title, display: 'flex', alignItems: 'center'}}><img src="/images/icons/books.svg" alt="" style={{width: '28px', height: '28px', marginRight: '10px'}} />Module Management</h2>
          <div style={styles.headerActions}>
            <div style={styles.headerInfo}>
              <span style={styles.moduleCount}>
                {modules.length} module{modules.length !== 1 ? 's' : ''} found
              </span>
            </div>
            <button 
              onClick={handleCreateModule}
              style={styles.createButton}
              className="module-management-create-button"
              title="Create new module (Ctrl+N)"
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
              Create Module
            </button>
          </div>
        </div>

        <div style={styles.infoSection}>
          <div style={styles.infoHeader}>
            <span style={styles.infoIcon}><img src="/images/icons/information.svg" alt="" style={{width: '16px', height: '16px', verticalAlign: 'middle'}} /></span>
            <span style={styles.infoTitle}>Module Data Information</span>
          </div>
          <div style={styles.infoContent}>
            <p style={styles.infoText}>
              <strong>Module Assignment:</strong> Modules with the latest published version should be grouped together before being assigned to users.{' '}
              <span 
                style={styles.linkText}
                onClick={() => onNavigateToGroups?.()}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#2563eb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#3b82f6';
                }}
              >
                Take me to Group Management.
              </span>
            </p>
            <p style={styles.infoText}>
              <strong>Title and Introduction*:</strong> Display data from the latest version of each module.
            </p>
            <p style={styles.infoText}>
              <strong>Status:</strong> Shows the overall module publication state across all versions.
            </p>
            <div style={styles.statusLegend}>
              <div style={styles.legendItem}>
                <span style={{...styles.badge, backgroundColor: '#dcfce7', color: '#166534'}}>Published</span>
                <span>Latest version is published and available</span>
              </div>
              <div style={styles.legendItem}>
                <span style={{...styles.badge, backgroundColor: '#dbeafe', color: '#1e40af'}}>Published (Outdated)</span>
                <span>Has published versions, but latest is not published</span>
              </div>
              <div style={styles.legendItem}>
                <span style={{...styles.badge, backgroundColor: '#fef3c7', color: '#92400e'}}>Not Published</span>
                <span>No published versions exist</span>
              </div>
            </div>
            <p style={styles.infoText}>
              <strong>Keyboard Shortcut:</strong> Press <kbd style={styles.kbd}>Ctrl+N</kbd> to quickly create a new module.
            </p>
          </div>
        </div>

        <input
          type="text"
          placeholder="Search by module title..."
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

        {error && <p style={styles.error}>{error}</p>}
        {loading ? (
          <div style={styles.loadingContainer}>
            <p style={styles.loadingText}>Loading modules...</p>
          </div>
        ) : (
          <>
            <div className="module-management-table-container" style={styles.tableContainer}>
              <table style={styles.table} className="module-management-table">
              <thead>
                <tr>
                  <th style={styles.th}>Title</th>
                  <th style={styles.th}>Introduction</th>
                  <th style={styles.th}>Latest Version</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Duration</th>
                  <th style={styles.th}>Passing Score</th>
                  <th style={styles.th}>Created</th>
                  <th style={styles.th}>Latest Version Created</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(modules) && modules.map((module) => {
                  // The API now returns AssessmentModuleDto with latestVersion property
                  const moduleData = module;
                  const latestVersion = module.latestVersion;
                  
                  // Skip rendering if module data is incomplete
                  if (!moduleData?.id || !latestVersion?.title) {
                    return null;
                  }
                  
                  return (
                    <tr 
                      key={moduleData.id} 
                      style={styles.tr}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f9fafb';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <td style={styles.td}>
                        <div style={styles.titleCell}>
                          {latestVersion?.title || 'Untitled Module'}
                        </div>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.descriptionCell}>
                          {latestVersion?.description || 'No introduction available'}
                        </div>
                      </td>
                      <td style={styles.td}>v{latestVersion?.version || '1'}</td>
                      <td style={styles.td}>
                        {getModuleStatusBadge(moduleData.hasPublishedVersions, latestVersion?.isPublished || false)}
                      </td>
                      <td style={styles.td}>{latestVersion?.durationInMinutes || 0} min</td>
                      <td style={styles.td}>{latestVersion?.passingScorePercentage || 0}%</td>
                      <td style={styles.td}>
                        <div style={styles.createdCell}>
                          <div>{moduleData?.createdAtUtc ? formatDateToLocal(moduleData.createdAtUtc) : 'Unknown'}</div>
                          <div style={styles.createdBy}>
                            by {moduleData?.createdByUser || 'Unknown'}
                          </div>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.createdCell}>
                          <div>{latestVersion?.createdAtUtc ? formatDateToLocal(latestVersion.createdAtUtc) : 'Unknown'}</div>
                          <div style={styles.createdBy}>
                            by {latestVersion?.createdByUser || 'Unknown'}
                          </div>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.actionButtons}>
                          <button 
                            onClick={() => handleViewDetails(moduleData)} 
                            style={styles.actionButton}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#2563eb';
                              e.currentTarget.style.transform = 'translateY(-1px)';
                              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(59, 130, 246, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#3b82f6';
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
                            }}
                          >
                            View Details
                          </button>
                          <button 
                            onClick={() => handleDeleteModule(moduleData)} 
                            style={styles.deleteButton}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#b91c1c';
                              e.currentTarget.style.transform = 'translateY(-1px)';
                              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(220, 38, 38, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#dc2626';
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }).filter(Boolean)}
                {(!Array.isArray(modules) || modules.length === 0) && (
                  <tr>
                    <td colSpan={9} style={{ ...styles.td, textAlign: 'center', fontStyle: 'italic', color: '#6b7280' }}>
                      {loading ? 'Loading modules...' : search.trim() ? 'No modules found matching your search' : 'No modules found'}
                    </td>
                  </tr>
                )}
              </tbody>
              </table>
            </div>

            <div style={styles.pagination} className="module-management-pagination">
              <div style={styles.pageSizeContainer} className="module-management-page-size">
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
              
              <div style={styles.paginationControls} className="module-management-pagination-controls">
                <button 
                  onClick={handlePrevious} 
                  disabled={pageNumber === 1 || loading} 
                  className="module-management-pagination-button"
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
                  className="module-management-pagination-button"
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
              <div style={{ width: '120px' }} className="module-management-spacer"></div>
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
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  headerInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  moduleCount: {
    fontSize: '14px',
    color: '#6b7280',
    fontWeight: 500,
    padding: '8px 12px',
    backgroundColor: '#f3f4f6',
    borderRadius: '6px',
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
    whiteSpace: 'nowrap',
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
  statusLegend: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginTop: '8px',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    color: '#6b7280',
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
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '60px 20px',
  },
  loadingText: {
    fontSize: '16px',
    color: '#6b7280',
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
    padding: '16px 12px',
    backgroundColor: '#f9fafb',
    borderBottom: '1px solid #e5e7eb',
    fontWeight: 600,
    fontSize: '12px',
    color: '#374151',
    letterSpacing: '0.025em',
    whiteSpace: 'nowrap',
  },
  tr: {
    transition: 'background-color 0.2s ease-in-out',
  },
  td: {
    padding: '16px 12px',
    borderBottom: '1px solid #f3f4f6',
    fontSize: '13px',
    color: '#374151',
    verticalAlign: 'top',
  },
  titleCell: {
    maxWidth: '200px',
    wordWrap: 'break-word',
    lineHeight: '1.4',
    fontWeight: 500,
  },
  descriptionCell: {
    maxWidth: '250px',
    wordWrap: 'break-word',
    lineHeight: '1.4',
    whiteSpace: 'pre-wrap',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  badge: {
    display: 'inline-block',
    padding: '4px 8px',
    fontSize: '11px',
    fontWeight: 500,
    borderRadius: '6px',
    whiteSpace: 'nowrap',
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
    height: '40px',
    minHeight: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageInfo: {
    fontSize: '14px',
    color: '#6b7280',
    fontWeight: 500,
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
    whiteSpace: 'nowrap',
  },
  linkText: {
    color: '#3b82f6',
    cursor: 'pointer',
    textDecoration: 'underline',
    fontWeight: 500,
    transition: 'color 0.2s ease-in-out',
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
  createdCell: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  createdBy: {
    fontSize: '11px',
    color: '#6b7280',
    fontStyle: 'italic',
  },
  actionButtons: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  deleteButton: {
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
    whiteSpace: 'nowrap',
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
  modalError: {
    fontSize: '14px',
    color: '#dc2626',
    marginBottom: '16px',
    padding: '12px 16px',
    backgroundColor: '#fef2f2',
    borderRadius: '8px',
    border: '1px solid #fecaca',
    lineHeight: '1.5',
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
  keyboardShortcuts: {
    fontSize: '11px',
    color: '#9ca3af',
    margin: '8px 0 0 0',
    textAlign: 'center',
    fontStyle: 'italic',
  },
};

export default ModuleManagement;
