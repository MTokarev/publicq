import { useState, useEffect, useCallback } from "react";
import { AssessmentModuleCreateDto } from "../../models/assessment-modules-create";
import { assessmentService } from "../../services/assessmentService";
import FormGroup from "../Shared/FormGroup";
import { ModuleVersionSettings } from "./ModuleVersionSettings";
import StaticFileUpload from "../Shared/StaticFileUpload";
import { StaticFileDto } from "../../models/static-file";
import { AssessmentModuleDto } from "../../models/assessment-module";
import { AssessmentModuleVersionUpdateDto } from "../../models/assessment-modules-update";
import { VALIDATION_CONSTRAINTS } from "../../constants/contstants";
import { parseFileUploadError } from "../../utils/fileUploadErrorHandler";

type PreviewFile = File | StaticFileDto;

interface Props {
  onSuccess: (module: AssessmentModuleDto) => void;
  onBackToModules?: () => void;
}

export const ModuleForm = ({ onSuccess, onBackToModules }: Props) => {
  const [form, setForm] = useState<AssessmentModuleCreateDto>({
    title: "",
    description: "",
    passingScorePercentage: 70,
    durationInMinutes: 60,
    createdByUserId: "user-id-placeholder"
  });

  const [errors, setErrors] = useState<string[]>([]);
  const [staticFiles, setStaticFiles] = useState<PreviewFile[]>([]);
  const [isButtonHovered, setIsButtonHovered] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState<{[key: string]: boolean}>({});

  const validateForm = (): string[] => {
    const errors: string[] = [];

    // Title validation
    if (!form.title.trim()) {
      errors.push('Title is required');
    } else if (form.title.trim().length < 3) {
      errors.push('Title must be at least 3 characters long');
    } else if (form.title.trim().length > VALIDATION_CONSTRAINTS.MODULE.TITLE_MAX_LENGTH) {
      errors.push(`Title must be less than ${VALIDATION_CONSTRAINTS.MODULE.TITLE_MAX_LENGTH} characters`);
    }

    // Introduction validation
    if (!form.description.trim()) {
      errors.push('Introduction is required');
    } else if (form.description.trim().length < 10) {
      errors.push('Introduction must be at least 10 characters long');
    } else if (form.description.trim().length > VALIDATION_CONSTRAINTS.MODULE.DESCRIPTION_MAX_LENGTH) {
      errors.push(`Introduction must be less than ${VALIDATION_CONSTRAINTS.MODULE.DESCRIPTION_MAX_LENGTH} characters`);
    }

    // Duration validation
    if (form.durationInMinutes <= 0) {
      errors.push('Duration must be greater than 0 minutes');
    } else if (form.durationInMinutes > 1440) { // 24 hours
      errors.push('Duration cannot exceed 24 hours (1440 minutes)');
    }

    // Passing score validation
    if (form.passingScorePercentage < 1) {
      errors.push('Passing score must be at least 1%');
    } else if (form.passingScorePercentage > 100) {
      errors.push('Passing score cannot exceed 100%');
    }

    return errors;
  };

  const getFieldError = (fieldName: string): string | null => {
    if (!touched[fieldName]) return null;

    switch (fieldName) {
      case 'title':
        if (!form.title.trim()) return 'Title is required';
        if (form.title.trim().length < 3) return 'Title must be at least 3 characters long';
        if (form.title.trim().length > 100) return 'Title must be less than 100 characters';
        break;
      case 'description':
        if (!form.description.trim()) return 'Introduction is required';
        if (form.description.trim().length < 10) return 'Introduction must be at least 10 characters long';
        break;
      case 'durationInMinutes':
        if (form.durationInMinutes <= 0) return 'Duration must be greater than 0 minutes';
        if (form.durationInMinutes > 1440) return 'Duration cannot exceed 24 hours (1440 minutes)';
        break;
      case 'passingScorePercentage':
        if (form.passingScorePercentage < 1) return 'Passing score must be at least 1%';
        if (form.passingScorePercentage > 100) return 'Passing score cannot exceed 100%';
        break;
    }
    return null;
  };

  const isFieldValid = (fieldName: string): boolean => {
    return getFieldError(fieldName) === null;
  };

  const isFormValid = (): boolean => {
    return validateForm().length === 0;
  };

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return; // Prevent multiple submissions
    
    // Mark all fields as touched for validation display
    setTouched({
      title: true,
      description: true,
      durationInMinutes: true,
      passingScorePercentage: true,
    });
    
    // Validate form before submission
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setIsSubmitting(true);
    setErrors([]);

    try {
      const response = await assessmentService.createModule(form);
      if (response.isFailed) {
        setErrors(response.errors);
        return; // Don't proceed with file upload if module creation failed
      } else {
        // Only proceed with file handling if there are files to process
        if (staticFiles.length > 0) {
          // Filter out only File objects (not StaticFileDto) for upload
          const filesToUpload = staticFiles.filter((file): file is File => 'lastModified' in file);
          
          // Get IDs of existing StaticFileDto objects
          const existingFileIds = staticFiles
            .filter((file): file is StaticFileDto => !('lastModified' in file))
            .map(file => file.id);
          
          let fileStaticIds: string[] = existingFileIds;
          
          if (filesToUpload.length > 0) {
            const fileUploadRequests = filesToUpload.map(file => ({
              file,
              moduleId: response.data.id,
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

          // Associate static file IDs with the module
          const updatedModule: AssessmentModuleVersionUpdateDto = {
            id: response.data.latestVersion.id,
            title: response.data.latestVersion.title,
            description: response.data.latestVersion.description,
            passingScorePercentage: response.data.latestVersion.passingScorePercentage,
            durationInMinutes: response.data.latestVersion.durationInMinutes,
            staticFileIds: fileStaticIds
          };
          const updateResult = await assessmentService.updateNotPublishedModuleVersion(updatedModule);

          if (updateResult.isFailed) {
            setErrors(updateResult.errors);
            return;
          }
        }

        onSuccess(response.data);
      }
    } catch (error: any) {
      // Handle API errors properly - extract message from response
      const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred. Please try again.';
      setErrors([errorMessage]);
    } finally {
      setIsSubmitting(false);
    }
  }, [form, staticFiles, isSubmitting]); // Dependencies for useCallback

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Enter to submit (only if not already submitting and form is valid)
      if (!isSubmitting && (e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
      // Only handle Ctrl+S on non-Mac platforms to avoid browser save dialog
      if (!navigator.platform.includes('Mac') && !isSubmitting && e.ctrlKey && e.key === 's') {
        e.preventDefault();
        handleSubmit();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleSubmit, isSubmitting]); // Now we can include handleSubmit since it's memoized

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Create New Assessment Module</h2>
        
        {errors.length > 0 && (
          <p style={styles.formError}>{errors[0]}</p>
        )}
        
        <div style={styles.shortcutHint}>
          <img src="/images/icons/light-bulb.svg" alt="" style={{width: '14px', height: '14px', marginRight: '6px', verticalAlign: 'middle'}} />Press {navigator.platform.includes('Mac') ? 'Cmd+Enter' : 'Ctrl+S or Ctrl+Enter'} to create the module {validateForm().length > 0 && '(complete the form first)'}
        </div>
        
        <div style={styles.form}>
          <FormGroup label="Title">
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              style={{
                ...styles.input,
                borderColor: touched.title && !isFieldValid('title') ? '#ef4444' : '#d1d5db',
              }}
              placeholder="Enter module title"
              maxLength={VALIDATION_CONSTRAINTS.MODULE.TITLE_MAX_LENGTH}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = touched.title && !isFieldValid('title') ? '#ef4444' : '#3b82f6';
              }}
              onBlur={(e) => {
                setTouched({ ...touched, title: true });
                e.currentTarget.style.borderColor = touched.title && !isFieldValid('title') ? '#ef4444' : '#d1d5db';
              }}
            />
            <div style={{
              ...styles.characterCounter,
              color: form.title.length > VALIDATION_CONSTRAINTS.MODULE.TITLE_MAX_LENGTH * 0.9 ? '#ef4444' : '#6b7280'
            }}>
              {form.title.length}/{VALIDATION_CONSTRAINTS.MODULE.TITLE_MAX_LENGTH}
            </div>
            {touched.title && getFieldError('title') && (
              <div style={styles.fieldError}>{getFieldError('title')}</div>
            )}
          </FormGroup>

          <FormGroup label="Introduction">
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
              style={{
                ...styles.textarea,
                borderColor: touched.description && !isFieldValid('description') ? '#ef4444' : '#d1d5db',
              }}
              placeholder="Enter module introduction"
              maxLength={VALIDATION_CONSTRAINTS.MODULE.DESCRIPTION_MAX_LENGTH}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = touched.description && !isFieldValid('description') ? '#ef4444' : '#3b82f6';
              }}
              onBlur={(e) => {
                setTouched({ ...touched, description: true });
                e.currentTarget.style.borderColor = touched.description && !isFieldValid('description') ? '#ef4444' : '#d1d5db';
              }}
            />
            <div style={{
              ...styles.characterCounter,
              color: form.description.length > VALIDATION_CONSTRAINTS.MODULE.DESCRIPTION_MAX_LENGTH * 0.9 ? '#ef4444' : '#6b7280'
            }}>
              {form.description.length}/{VALIDATION_CONSTRAINTS.MODULE.DESCRIPTION_MAX_LENGTH}
            </div>
            {touched.description && getFieldError('description') && (
              <div style={styles.fieldError}>{getFieldError('description')}</div>
            )}
          </FormGroup>

                <ModuleVersionSettings
                  form={form}
                  onChange={(update) => setForm({ ...form, ...update })}
                  touched={touched}
                  getFieldError={getFieldError}
                  onFieldTouch={(fieldName) => setTouched({ ...touched, [fieldName]: true })}
                />          <div style={styles.fileSection}>
            <StaticFileUpload 
              files={staticFiles} 
              onFilesChange={(files) => {
                setStaticFiles(files);
                
                // Log file IDs from StaticFileDto objects
                const staticFileIds = files
                  .filter((file): file is StaticFileDto => !('lastModified' in file))
                  .map(file => file.id);
              }} 
            />
          </div>

          <div style={styles.footer}>
            {onBackToModules ? (
              <button
                onClick={onBackToModules}
                style={styles.backButton}
                type="button"
              >
                ← Back to Modules
              </button>
            ) : (
              <div style={{ flex: 1 }}></div>
            )}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !isFormValid()}
              style={{
                ...styles.submitButton,
                backgroundColor: isSubmitting || !isFormValid() ? '#94a3b8' : (isButtonHovered ? '#2563eb' : '#3b82f6'),
                cursor: isSubmitting || !isFormValid() ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={() => !isSubmitting && isFormValid() && setIsButtonHovered(true)}
              onMouseLeave={() => setIsButtonHovered(false)}
            >
              {isSubmitting ? 'Creating Module...' : 'Create Module'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  formError: {
    fontSize: '12px',
    color: '#dc2626',
    margin: '16px 0 16px 0',
    padding: '8px 12px',
    backgroundColor: '#fef2f2',
    borderRadius: '6px',
    border: '1px solid #fecaca',
  },
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
  title: {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0 0 1.5rem 0',
  },
  shortcutHint: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '0.75rem',
    color: '#6b7280',
    backgroundColor: '#f9fafb',
    padding: '8px 12px',
    borderRadius: '6px',
    marginBottom: '1.5rem',
    border: '1px solid #e5e7eb',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1.25rem',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '0.875rem',
    backgroundColor: '#ffffff',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.2s ease-in-out',
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '0.875rem',
    backgroundColor: '#ffffff',
    resize: 'vertical' as const,
    fontFamily: 'inherit',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.2s ease-in-out',
  },
  fieldError: {
    fontSize: '0.75rem',
    color: '#ef4444',
    marginTop: '4px',
    fontWeight: '400',
  },
  fileSection: {
    marginTop: '0.5rem',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '1.5rem',
    paddingTop: '1.5rem',
    borderTop: '1px solid #e5e7eb',
  },
  backButton: {
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: '2px solid #d1d5db',
    borderRadius: '6px',
    padding: '10px 16px',
    fontSize: '0.875rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    minWidth: '140px',
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    padding: '10px 16px',
    fontSize: '0.875rem',
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