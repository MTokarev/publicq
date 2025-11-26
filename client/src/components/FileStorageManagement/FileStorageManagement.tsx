import React, { useState, useEffect } from 'react';
import { configurationService } from '../../services/configurationService';
import styles from './FileStorageManagement.module.css';

interface FileStorageManagementProps {
  fileStorageConfig: { maxSizeKb: number; dataLoaded: boolean };
  setFileStorageConfig: React.Dispatch<React.SetStateAction<{ maxSizeKb: number; dataLoaded: boolean }>>;
}

const FileStorageManagement: React.FC<FileStorageManagementProps> = ({ 
  fileStorageConfig, 
  setFileStorageConfig 
}) => {
  const [originalMaxSize, setOriginalMaxSize] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (fileStorageConfig.dataLoaded) {
      return;
    }
    loadFileStorageOptions();
  }, []);

  const loadFileStorageOptions = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await configurationService.getAttachmentMaxSizeKb();
      
      if (response.isSuccess && response.data !== undefined) {
        const maxSize = response.data.maxUploadFileSizeInKilobytes;
        setFileStorageConfig({ maxSizeKb: maxSize, dataLoaded: true });
        setOriginalMaxSize(maxSize);
      } else {
        throw new Error(response.message || 'Failed to load file storage configuration');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load file storage configuration');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (fileStorageConfig.maxSizeKb < 1) {
      setError('Maximum file size must be at least 1 KB');
      return false;
    }
    if (fileStorageConfig.maxSizeKb > 102400) { // 100 MB
      setError('Maximum file size cannot exceed 100 MB (102,400 KB)');
      return false;
    }
    return true;
  };

  const handleSaveOptions = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await configurationService.setAttachmentMaxSizeKb(fileStorageConfig.maxSizeKb);
      
      if (response.isSuccess) {
        setOriginalMaxSize(fileStorageConfig.maxSizeKb);
        setSuccess('File storage configuration saved successfully');
        setTimeout(() => setSuccess(''), 5000);
      } else {
        throw new Error(response.message || 'Failed to save file storage configuration');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save file storage configuration');
    } finally {
      setLoading(false);
    }
  };

  const hasUnsavedChanges = () => {
    return fileStorageConfig.maxSizeKb !== originalMaxSize;
  };

  const handleReset = () => {
    setFileStorageConfig({ maxSizeKb: originalMaxSize, dataLoaded: true });
    setError('');
    setSuccess('');
  };

  const formatFileSize = (sizeKb: number) => {
    if (sizeKb < 1024) {
      return `${sizeKb} KB`;
    } else if (sizeKb < 1024 * 1024) {
      return `${(sizeKb / 1024).toFixed(1)} MB`;
    } else {
      return `${(sizeKb / (1024 * 1024)).toFixed(1)} GB`;
    }
  };

  const getCommonSizeOptions = () => [
    { label: '1 MB', value: 1024 },
    { label: '5 MB', value: 5 * 1024 },
    { label: '10 MB', value: 10 * 1024 },
    { label: '25 MB', value: 25 * 1024 },
    { label: '50 MB', value: 50 * 1024 },
    { label: '100 MB', value: 100 * 1024 },
  ];

  if (loading && !fileStorageConfig.dataLoaded) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingText}>Loading file storage configuration...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title} style={{display: 'flex', alignItems: 'center'}}><img src="/images/icons/filing-cabinet.svg" alt="" style={{width: '28px', height: '28px', marginRight: '10px'}} />File Storage Configuration</h2>
      
      {/* Information Section */}
      <div className={styles.infoSection}>
        <h3 className={styles.sectionTitle}>Information</h3>
        <div className={styles.infoCard}>
          <h4 className={styles.infoTitle}>
            Current Maximum File Size: {!fileStorageConfig.dataLoaded ? (
              <span style={{color: 'var(--color-gray-500)', fontWeight: 'var(--font-weight-medium)'}}>Loading...</span>
            ) : (
              <span style={{color: 'var(--color-success)', fontWeight: 'var(--font-weight-medium)'}}>{formatFileSize(fileStorageConfig.maxSizeKb)}</span>
            )}
          </h4>
          <p className={styles.infoText}>
            This setting controls the maximum size allowed for file uploads throughout the system, including:
          </p>
          <ul className={styles.infoList}>
            <li>Assessment module static files (images, documents)</li>
            <li>Question attachments and supporting materials</li>
            <li>Answer choice attachments</li>
            <li>User-uploaded content and resources</li>
          </ul>
          <p className={styles.infoText}>
            <strong>Note:</strong> Larger file sizes improve flexibility but may impact performance and storage requirements.
            Consider your server's available storage and bandwidth when setting this value.
          </p>
        </div>
      </div>

      {/* Configuration Section */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>File Size Settings</h3>
        
        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}

        {success && (
          <div className={styles.success}>
            {success}
          </div>
        )}
        
        <div className={styles.formGroup}>
          <label className={styles.label}>Maximum File Size (KB)</label>
          <input
            type="number"
            min="1"
            max="102400"
            value={fileStorageConfig.dataLoaded ? fileStorageConfig.maxSizeKb : ''}
            onChange={(e) => {
              const value = parseInt(e.target.value) || 1;
              setFileStorageConfig({
                ...fileStorageConfig,
                maxSizeKb: value
              });
              setError('');
              setSuccess('');
            }}
            className={styles.input}
            style={{
              opacity: !fileStorageConfig.dataLoaded ? 0.6 : 1,
              cursor: !fileStorageConfig.dataLoaded ? 'not-allowed' : 'text'
            }}
            placeholder={!fileStorageConfig.dataLoaded ? "Loading..." : "Enter maximum file size in KB"}
            disabled={!fileStorageConfig.dataLoaded}
          />
          <small className={styles.helpText}>
            Enter the maximum file size in kilobytes (1 KB to 102,400 KB / 100 MB).
            {fileStorageConfig.dataLoaded ? (
              <>Current value: <strong>{formatFileSize(fileStorageConfig.maxSizeKb)}</strong></>
            ) : (
              <span style={{color: '#6b7280'}}>Loading current configuration...</span>
            )}
          </small>
        </div>

        {/* Quick Size Selection */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Quick Size Selection</label>
          <div className={styles.quickSizeGrid}>
            {getCommonSizeOptions().map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  if (fileStorageConfig.dataLoaded) {
                    setFileStorageConfig({
                      ...fileStorageConfig,
                      maxSizeKb: option.value
                    });
                    setError('');
                    setSuccess('');
                  }
                }}
                disabled={!fileStorageConfig.dataLoaded}
                className={`${styles.quickSizeButton} ${fileStorageConfig.maxSizeKb === option.value && fileStorageConfig.dataLoaded ? styles.quickSizeButtonActive : ''}`}
                style={{
                  opacity: !fileStorageConfig.dataLoaded ? 0.6 : 1,
                  cursor: !fileStorageConfig.dataLoaded ? 'not-allowed' : 'pointer'
                }}
                onMouseEnter={(e) => {
                  if (fileStorageConfig.dataLoaded && fileStorageConfig.maxSizeKb !== option.value) {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                    e.currentTarget.style.borderColor = '#9ca3af';
                  }
                }}
                onMouseLeave={(e) => {
                  if (fileStorageConfig.dataLoaded && fileStorageConfig.maxSizeKb !== option.value) {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                    e.currentTarget.style.borderColor = '#d1d5db';
                  }
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
          <small className={styles.helpText}>
            {fileStorageConfig.dataLoaded ? (
              "Click any button above to quickly set common file size limits."
            ) : (
              <span style={{color: '#6b7280'}}>Quick selection will be available after loading...</span>
            )}
          </small>
        </div>

        <div className={styles.buttonGroup}>
          <button
            onClick={handleSaveOptions}
            disabled={loading || !hasUnsavedChanges()}
            className={styles.saveButton}
            style={{
              opacity: loading || !hasUnsavedChanges() ? 0.6 : 1,
              cursor: loading || !hasUnsavedChanges() ? 'not-allowed' : 'pointer'
            }}
            onMouseEnter={(e) => {
              if (!loading && hasUnsavedChanges()) {
                e.currentTarget.style.backgroundColor = '#2563eb';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(59, 130, 246, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading && hasUnsavedChanges()) {
                e.currentTarget.style.backgroundColor = '#3b82f6';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
              }
            }}
          >
            {loading ? 'Saving...' : 'Save File Storage Configuration'}
          </button>
          
          {hasUnsavedChanges() && (
            <button
              onClick={handleReset}
              disabled={loading}
              className={styles.resetButton}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                  e.currentTarget.style.borderColor = '#9ca3af';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = '#ffffff';
                  e.currentTarget.style.borderColor = '#d1d5db';
                }
              }}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Guidelines Section */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>File Size Guidelines</h3>
        <div className={styles.guidelinesGrid}>
          <div className={styles.guidelineCard}>
            <h4 className={styles.guidelineTitle}>📋 Small Files (1-5 MB)</h4>
            <ul className={styles.guidelineList}>
              <li>Images for questions and answers</li>
              <li>Simple documents and PDFs</li>
              <li>Basic charts and diagrams</li>
              <li>Text-based content files</li>
            </ul>
            <p className={styles.guidelineNote}>
              <strong>Recommended for:</strong> Most educational content
            </p>
          </div>
          <div className={styles.guidelineCard}>
            <h4 className={styles.guidelineTitle}>📊 Medium Files (5-25 MB)</h4>
            <ul className={styles.guidelineList}>
              <li>High-resolution images</li>
              <li>Detailed presentation files</li>
              <li>Complex documents with media</li>
              <li>Audio clips for assessments</li>
            </ul>
            <p className={styles.guidelineNote}>
              <strong>Recommended for:</strong> Media-rich assessments
            </p>
          </div>
          <div className={styles.guidelineCard}>
            <h4 className={styles.guidelineTitle}>🎥 Large Files (25-100 MB)</h4>
            <ul className={styles.guidelineList}>
              <li>Video content for questions</li>
              <li>Large datasets and resources</li>
              <li>Interactive media files</li>
              <li>Comprehensive case studies</li>
            </ul>
            <p className={styles.guidelineNote}>
              <strong>Recommended for:</strong> Advanced multimedia assessments
            </p>
          </div>
        </div>
        
        <div className={styles.warningCard}>
          <div className={styles.warningIcon}>⚠️</div>
          <div className={styles.warningContent}>
            <h4 className={styles.warningTitle}>Important Considerations</h4>
            <ul className={styles.warningList}>
              <li><strong>Storage Space:</strong> Larger limits require more server storage capacity</li>
              <li><strong>Upload Time:</strong> Large files take longer to upload, especially on slower connections</li>
              <li><strong>Performance:</strong> Very large files may impact system performance during upload and processing</li>
              <li><strong>User Experience:</strong> Consider your users' internet connection speeds when setting limits</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileStorageManagement;