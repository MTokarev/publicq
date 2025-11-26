import { AssessmentModuleVersionDto } from "../../models/assessment-module";
import { useState, useRef, useEffect } from "react";
import { StaticFileDto } from "../../models/static-file";
import StaticFileUpload from "../Shared/StaticFileUpload";
import {  assessmentDtoToUpdateDto, assessmentDtoToUpdatePublishedDto } from "../../models/assessment-modules-update";
import { assessmentService } from "../../services/assessmentService";
import { VALIDATION_CONSTRAINTS } from "../../constants/contstants";
import { parseFileUploadError } from "../../utils/fileUploadErrorHandler";

type PreviewFile = File | StaticFileDto;

interface Props {
  moduleId: string;
  moduleVersion: AssessmentModuleVersionDto;
  onModuleUpdate: (module: AssessmentModuleVersionDto) => void;
  onCreateNewVersion?: (moduleVersion: AssessmentModuleVersionDto) => void;
  onClose: () => void;
}

export const ModuleEditForm = ({ moduleId, moduleVersion, onModuleUpdate, onCreateNewVersion, onClose }: Props) => {
  const [formData, setFormData] = useState<AssessmentModuleVersionDto>(moduleVersion);
  const [staticFiles, setStaticFiles] = useState<PreviewFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const modalRef = useRef<HTMLDivElement>(null);

  // Focus modal when it opens
  useEffect(() => {
    if (modalRef.current) {
      modalRef.current.focus();
    }
  }, []);

  // Initialize existing files from module version (now receiving complete data from parent)
  useEffect(() => {
    if (moduleVersion.staticFileUrls && moduleVersion.staticFileUrls.length > 0) {
      const existingFiles: StaticFileDto[] = moduleVersion.staticFileUrls.map((url, index) => {
        const fileId = moduleVersion.staticFileIds?.[index] || `existing-${index}`;
        const fileName = url.split('/').pop() || `Module-Attachment-${index + 1}`;
        const fileType = getFileTypeFromExtension(fileName);
        
        return {
          id: fileId,
          url: url,
          name: fileName,
          type: fileType
        };
      });
      setStaticFiles(existingFiles);
    } else {
      setStaticFiles([]);
    }
  }, [moduleVersion]);

  // Helper to determine file type from extension
  const getFileTypeFromExtension = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) {
      return 'image/' + extension;
    } else if (['mp3', 'wav', 'ogg'].includes(extension)) {
      return 'audio/' + extension;
    } else if (['mp4', 'avi', 'mov', 'webm'].includes(extension)) {
      return 'video/' + extension;
    } else if (extension === 'pdf') {
      return 'application/pdf';
    } else {
      return 'application/octet-stream';
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    // Validation
    const validationErrors: string[] = [];
    if (!formData.title.trim()) validationErrors.push('Title is required');
    if (formData.title.length > VALIDATION_CONSTRAINTS.MODULE.TITLE_MAX_LENGTH) {
      validationErrors.push(`Title must not exceed ${VALIDATION_CONSTRAINTS.MODULE.TITLE_MAX_LENGTH} characters`);
    }
    if (!formData.description.trim()) validationErrors.push('Introduction is required');
    if (formData.description.length > VALIDATION_CONSTRAINTS.MODULE.DESCRIPTION_MAX_LENGTH) {
      validationErrors.push(`Introduction must not exceed ${VALIDATION_CONSTRAINTS.MODULE.DESCRIPTION_MAX_LENGTH} characters`);
    }
    if (formData.durationInMinutes <= 0) validationErrors.push('Duration must be greater than 0');
    
    // Only validate passing score for draft modules
    if (!moduleVersion.isPublished) {
      if (formData.passingScorePercentage < 0 || formData.passingScorePercentage > 100) {
        validationErrors.push('Passing score must be between 0 and 100');
      }
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      let updatedFormData = { ...formData };

      // Handle file uploads first if there are any new files
      if (staticFiles.length > 0) {
        // Filter out only File objects (not StaticFileDto) for upload
        const filesToUpload = staticFiles.filter((file): file is File => 'lastModified' in file);
        
        // Get IDs of existing StaticFileDto objects
        const existingFileIds = staticFiles
          .filter((file): file is StaticFileDto => !('lastModified' in file))
          .map(file => file.id);
        
        let fileStaticIds: string[] = existingFileIds;
        
        if (filesToUpload.length > 0) {
          // Upload new files
          const fileUploadRequests = filesToUpload.map(file => ({
            file,
            moduleId: moduleId,  // Use the actual module ID, not the version ID
            isModuleLevelFile: true
          }));
          
          try {
            const uploadFileResults = await Promise.all(fileUploadRequests.map(request => assessmentService.uploadFile(request)));
            const newUploadedIds = uploadFileResults
              .filter(res => res.isSuccess && res.data)  
              .map(res => res.data.id);
            
            // Combine existing and new file IDs
            fileStaticIds = [...existingFileIds, ...newUploadedIds];
          } catch (uploadError: any) {
            setErrors([parseFileUploadError(uploadError)]);
            return; // Exit early if upload fails
          }
        }
        
        // Update form data with file IDs
        updatedFormData = {
          ...updatedFormData,
          staticFileIds: fileStaticIds
        };
      } else {
        // No files, clear file IDs
        updatedFormData = {
          ...updatedFormData,
          staticFileIds: []
        };
      }

      // Update the module with the new data including file references
      if (moduleVersion.isPublished) {
        const moduleToUpdate = assessmentDtoToUpdatePublishedDto(updatedFormData);
        const response = await assessmentService.updatePublishedModuleVersion(moduleToUpdate);

        if (response.isFailed) {
          setErrors(response.errors);
          return;
        }

        setFormData(response.data);
        onModuleUpdate(response.data);
      } else {
        const moduleToUpdate = assessmentDtoToUpdateDto(updatedFormData);
        const response = await assessmentService.updateNotPublishedModuleVersion(moduleToUpdate);
        
        if (response.isFailed) {
          setErrors(response.errors);
          return;
        }

        setFormData(response.data);
        onModuleUpdate(response.data);
      }

      onClose();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update module. Please try again.';
      setErrors([errorMessage]);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle keyboard shortcuts
  const handleKeyUp = (e: React.KeyboardEvent) => {
    // Ctrl+Enter or Cmd+Enter to submit
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!isSubmitting) {
        handleSubmit(e as any);
      }
    }

    // Escape to close form
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }

    // Ctrl+S or Cmd+S to save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      if (!isSubmitting) {
        handleSubmit(e as any);
      }
    }
  };

  return (
    <>
      <div
        ref={modalRef}
        style={styles.overlay}
        onKeyUp={handleKeyUp}
        tabIndex={0}
      >
        <div style={styles.modal}>
          <div style={styles.header}>
            <div>
              <h2 style={styles.title}>
                {moduleVersion.isPublished ? 'View Module Settings' : 'Edit Module Settings'}
                <span style={styles.statusBadge}>
                  {moduleVersion.isPublished ? '📋 Published' : '✏️ Draft'}
                </span>
              </h2>
              <div style={styles.shortcutHint}>
                <img src="/images/icons/light-bulb.svg" alt="" style={{width: '14px', height: '14px', marginRight: '6px', verticalAlign: 'middle'}} /> <strong>Ctrl+Enter</strong>  to save  •  <strong>Ctrl+S</strong>  to save  •  <strong>Esc</strong>  to cancel
                {moduleVersion.isPublished && (
                  <div style={styles.publishedNote}>
                    <img src="/images/icons/information.svg" alt="" style={{width: '16px', height: '16px', marginRight: '6px', verticalAlign: 'middle'}} />Published modules can have title, introduction, and duration updated. Passing score cannot be changed. Use "New Version" to change passing score.
                  </div>
                )}
              </div>
            </div>
            <button
              style={styles.closeButton}
              onClick={onClose}
              title="Close (Esc)"
            >
              ✕
            </button>
          </div>
          {errors.length > 0 && (
            <p style={styles.formError}>{errors[0]}</p>
          )}

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Title *</label>
              <input
                type="text"
                style={styles.input}
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter module title"
                maxLength={VALIDATION_CONSTRAINTS.MODULE.TITLE_MAX_LENGTH}
                required
              />
              <div style={{
                ...styles.characterCounter,
                color: formData.title.length > VALIDATION_CONSTRAINTS.MODULE.TITLE_MAX_LENGTH * 0.9 ? '#ef4444' : '#6b7280'
              }}>
                {formData.title.length}/{VALIDATION_CONSTRAINTS.MODULE.TITLE_MAX_LENGTH}
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Introduction *</label>
              <textarea
                style={styles.textarea}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter module introduction"
                rows={3}
                required
                maxLength={VALIDATION_CONSTRAINTS.MODULE.DESCRIPTION_MAX_LENGTH}
              />
              <div 
                style={{
                  ...styles.characterCounter,
                  color: formData.description.length > VALIDATION_CONSTRAINTS.MODULE.DESCRIPTION_MAX_LENGTH * 0.9 
                    ? '#ef4444' 
                    : '#6b7280'
                }}
              >
                {formData.description.length}/{VALIDATION_CONSTRAINTS.MODULE.DESCRIPTION_MAX_LENGTH}
              </div>
            </div>

            <div style={styles.row}>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Duration (minutes) *
                </label>
                <input
                  type="number"
                  style={styles.input}
                  value={formData.durationInMinutes}
                  onChange={(e) => setFormData({ ...formData, durationInMinutes: Number(e.target.value) })}
                  placeholder="e.g., 30"
                  min="1"
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Passing Score (%) *
                  {moduleVersion.isPublished && (
                    <span style={styles.disabledHint}> (cannot be changed for published modules)</span>
                  )}
                </label>
                <input
                  type="number"
                  style={{
                    ...styles.input,
                    ...(moduleVersion.isPublished ? styles.disabledInput : {})
                  }}
                  value={formData.passingScorePercentage}
                  onChange={(e) => setFormData({ ...formData, passingScorePercentage: Number(e.target.value) })}
                  placeholder="e.g., 70"
                  min="0"
                  max="100"
                  disabled={moduleVersion.isPublished}
                  required={!moduleVersion.isPublished}
                />
              </div>
            </div>

            {/* Attachments Section */}
            <div style={styles.formGroup}>
              <StaticFileUpload 
                files={staticFiles} 
                onFilesChange={setStaticFiles}
              />
            </div>

            <div style={styles.footer}>
              <div style={styles.leftFooter}>
                {moduleVersion.isPublished && onCreateNewVersion && (
                  <button
                    type="button"
                    style={styles.newVersionButton}
                    onClick={() => onCreateNewVersion(moduleVersion)}
                    disabled={isSubmitting}
                  >
                    📦 New Version
                  </button>
                )}
              </div>
              <div style={styles.rightFooter}>
                <button
                  type="button"
                  style={styles.cancelButton}
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={styles.submitButton}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

const styles = {
  overlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    width: '100%',
    maxWidth: '800px',
    maxHeight: '90vh',
    overflow: 'auto',
    outline: 'none',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '24px 24px 0 24px',
    borderBottom: '1px solid #e5e7eb',
    paddingBottom: '16px',
    marginBottom: '24px',
  },
  title: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  statusBadge: {
    fontSize: '14px',
    fontWeight: '500',
    padding: '4px 8px',
    borderRadius: '4px',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: '1px solid #d1d5db',
  },
  publishedNote: {
    marginTop: '8px',
    fontSize: '12px',
    color: '#059669',
    backgroundColor: '#ecfdf5',
    padding: '6px 8px',
    borderRadius: '4px',
    border: '1px solid #d1fae5',
  },
  shortcutHint: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '12px',
    color: '#6b7280',
    backgroundColor: '#f9fafb',
    padding: '8px 12px',
    borderRadius: '6px',
    marginTop: '8px',
    border: '1px solid #e5e7eb',
  },
  closeButton: {
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '24px',
    color: '#6b7280',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    lineHeight: 1,
  },
  formError: {
    fontSize: '12px',
    color: '#dc2626',
    margin: '16px 24px 16px 24px',
    padding: '8px 12px',
    backgroundColor: '#fef2f2',
    borderRadius: '6px',
    border: '1px solid #fecaca',
  },
  form: {
    padding: '0 24px 24px 24px',
  },
  formGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: '#ffffff',
    boxSizing: 'border-box' as const,
  },
  disabledInput: {
    backgroundColor: '#f9fafb',
    color: '#6b7280',
    cursor: 'not-allowed',
    borderColor: '#e5e7eb',
  },
  disabledHint: {
    fontSize: '12px',
    color: '#9ca3af',
    fontWeight: '400',
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: '#ffffff',
    resize: 'vertical' as const,
    fontFamily: 'inherit',
    boxSizing: 'border-box' as const,
  },
  row: {
    display: 'flex',
    gap: '16px',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '24px',
    borderTop: '1px solid #e5e7eb',
    marginTop: '24px',
  },
  leftFooter: {
    display: 'flex',
    gap: '12px',
  },
  rightFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
  },
  newVersionButton: {
    backgroundColor: '#8b5cf6',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    padding: '10px 16px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
  },
  cancelButton: {
    backgroundColor: '#ffffff',
    color: '#374151',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    padding: '10px 16px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    padding: '10px 16px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
  },
  characterCounter: {
    fontSize: '12px',
    textAlign: 'right' as const,
    marginTop: '4px',
    fontFamily: 'monospace',
  },
} as const;

