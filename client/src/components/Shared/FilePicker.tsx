import React, { useState } from "react";
import { cn } from '../../utils/cn';
import styles from './FilePicker.module.css';

interface FileUploadProps {
  label?: string;
  multiple?: boolean;
  accept?: string;
  onFilesSelected: (files: FileList) => void;
  maxFiles?: number;
  title?: string;
}

const FilePicker: React.FC<FileUploadProps> = ({
  label = "Choose file",
  multiple = false,
  accept = "*",
  onFilesSelected,
  maxFiles,
  title = "Select Files",
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [shake, setShake] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setErrorMessage(null); // Clear any previous error
      onFilesSelected(e.target.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
    setErrorMessage(null); // Clear error when starting new drag
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      // Filter files based on accept prop if specified
      if (accept && accept !== "*") {
        const acceptedExtensions = accept.split(',').map(ext => ext.trim().toLowerCase());
        const filteredFiles: File[] = [];
        
        Array.from(e.dataTransfer.files).forEach(file => {
          const fileName = file.name.toLowerCase();
          const isAccepted = acceptedExtensions.some(ext => {
            if (ext.startsWith('.')) {
              // Extension format like .jpg, .png
              return fileName.endsWith(ext);
            } else if (ext.includes('/')) {
              // MIME type format like image/jpeg
              return file.type === ext;
            } else {
              // Simple extension without dot
              return fileName.endsWith('.' + ext);
            }
          });
          
          if (isAccepted) {
            filteredFiles.push(file);
          }
        });
        
        if (filteredFiles.length > 0) {
          // Create a new FileList-like object with filtered files
          const dt = new DataTransfer();
          filteredFiles.forEach(file => dt.items.add(file));
          setErrorMessage(null); // Clear any previous error
          onFilesSelected(dt.files);
        } else {
          // Show shake animation and error message
          setShake(true);
          setErrorMessage(`Only ${accept} files are supported`);
          setTimeout(() => setShake(false), 500);
          // Auto-clear error message after 5 seconds
          setTimeout(() => setErrorMessage(null), 5000);
        }
      } else {
        // No filtering needed, accept all files
        setErrorMessage(null); // Clear any previous error
        onFilesSelected(e.dataTransfer.files);
      }
    }
  };

  return (
    <div className={styles.container}>
      <div
        className={cn(
          styles.dropZone,
          dragOver && styles.dropZoneActive,
          shake && styles.dropZoneShake
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className={styles.dropZoneContent}>
          <span className={styles.dropZoneIcon}><img src="/images/icons/folder.svg" alt="" style={{width: '48px', height: '48px'}} /></span>
          <p className={styles.dropZoneText}>
            Drag and drop files here, or{' '}
            <label htmlFor="file-upload" className={styles.browseLink}>
              browse
            </label>
          </p>
          <p className={styles.dropZoneSubtext}>
            Supports: {accept}
            {maxFiles && ` (max ${maxFiles} files)`}
          </p>
        </div>
      </div>
      {errorMessage && (
        <div className={styles.errorMessage}>
          <span className={styles.errorIcon}>⚠️</span>
          {errorMessage}
        </div>
      )}
      <div className={styles.header}>
        <div className={styles.headerRight}>
          <div>
            <input
              type="file"
              accept={accept}
              multiple={multiple}
              onChange={handleChange}
              className={styles.hiddenInput}
              id="file-upload"
            />
            <label htmlFor="file-upload" className={styles.uploadButton}>
              {label}
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilePicker;