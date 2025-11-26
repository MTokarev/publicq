import React, { useState, useEffect } from 'react';
import { AssessmentModuleDto, AssessmentModuleVersionDto } from '../../models/assessment-module';
import { assessmentService } from '../../services/assessmentService';
import { useAuth } from '../../context/AuthContext';
import { UserPolicies } from '../../models/user-policy';
import { formatDateOnlyToLocal } from '../../utils/dateUtils';

interface ModuleInfoHeaderProps {
  module: AssessmentModuleDto;
  moduleVersion: AssessmentModuleVersionDto;
  questionCount: number;
  onEdit: () => void;
  onPublish: () => void;
  onBackToModules?: () => void;
}

export const ModuleInfoHeader: React.FC<ModuleInfoHeaderProps> = ({
  module,
  moduleVersion,
  questionCount,
  onEdit,
  onPublish,
  onBackToModules
}) => {
  const { userRoles } = useAuth();
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  const canPublish = UserPolicies.hasModeratorAccess(userRoles);

  // Add mobile responsive styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @media (max-width: 768px) {
        .module-info-header {
          flex-direction: column !important;
          gap: 16px !important;
        }
        .module-info-actions {
          flex-direction: column !important;
          gap: 12px !important;
          width: 100% !important;
        }
        .module-info-button {
          width: 100% !important;
          max-width: 280px !important;
          margin: 0 auto !important;
          font-size: 14px !important;
          padding: 12px 16px !important;
          text-align: center !important;
        }
        .module-info-title-section {
          text-align: center !important;
        }
      }
      @media (max-width: 480px) {
        .module-info-button {
          max-width: 260px !important;
          font-size: 13px !important;
          padding: 10px 14px !important;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const handleOnPublish = async () => {
    // Validate that module has questions before publishing
    if (questionCount === 0) {
      setPublishError('Cannot publish module without questions. Please add at least one question before publishing.');
      return;
    }

    setIsPublishing(true);
    setPublishError(null);
    
    try {
      const response = await assessmentService.publishModuleVersion(moduleVersion.id);
      
      if (response.isFailed) {
        setPublishError(response.message || 'Failed to publish module');
        return;
      }
      
      // Call the parent callback to update the module state
      onPublish();
      
    } catch (error) {
      setPublishError('An unexpected error occurred while publishing the module');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div style={styles.container}>
      <div style={styles.card}>
        {publishError && (
          <div style={styles.errorBanner}>
            <span style={styles.errorIcon}>⚠️</span>
            <span style={styles.errorText}>{publishError}</span>
            <button 
              style={styles.errorCloseButton}
              onClick={() => setPublishError(null)}
            >
              ×
            </button>
          </div>
        )}
        
        {!canPublish && (
          <div style={styles.infoBanner}>
            <span style={styles.infoIcon}><img src="/images/icons/information.svg" alt="" style={{width: '16px', height: '16px', verticalAlign: 'middle'}} /></span>
            <div style={styles.infoContent}>
              <div style={styles.infoTitle}>Module Permissions</div>
              <div style={styles.infoText}>
                You can build this module, add questions, or change questions. 
                {moduleVersion.isPublished 
                  ? ' For published modules, you can create new versions.' 
                  : ''
                } For publishing modules, please contact moderators.
              </div>
            </div>
          </div>
        )}
        
        <div style={styles.header} className="module-info-header">
          <div style={styles.titleSection} className="module-info-title-section">
            <h2 style={styles.title}>{moduleVersion.title}</h2>
            <div style={styles.metadata}>
              <span style={styles.version}>Version {moduleVersion.version}</span>
              <span style={styles.separator}>•</span>
              <span style={moduleVersion.isPublished ? styles.publishedStatus : styles.draftStatus}>
                {moduleVersion.isPublished ? 'Published' : 'Draft'}
              </span>
            </div>
            <div style={styles.creationInfo}>
              <div style={styles.createdBy}>
                Module created by {module.createdByUser} at {formatDateOnlyToLocal(module.createdAtUtc)}
              </div>
              <div style={styles.createdBy}>
                Version created by {moduleVersion.createdByUser} at {formatDateOnlyToLocal(moduleVersion.createdAtUtc)}
              </div>
            </div>
            {moduleVersion.description && (
              <div style={styles.descriptionSection}>
                <hr style={styles.descriptionSeparator} />
                <p style={styles.description}>{moduleVersion.description}</p>
              </div>
            )}
          </div>
          
          <div style={styles.actions} className="module-info-actions">
            {onBackToModules && (
              <button style={styles.backButton} className="module-info-button" onClick={onBackToModules}>
                ← Back to Modules
              </button>
            )}
            <button style={styles.editButton} className="module-info-button" onClick={onEdit}>
              Edit
            </button>
            
            {!moduleVersion.isPublished && (
              <button 
                style={{
                  ...styles.publishButton,
                  ...(isPublishing || questionCount === 0 || !canPublish ? styles.publishButtonDisabled : {})
                }}
                className="module-info-button"
                onClick={handleOnPublish}
                disabled={isPublishing || questionCount === 0 || !canPublish}
                title={
                  !canPublish ? 'You do not have permission to publish modules' :
                  questionCount === 0 ? 'Add at least one question before publishing' : 
                  'Publish this module version'
                }
              >
                {isPublishing ? (
                  <>
                    <span style={styles.spinner}>⟳</span>
                    Publishing...
                  </>
                ) : (
                  'Publish'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

const styles = {
  container: {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '20px',
    marginBottom: '20px',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    padding: '24px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '20px',
  },
  titleSection: {
    flex: 1,
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0 0 8px 0',
  },
  metadata: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
    fontSize: '0.875rem',
  },
  version: {
    fontWeight: '500',
    color: '#374151',
  },
  separator: {
    color: '#9ca3af',
  },
  publishedStatus: {
    color: '#059669',
    fontWeight: '500',
  },
  draftStatus: {
    color: '#d97706',
    fontWeight: '500',
  },
  date: {
    color: '#6b7280',
  },
  createdBy: {
    color: '#6b7280',
    fontStyle: 'italic',
    fontSize: '0.875rem',
  },
  creationInfo: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
    marginTop: '8px',
  },
  descriptionSection: {
    marginTop: '16px',
  },
  descriptionSeparator: {
    border: 'none',
    borderTop: '1px solid #e5e7eb',
    margin: '12px 0',
  },
  description: {
    fontSize: '0.875rem',
    color: '#6b7280',
    margin: '0',
    lineHeight: '1.4',
    whiteSpace: 'pre-wrap',
  },
  actions: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
  },
  editButton: {
    padding: '8px 16px',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  backButton: {
    padding: '8px 16px',
    backgroundColor: '#ffffff',
    color: '#6b7280',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  publishButton: {
    padding: '8px 16px',
    backgroundColor: '#059669',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  publishButtonDisabled: {
    backgroundColor: '#9ca3af',
    cursor: 'not-allowed',
  },
  spinner: {
    display: 'inline-block',
    animation: 'spin 1s linear infinite',
  },
  errorBanner: {
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '6px',
    padding: '12px 16px',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  errorIcon: {
    fontSize: '16px',
  },
  errorText: {
    flex: 1,
    color: '#dc2626',
    fontSize: '0.875rem',
    fontWeight: '500',
  },
  errorCloseButton: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#dc2626',
    cursor: 'pointer',
    fontSize: '16px',
    padding: '4px',
    borderRadius: '4px',
    transition: 'all 0.2s',
  },
  infoBanner: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    borderRadius: '6px',
    padding: '12px 16px',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
  },
  infoIcon: {
    fontSize: '16px',
    marginTop: '2px',
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    color: '#1e40af',
    fontSize: '0.875rem',
    fontWeight: '600',
    marginBottom: '4px',
  },
  infoText: {
    color: '#1e40af',
    fontSize: '0.875rem',
    lineHeight: '1.4',
  },
} as const;
