import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FileUploadMeta } from '../../models/file-upload-meta';
import { StaticFileDto } from '../../models/static-file';
import { cn } from '../../utils/cn';
import fileStyles from './FilePreview.module.css';

type PreviewFile = File | StaticFileDto;

interface FilePreviewProps {
  files: Array<File | StaticFileDto>;
  onFilesChange?: (files: Array<File | StaticFileDto>) => void;
  title?: string;
  readonly?: boolean;
  showFileName?: boolean;
  customStyles?: {
    container?: React.CSSProperties;
    filesGrid?: React.CSSProperties;
    fileCard?: React.CSSProperties;
  };
}

export const FilePreview = ({ 
  files, 
  onFilesChange, 
  title, 
  readonly = false, 
  showFileName = true,
  customStyles
}: FilePreviewProps) => {
  const [magnifiedImage, setMagnifiedImage] = useState<string | null>(null);
  const [filesMeta, setFilesMeta] = useState<FileUploadMeta[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });
  const imageContainerRef = useRef<HTMLDivElement>(null);
  
  // Handle escape key for closing magnified image
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && magnifiedImage) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        setMagnifiedImage(null);
      }
    };

    if (magnifiedImage) {
      // Add event listener with capture phase to ensure it runs first
      document.addEventListener('keydown', handleEscapeKey, true);
      return () => {
        document.removeEventListener('keydown', handleEscapeKey, true);
      };
    }
  }, [magnifiedImage]);
  
  useEffect(() => {
    const toFileMeta = (file: PreviewFile): FileUploadMeta => {
      if ('lastModified' in file) {
        // Handle File object
        return {
          url: URL.createObjectURL(file),
          name: file.name,
          extension: file.name.split('.').pop() || '',
          type: file.type
        };
      } else {
        // Handle StaticFileDto
        const fileName = file.name || `File-${file.id.substring(0, 8)}`;
        const extension = fileName.split('.').pop() || '';
        
        return {
          url: file.url || '',
          name: fileName,
          extension: extension,
          type: file.type || '',
          id: file.id // Store the ID for reference
        };
      }
    };
    
    const metaArray = files.map(toFileMeta);
    setFilesMeta(metaArray);
    
    // Cleanup blob URLs when files change (only for File objects)
    return () => {
      metaArray.forEach(meta => {
        // Only revoke URLs for File objects (not StaticFileDto)
        if (!meta.id && meta.url.startsWith('blob:')) {
          URL.revokeObjectURL(meta.url);
        }
      });
    };
  }, [files]);

  const removeFile = (fileUrl: string) => {
    if (!onFilesChange || readonly) return;
    
    // Find the index in filesMeta
    const idx = filesMeta.findIndex(fm => fm.url === fileUrl);
    if (idx === -1) return;
    
    // Create updated arrays
    const updatedMeta = filesMeta.filter((_, i) => i !== idx);
    const updatedFiles = files.filter((_, i) => i !== idx);
    
    // Update state
    setFilesMeta(updatedMeta);
    onFilesChange(updatedFiles);
  };

  const handleImageClick = (image: FileUploadMeta) => {
    setMagnifiedImage(image.url);
  };

  const closeMagnifiedImage = () => {
    setMagnifiedImage(null);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return;
    e.stopPropagation(); // Prevent closing modal when starting drag
    setIsMouseDown(true);
    setIsDragging(false);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      scrollLeft: imageContainerRef.current.scrollLeft,
      scrollTop: imageContainerRef.current.scrollTop
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isMouseDown || !imageContainerRef.current) return;
    const dx = Math.abs(e.clientX - dragStart.x);
    const dy = Math.abs(e.clientY - dragStart.y);
    
    // Consider it a drag if moved more than 5 pixels
    if (dx > 5 || dy > 5) {
      setIsDragging(true);
      e.preventDefault();
      e.stopPropagation();
      imageContainerRef.current.scrollLeft = dragStart.scrollLeft - (e.clientX - dragStart.x);
      imageContainerRef.current.scrollTop = dragStart.scrollTop - (e.clientY - dragStart.y);
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsMouseDown(false);
    if (isDragging) {
      e.preventDefault();
      e.stopPropagation(); // Prevent closing modal after drag
      // Use a small delay to prevent click event from firing
      setTimeout(() => setIsDragging(false), 100);
    }
  };

  const handleMouseLeave = () => {
    setIsMouseDown(false);
    setIsDragging(false);
  };

  return (
    <div className={cn(fileStyles.container)} style={customStyles?.container}>
      {title && files.length > 0 && (
        <div className={fileStyles.header}>
          <h3 className={fileStyles.title}>{title}</h3>
        </div>
      )}

      {files.length > 0 && (
        <div className={cn(fileStyles.filesGrid)} style={customStyles?.filesGrid}>
          {filesMeta.map((fileMeta) => (
            <FilePreviewCard
              key={fileMeta.url}
              fileMeta={fileMeta}
              onRemove={readonly ? undefined : () => removeFile(fileMeta.url)}
              onImageClick={handleImageClick}
              showFileName={showFileName}
              customStyles={customStyles}
            />
          ))}
        </div>
      )}

      {files.length === 0 && (
        <div className={fileStyles.emptyState}>
          <span className={fileStyles.emptyIcon}><img src="/images/icons/attachment.svg" alt="" style={{width: '32px', height: '32px'}} /></span>
          <p className={fileStyles.emptyText}>No attachments</p>
        </div>
      )}

      {/* Image Modal */}
      {magnifiedImage && createPortal(
        <div 
          className={fileStyles.modal} 
          onClick={closeMagnifiedImage}
          data-modal-type="file-preview"
        >
          <div 
            className={fileStyles.modalContent}
            onClick={(e) => {
              if (isDragging) {
                e.stopPropagation();
                return;
              }
              closeMagnifiedImage();
            }}
          >
            <button
              className={fileStyles.closeButton}
              onClick={closeMagnifiedImage}
              title="Close"
            >
              ✕
            </button>
            <div 
              ref={imageContainerRef}
              className={fileStyles.imageContainer}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              style={{ 
                cursor: isDragging ? 'grabbing' : 'grab',
                overflow: 'auto'
              }}
            >
              <img
                src={magnifiedImage}
                className={fileStyles.magnifiedImage}
                alt="Magnified preview"
                draggable={false}
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

// File Preview Card Component
interface FilePreviewCardProps {
  fileMeta: FileUploadMeta;
  onRemove?: () => void;
  onImageClick: (image: FileUploadMeta) => void;
  showFileName?: boolean;
  customStyles?: {
    container?: React.CSSProperties;
    filesGrid?: React.CSSProperties;
    fileCard?: React.CSSProperties;
  };
}

const FilePreviewCard = ({ fileMeta, onRemove, onImageClick, showFileName = true, customStyles }: FilePreviewCardProps) => {
  const [imageError, setImageError] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleAudioClick = () => {
    if (audioRef.current) {
      if (audioRef.current.paused) {
        audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
    }
  };

  const getFileType = (extension: string) => {
    if (extension.match(/jpg|jpeg|png|gif|webp|svg$/i)) return 'image';
    if (extension.match(/mp3|wav|ogg|m4a|aac$/i)) return 'audio';
    if (extension.match(/mp4|avi|mov|wmv|webm$/i)) return 'video';
    if (extension.match(/pdf$/i)) return 'pdf';
    if (extension.match(/doc|docx$/i)) return 'document';
    return 'unknown';
  };

  const fileType = getFileType(fileMeta.extension);

  const getFileSize = (extension: string) => {
    // This would need to be implemented based on the file metadata
    return '';
  };

  const renderPreview = () => {
    switch (fileType) {
      case 'image':
        return imageError ? (
          <div className={fileStyles.brokenImagePreview}>
            <span className={fileStyles.brokenImageIcon}>🖼️</span>
            <span className={fileStyles.brokenImageText}>Image not available</span>
          </div>
        ) : (
          <div className={fileStyles.clickableImage}>
            <img
              src={fileMeta.url}
              className={fileStyles.imagePreview}
              onError={() => setImageError(true)}
              onClick={() => onImageClick(fileMeta)}
              alt=""
            />
            <div className={fileStyles.magnifyOverlay}>
              <span className={fileStyles.magnifyIcon}>🔍</span>
              <span className={fileStyles.clickHint}>Click to view</span>
            </div>
          </div>
        );
      case 'audio':
        return (
          <div className={fileStyles.audioPreview} onClick={handleAudioClick} style={{ cursor: 'pointer' }}>
            <div className={fileStyles.audioIcon}>🎵</div>
            <audio 
              ref={audioRef} 
              controls 
              className={fileStyles.audioPlayer}
              onClick={(e) => e.stopPropagation()}
            >
              <source src={fileMeta.url} />
              Your browser does not support the audio element.
            </audio>
          </div>
        );
      case 'video':
        return (
          <div className={fileStyles.clickableImage}>
            <video 
              controls 
              className={fileStyles.videoPlayer}
              preload="metadata"
            >
              <source src={fileMeta.url} />
              Your browser does not support the video element.
            </video>
            <div className={fileStyles.magnifyOverlay}>
              <span className={fileStyles.clickHint}>Double click to enter full screen</span>
            </div>
          </div>
        );
      case 'pdf':
        return (
          <div className={fileStyles.fileTypePreview}>
            <div className={fileStyles.fileTypeIcon}>📄</div>
            <span className={fileStyles.fileTypeName}>PDF</span>
          </div>
        );
      case 'document':
        return (
          <div className={fileStyles.fileTypePreview}>
            <div className={fileStyles.fileTypeIcon}>📝</div>
            <span className={fileStyles.fileTypeName}>DOC</span>
          </div>
        );
      default:
        return (
          <div className={fileStyles.fileTypePreview}>
            <div className={fileStyles.fileTypeIcon}><img src="/images/icons/folder.svg" alt="" style={{width: '48px', height: '48px'}} /></div>
            <span className={fileStyles.fileTypeName}>FILE</span>
          </div>
        );
    }
  };

  return (
    <div 
      className={cn(fileStyles.fileCard)} 
      style={customStyles?.fileCard}
    >
      <div className={fileStyles.previewContainer}>
        {renderPreview()}
        {onRemove && (
          <button
            onClick={onRemove}
            className={fileStyles.removeButton}
            title="Remove file"
          >
            ✕
          </button>
        )}
      </div>
      
      {showFileName && (
        <div className={fileStyles.fileInfo}>
          <div className={fileStyles.fileDetails}>
            <div className={fileStyles.fileName} title={fileMeta.name}>
              {fileMeta.name}
            </div>
            <div className={fileStyles.fileMetadata}>
              <span className={fileStyles.fileType}>{fileType.toUpperCase()}</span>
              {getFileSize(fileMeta.url) && (
                <span className={fileStyles.fileSize}>{getFileSize(fileMeta.url)}</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};