import { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { QuestionCreateDto, PossibleAnswerCreateDto } from '../../models/assessment-modules-create';
import { QuestionType } from '../../models/question-types';
import StaticFileUpload from '../Shared/StaticFileUpload';
import { FileUploadRequest } from '../../models/file-upload-request';
import { assessmentService } from '../../services/assessmentService';
import { StaticFileDto } from '../../models/static-file';
import { FilePreview } from '../Shared/FilePreview';
import { VALIDATION_CONSTRAINTS } from '../../constants/contstants';
import { parseFileUploadError } from '../../utils/fileUploadErrorHandler';

type PreviewFile = File | StaticFileDto;

interface Props {
  moduleId: string;
  moduleVersionId: string;
  question?: QuestionCreateDto;
  staticFiles: PreviewFile[];
  setStaticFiles: React.Dispatch<React.SetStateAction<PreviewFile[]>>;
  onClose: () => void;
  onSuccess: (question: QuestionCreateDto) => void;
  // Pass answer attachment file names for better display when editing
  answerAttachmentNames?: Record<string, string>;
  // Pass answer attachment URLs for preview when editing
  answerAttachmentUrls?: Record<string, string>;
}

export const QuestionForm = ({
  moduleId,
  moduleVersionId,
  question,
  onClose,
  onSuccess,
  staticFiles,
  setStaticFiles,
  answerAttachmentNames = {},
  answerAttachmentUrls = {}
}: Props) => {
  const [formData, setFormData] = useState<QuestionCreateDto>(() => {
    // Parse question type from string to enum value
    let defaultType = QuestionType.SingleChoice;
    if (question?.type !== undefined) {
      if (typeof question.type === 'string') {
        // Parse string enum value to number
        defaultType = QuestionType[question.type as keyof typeof QuestionType] ?? QuestionType.SingleChoice;
      } else {
        // Already a number, use as is
        defaultType = question.type;
      }
    }
    
    return {
      internalId: question?.internalId || uuidv4(),
      order: question?.order || 0,
      moduleId,
      moduleVersionId,
      text: question?.text || '',
      type: defaultType,
      staticFileIds: question?.staticFileIds || [],
      answers: question?.answers || (
        defaultType === QuestionType.FreeText 
          ? [{ text: '', isCorrect: true, staticFileIds: [], order: 0 }] // Free text starts with one answer
          : [
              { text: '', isCorrect: true, staticFileIds: [], order: 0 },
              { text: '', isCorrect: false, staticFileIds: [], order: 1 }
            ]
      )
    };
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [lastSubmissionTime, setLastSubmissionTime] = useState(0);
  const [answerFiles, setAnswerFiles] = useState<Record<number, File[]>>({});
  // Map to store blob URLs to their corresponding files
  const [blobUrlsToFiles, setBlobUrlsToFiles] = useState<Record<string, File>>({});
  // Track existing answer attachment file names for better display
  const [localAnswerAttachmentNames, setLocalAnswerAttachmentNames] = useState<Record<string, string>>(answerAttachmentNames);
  
  // Preview modal state
  const [showPreview, setShowPreview] = useState(false);
  const [previewFiles, setPreviewFiles] = useState<StaticFileDto[]>([]);
  const [previewTitle, setPreviewTitle] = useState('');
  const [previewAnswerIndex, setPreviewAnswerIndex] = useState<number>(-1);
  
  // Ref for modal focus management
  const modalRef = useRef<HTMLDivElement>(null);
  const previewModalRef = useRef<HTMLDivElement>(null);

  // Ensure modal gets focus when it opens
  useEffect(() => {
    if (modalRef.current) {
      modalRef.current.focus();
    }
  }, []);

  // Focus preview modal when it opens
  useEffect(() => {
    if (showPreview && previewModalRef.current) {
      previewModalRef.current.focus();
    }
  }, [showPreview]);

  // Helper function to close preview and return focus to main form
  const closePreview = () => {
    setShowPreview(false);
    setPreviewAnswerIndex(-1);
    // Use requestAnimationFrame to ensure the preview modal is fully unmounted
    // before returning focus to prevent event conflicts
    requestAnimationFrame(() => {
      if (modalRef.current) {
        modalRef.current.focus();
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent, editing: boolean = false) => {
    e.preventDefault();

    // Prevent rapid double submissions
    const now = Date.now();
    if (isSubmitting || (now - lastSubmissionTime) < 1000) {
      return;
    }
    
    setLastSubmissionTime(now);

    // Validation
    const validationErrors: string[] = [];
    
    // Question text is required only if there are no attachments
    const questionText = formData.text || '';
    const hasQuestionAttachments = (formData.staticFileIds && formData.staticFileIds.length > 0) || staticFiles.length > 0;
    
    if (!questionText.trim() && !hasQuestionAttachments) {
      validationErrors.push('Question must have either text or at least one attachment');
    }
    
    if (questionText.length > VALIDATION_CONSTRAINTS.QUESTION.TEXT_MAX_LENGTH) {
      validationErrors.push(`Question text must not exceed ${VALIDATION_CONSTRAINTS.QUESTION.TEXT_MAX_LENGTH} characters`);
    }
    
    // Different validation for free text vs choice questions
    if (formData.type === QuestionType.FreeText) {
      if (formData.answers.length < 1) {
        validationErrors.push('At least one acceptable answer is required for free text questions');
      }
    } else {
      if (formData.answers.length < 2) {
        validationErrors.push('At least 2 answers are required for choice questions');
      }
    }
    
    // Check that each answer has either text or attachments
    if (formData.type !== QuestionType.FreeText) {
      const invalidAnswers = formData.answers.some(answer => 
        !answer.text.trim() && (!answer.staticFileIds || answer.staticFileIds.length === 0)
      );
      if (invalidAnswers) {
        validationErrors.push('Each answer must have either text or at least one attachment');
      }
      
      // Check answer text length
      const longAnswers = formData.answers.some(answer => 
        answer.text.length > VALIDATION_CONSTRAINTS.POSSIBLE_ANSWER.TEXT_MAX_LENGTH
      );
      if (longAnswers) {
        validationErrors.push(`Answer text must not exceed ${VALIDATION_CONSTRAINTS.POSSIBLE_ANSWER.TEXT_MAX_LENGTH} characters`);
      }
    } else {
      // For free text, answers must have text
      const invalidAnswers = formData.answers.some(answer => !answer.text.trim());
      if (invalidAnswers) {
        validationErrors.push('Each acceptable answer must have text');
      }
      
      // Check answer text length for free text answers
      const longAnswers = formData.answers.some(answer => 
        answer.text.length > VALIDATION_CONSTRAINTS.POSSIBLE_ANSWER.TEXT_MAX_LENGTH
      );
      if (longAnswers) {
        validationErrors.push(`Answer text must not exceed ${VALIDATION_CONSTRAINTS.POSSIBLE_ANSWER.TEXT_MAX_LENGTH} characters`);
      }
    }
    
    if (formData.answers.every(a => !a.isCorrect)) {
      validationErrors.push('At least one correct answer is required');
    }
    if (formData.type === QuestionType.SingleChoice) {
      const correctCount = formData.answers.filter(a => a.isCorrect).length;
      if (correctCount !== 1) validationErrors.push('Single choice questions must have exactly one correct answer');
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      let uploadedStaticFileIds: string[] = [];
      if (staticFiles.length > 0 && !editing) {
        // Filter only File objects (not StaticFileDto) for upload
        const filesToUpload = staticFiles.filter((file): file is File => 'lastModified' in file);
        
        // Get IDs of existing StaticFileDto objects
        const existingFileIds = staticFiles
          .filter((file): file is StaticFileDto => !('lastModified' in file))
          .map(file => file.id);
        
        if (filesToUpload.length > 0) {
          const fileToUploadRequests: FileUploadRequest[] = filesToUpload.map((file) => ({
            moduleId: formData.moduleId,
            file,
            isModuleLevelFile: false
          }));
  
          try {
            const uploadResults = await Promise.all(
              fileToUploadRequests.map(request => assessmentService.uploadFile(request))
            );
    
            const newUploadedIds = uploadResults
              .filter(result => result.isSuccess && result.data)
              .map(result => result.data.id);
            
            // Combine existing and new file IDs
            uploadedStaticFileIds = [...existingFileIds, ...newUploadedIds];
          } catch (uploadError: any) {
            setErrors([`Question ${parseFileUploadError(uploadError)}`]);
            return; // Exit early if upload fails
          }
        } else {
          // If we only have existing files
          uploadedStaticFileIds = existingFileIds;
        }
      }

      // Always use the correct staticFileIds for backend
      const finalStaticFileIds = uploadedStaticFileIds.length > 0 ? uploadedStaticFileIds : formData.staticFileIds;

      // Upload answer attachments and replace blob URLs with real IDs
      
      const updatedAnswers = await Promise.all(
        formData.answers.map(async (answer, index) => {
          // Find blob URLs in staticFileIds
          const blobUrls = (answer.staticFileIds || []).filter((url) => url.startsWith('blob:'));
          let uploadedIds: string[] = [];
          
          if (blobUrls.length > 0) {
            // Get files from our blob URL mapping
            const filesToUpload = [];
            
            for (const url of blobUrls) {
              const file = blobUrlsToFiles[url];
              if (file) {
                filesToUpload.push(file);
              }
            }
            
            if (filesToUpload.length > 0) {
              // Upload each file
              for (const file of filesToUpload) {
                try {
                  const uploadResult = await assessmentService.uploadFile({ 
                    moduleId: formData.moduleId, 
                    file 
                  });
                  
                  if (uploadResult.isSuccess && uploadResult.data) {
                    uploadedIds.push(uploadResult.data.id);
                  }
                } catch (uploadError: any) {
                  throw new Error(`Answer attachment ${parseFileUploadError(uploadError, file.name)}`);
                }
              }
            }
          }
          
          // Keep non-blob IDs (these are already valid server IDs)
          const persistedIds = (answer.staticFileIds || []).filter((url) => !url.startsWith('blob:'));
          
          return {
            text: answer.text,
            order: answer.order,
            isCorrect: answer.isCorrect,
            staticFileIds: [...persistedIds, ...uploadedIds]
          };
        })
      );

      const updatedQuestion: QuestionCreateDto = {
        ...formData,
        answers: updatedAnswers,
        staticFileIds: finalStaticFileIds
      };

      onSuccess(updatedQuestion);
    } catch (error: any) {
      // Check if the error is from our file upload handling
      if (error.message && (error.message.includes('upload failed') || error.message.includes('size limit'))) {
        setErrors([error.message]);
      } else {
        setErrors([error.response?.data?.message || error.message || 'Failed to save question']);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // When files change, update staticFiles state and sync staticFileIds
  const handleFileChange = (files: PreviewFile[]) => {
    setStaticFiles(files);
    
    // Extract IDs from remaining StaticFileDto objects only
    const remainingIds = files
      .filter((file): file is StaticFileDto => !('lastModified' in file))
      .map(file => file.id);
    
    // Update formData with only the remaining file IDs
    setFormData(prev => ({
      ...prev,
      staticFileIds: remainingIds
    }));
  };

  const updateAnswer = (index: number, answer: PossibleAnswerCreateDto) => {
    const newAnswers = [...formData.answers];
    newAnswers[index] = answer;
    setFormData({ ...formData, answers: newAnswers });
  };

  const addAnswer = () => {
    const isCorrectByDefault = formData.type === QuestionType.FreeText;
    const nextOrder = formData.answers.length; // Use array length as next order
    setFormData({
      ...formData,
      answers: [...formData.answers, { text: '', isCorrect: isCorrectByDefault, staticFileIds: [], order: nextOrder }]
    });
  };

  const removeAnswer = (index: number) => {
    const minAnswers = formData.type === QuestionType.FreeText ? 1 : 2;
    if (formData.answers.length > minAnswers) {
      const newAnswers = formData.answers
        .filter((_, i) => i !== index)
        .map((answer, i) => ({ ...answer, order: i })); // Reorder remaining answers
      setFormData({ ...formData, answers: newAnswers });
    }
  };
  
  // Helper to trigger file input
  const openFilePicker = (answerIndex: number) => {
    const fileInput = document.getElementById(`answer-attachment-input-${answerIndex}`);
    if (fileInput) {
      fileInput.click();
    }
  };

  // Handle keyboard shortcuts
  const handleKeyUp = (e: React.KeyboardEvent) => {
    // Ctrl+Enter or Cmd+Enter to submit form
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      
      // Prevent rapid submissions
      const now = Date.now();
      if (!isSubmitting && (now - lastSubmissionTime) >= 1000) {
        handleSubmit(e as any, !!question);
      }
    }
    
    // Escape to close form (but only if no preview is open)
    if (e.key === 'Escape') {
      // Don't close form if preview modal is open
      if (showPreview) {
        return; // Let the preview handle the escape key
      }
      e.preventDefault();
      onClose();
    }
    
    // Ctrl+S or Cmd+S to save (same as submit)
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      e.stopPropagation();
      
      // Prevent rapid submissions
      const now = Date.now();
      if (!isSubmitting && (now - lastSubmissionTime) >= 1000) {
        handleSubmit(e as any, !!question);
      }
    }
  };

  // Handle preview of answer attachments
  const handlePreviewAnswerAttachments = (answer: PossibleAnswerCreateDto, answerIndex: number) => {
    if (!answer.staticFileIds || answer.staticFileIds.length === 0) return;
    
    // Convert staticFileIds to StaticFileDto objects for preview
    const files: StaticFileDto[] = answer.staticFileIds.map((fileId, index) => {
      let url = fileId;
      let name = 'File attachment';
      let type = 'application/octet-stream';
      
      if (fileId.startsWith('blob:')) {
        // For blob URLs, get file info from blobUrlsToFiles mapping
        url = fileId;
        const actualFile = blobUrlsToFiles[fileId];
        if (actualFile) {
          name = actualFile.name;
          type = actualFile.type || 'application/octet-stream';
        } else {
          name = `New Attachment ${index + 1}`;
        }
      } else {
        // For existing files, use the actual URL from answerAttachmentUrls
        url = answerAttachmentUrls[fileId] || `/api/files/${fileId}`;
        name = localAnswerAttachmentNames[fileId] || `File (${fileId.substring(0, 8)}...)`;
      }
      
      return {
        id: fileId,
        url: url,
        name: name,
        type: type
      };
    });
    
    setPreviewFiles(files);
    setPreviewTitle(`Answer ${String.fromCharCode(65 + answerIndex)} Attachments`);
    setPreviewAnswerIndex(answerIndex);
    setShowPreview(true);
  };

  // Handle file removal from preview modal
  const handleRemoveFileFromPreview = (files: PreviewFile[]) => {
    if (previewAnswerIndex === -1) return;
    
    // Update the preview files state
    setPreviewFiles(files as StaticFileDto[]);
    
    // Update the answer's staticFileIds by removing the files that are no longer in the preview
    const currentAnswer = formData.answers[previewAnswerIndex];
    const remainingFileIds = files.map(file => {
      if ('lastModified' in file) {
        // For File objects, create blob URL
        return URL.createObjectURL(file);
      } else {
        // For StaticFileDto objects, use the id
        return file.id;
      }
    });
    
    // Update the answer with the remaining file IDs
    updateAnswer(previewAnswerIndex, {
      ...currentAnswer,
      staticFileIds: remainingFileIds
    });
    
    // Also update blobUrlsToFiles mapping if any blob URLs were removed
    const updatedBlobMapping = { ...blobUrlsToFiles };
    Object.keys(blobUrlsToFiles).forEach(blobUrl => {
      if (!remainingFileIds.includes(blobUrl)) {
        delete updatedBlobMapping[blobUrl];
      }
    });
    setBlobUrlsToFiles(updatedBlobMapping);
    
    // If no files left, close the modal
    if (files.length === 0) {
      closePreview();
    }
  };

  return (
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
              {question ? 'Edit Question' : 'Add New Question'}
            </h2>
            <p style={styles.subtitle}>
              {question ? 'Make changes to your question' : 'Create a new question for your assessment module'}
            </p>
          </div>
          <button onClick={onClose} style={styles.closeButton}>
            ✕
          </button>
        </div>
        
        <div style={styles.keyboardHints}>
          <span style={styles.hintText}>
            <img src="/images/icons/light-bulb.svg" alt="" style={{width: '14px', height: '14px', marginRight: '6px', verticalAlign: 'middle'}} /> <strong>Ctrl+Enter</strong>  to save  •  <strong>Ctrl+S</strong>  to save  •  <strong>Esc</strong>  to cancel
          </span>
        </div>
        
        <div style={styles.fileUploadContainer}>
          <h3 style={styles.sectionTitle}>Question Attachments</h3>
          <StaticFileUpload
            files={staticFiles}
            onFilesChange={handleFileChange} />
        </div>
        {errors.length > 0 && (
          <div style={styles.errorContainer}>
            <div style={styles.errorHeader}>
              <span style={styles.errorIcon}>⚠️</span>
              <span style={styles.errorTitle}>Please fix the following errors:</span>
            </div>
            <ul style={styles.errorList}>
              {errors.map((error, idx) => (
                <li key={idx} style={styles.errorItem}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Question Text */}
          <div style={styles.formGroup}>
            <label htmlFor="questionText" style={styles.label}>Question Text</label>
            <textarea
              id="questionText"
              rows={3}
              style={styles.textarea}
              value={formData.text}
              onChange={e => setFormData({ ...formData, text: e.target.value })}
              placeholder="Enter the question text"
              maxLength={VALIDATION_CONSTRAINTS.QUESTION.TEXT_MAX_LENGTH}
            />
            <div style={{
              ...styles.characterCounter,
              color: (formData.text || '').length > VALIDATION_CONSTRAINTS.QUESTION.TEXT_MAX_LENGTH * 0.9 ? '#dc2626' : '#6b7280'
            }}>
              {(formData.text || '').length}/{VALIDATION_CONSTRAINTS.QUESTION.TEXT_MAX_LENGTH}
            </div>
          </div>

          {/* Question Type */}
          <div style={styles.formGroup}>
            <label htmlFor="questionType" style={styles.label}>Question Type</label>
            <select
              id="questionType"
              style={styles.select}
              value={formData.type}
              onChange={e => {
                const newType = parseInt(e.target.value) as QuestionType;
                const currentType = formData.type;
                let newAnswers = formData.answers;
                
                // Adjust answers based on question type
                if (newType === QuestionType.FreeText) {
                  // For free text, ensure we have at least one answer and mark all as correct
                  if (newAnswers.length === 0) {
                    newAnswers = [{ text: '', isCorrect: true, staticFileIds: [], order: 0 }];
                  } else {
                    // Mark all existing answers as correct for free text
                    newAnswers = newAnswers.map(answer => ({ ...answer, isCorrect: true }));
                  }
                } 
                else if (newType === QuestionType.SingleChoice) {
                  // When switching to single choice, ensure only one answer is correct
                  // Ensure we have at least 2 answers for choice questions
                  if (newAnswers.length < 2) {
                    newAnswers = [
                      { text: '', isCorrect: true, staticFileIds: [], order: 0 },
                      { text: '', isCorrect: false, staticFileIds: [], order: 1 }
                    ];
                  } else {
                    // Ensure only one answer is correct
                    let hasCorrectAnswer = false;
                    newAnswers = newAnswers.map((answer, index) => {
                      if (answer.isCorrect && !hasCorrectAnswer) {
                        hasCorrectAnswer = true;
                        return { ...answer, isCorrect: true };
                      } else {
                        return { ...answer, isCorrect: false };
                      }
                    });
                    
                    // If no answer was marked correct, mark the first one as correct
                    if (!hasCorrectAnswer && newAnswers.length > 0) {
                      newAnswers[0] = { ...newAnswers[0], isCorrect: true };
                    }
                  }
                }
                else if (newType === QuestionType.MultipleChoice) {
                  // When switching to multiple choice, ensure we have at least 2 answers
                  if (newAnswers.length < 2) {
                    newAnswers = [
                      { text: '', isCorrect: true, staticFileIds: [], order: 0 },
                      { text: '', isCorrect: false, staticFileIds: [], order: 1 }
                    ];
                  }
                }
                
                setFormData({
                  ...formData,
                  type: newType,
                  answers: newAnswers
                });
              }}
            >
              <option value={QuestionType.SingleChoice}>Single Choice</option>
              <option value={QuestionType.MultipleChoice}>Multiple Choice</option>
              <option value={QuestionType.FreeText}>Free Text</option>
            </select>
          </div>

          {/* Answers Section */}
          {true && (
            <div style={styles.answersSection}>
            <div style={styles.answersHeader}>
              <div>
                <label style={styles.label}>
                  {formData.type === QuestionType.FreeText 
                    ? 'Acceptable Answers' 
                    : 'Possible Answers'
                  }
                </label>
                {formData.type === QuestionType.FreeText && (
                  <p style={styles.answerHelpText}>
                    Add all acceptable variations of the correct answer (e.g., "2", "two", "II"). 
                    All answers will be marked as acceptable automatically.
                  </p>
                )}
              </div>
            </div>              <div style={styles.answersList}>
                {formData.answers.map((answer, index) => (
                  <div key={index} style={styles.answerItem}>
                    <div style={styles.answerHeader}>
                      <span style={styles.answerLabel}>
                        {formData.type === QuestionType.FreeText 
                          ? `Acceptable Answer ${index + 1}` 
                          : `Answer ${index + 1}`
                        }
                      </span>
                      {formData.answers.length > (formData.type === QuestionType.FreeText ? 1 : 2) && (
                        <button
                          type="button"
                          onClick={() => removeAnswer(index)}
                          style={styles.removeAnswerButton}
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div style={styles.answerInputGroup}>
                      <input
                        type="text"
                        style={styles.answerInput}
                        value={answer.text}
                        onChange={e => updateAnswer(index, {
                          ...answer,
                          text: e.target.value
                        })}
                        placeholder={
                          formData.type === QuestionType.FreeText 
                            ? "Enter acceptable answer (e.g., 2, two, II)" 
                            : "Enter answer text (optional if you add attachments)"
                        }
                        maxLength={VALIDATION_CONSTRAINTS.POSSIBLE_ANSWER.TEXT_MAX_LENGTH}
                      />
                      <div style={{
                        ...styles.characterCounter,
                        color: answer.text.length > VALIDATION_CONSTRAINTS.POSSIBLE_ANSWER.TEXT_MAX_LENGTH * 0.9 ? '#dc2626' : '#6b7280'
                      }}>
                        {answer.text.length}/{VALIDATION_CONSTRAINTS.POSSIBLE_ANSWER.TEXT_MAX_LENGTH}
                      </div>

                      {formData.type !== QuestionType.FreeText && (
                        <label style={styles.checkboxLabel}>
                          <input
                            type={formData.type === QuestionType.SingleChoice ? "radio" : "checkbox"}
                            name={formData.type === QuestionType.SingleChoice ? "single-choice" : undefined}
                            style={styles.checkbox}
                            checked={answer.isCorrect}
                            onChange={e => {
                              if (formData.type === QuestionType.SingleChoice) {
                                // For single choice, ensure only this answer is correct
                                const newAnswers = formData.answers.map((a, i) => ({
                                  ...a,
                                  isCorrect: i === index
                                }));
                                setFormData({ ...formData, answers: newAnswers });
                              } else {
                                // For multiple choice, just toggle this answer
                                updateAnswer(index, {
                                  ...answer,
                                  isCorrect: e.target.checked
                                });
                              }
                            }}
                          />
                          <span style={styles.checkboxText}>Correct</span>
                        </label>
                      )}
                    </div>

                    {/* Answer Attachments Section - Only for choice questions */}
                    {formData.type !== QuestionType.FreeText && (
                      <div style={styles.answerAttachmentsSection}>
                        <div style={styles.attachmentControls}>
                          <button
                            type="button"
                            style={styles.attachmentButton}
                            onClick={() => openFilePicker(index)}
                          >
                            Add Attachment
                          </button>
                          {(answer.staticFileIds || []).length > 0 && (
                            <button
                              type="button"
                              style={styles.previewAttachmentsButton}
                              onClick={() => handlePreviewAnswerAttachments(answer, index)}
                            >
                              <img src="/images/icons/attachment.svg" alt="" style={{width: '14px', height: '14px', marginRight: '6px', verticalAlign: 'middle'}} />Preview {answer.staticFileIds.length} attachment{answer.staticFileIds.length > 1 ? 's' : ''}
                            </button>
                          )}
                        </div>

                        {(answer.staticFileIds || []).length > 0 && (
                          <div style={styles.attachmentsList}>
                            {answer.staticFileIds.map((fileId, fileIdx) => {
                              // For existing files (non-blob URLs), try to show a better name
                              let displayName = 'File attachment';
                              if (fileId.startsWith('blob:')) {
                                displayName = 'File attachment';
                              } else {
                                // Check if we have a name for this file ID
                                displayName = localAnswerAttachmentNames[fileId] || `File (${fileId.substring(0, 8)}...)`;
                              }
                              
                              return (
                                <div key={fileIdx} style={styles.attachmentItem}>
                                  {displayName}
                                  <button
                                    type="button"
                                    style={styles.removeAttachmentButton}
                                    onClick={() => {
                                      const newStaticFileIds = (answer.staticFileIds || []).filter((_, i) => i !== fileIdx);
                                      updateAnswer(index, { ...answer, staticFileIds: newStaticFileIds });
                                      
                                      // If it's a blob URL, also remove from blobUrlsToFiles
                                      if (fileId.startsWith('blob:')) {
                                        const newMap = { ...blobUrlsToFiles };
                                        delete newMap[fileId];
                                        setBlobUrlsToFiles(newMap);
                                      }
                                    }}
                                  >
                                    ✕
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        <input
                          type="file"
                          style={{ display: 'none' }}
                          id={`answer-attachment-input-${index}`}
                          multiple
                          accept=".jpg,.jpeg,.png,.mp3,.mp4"
                          onChange={e => {
                            const files = Array.from(e.target.files || []);
                            
                            // Store files by answer index
                            setAnswerFiles(prev => ({
                              ...prev,
                              [index]: [...(prev[index] || []), ...files]
                            }));
                            
                            // Create blob URLs and store the mapping
                            const urlFileMap: Record<string, File> = {};
                            const urls = files.map(file => {
                              const blobUrl = URL.createObjectURL(file);
                              urlFileMap[blobUrl] = file;
                              return blobUrl;
                            });
                            
                            // Update blob URL to file mapping
                            setBlobUrlsToFiles(prev => ({
                              ...prev,
                              ...urlFileMap
                            }));
                            
                            // Update answer with new blob URLs
                            updateAnswer(index, { 
                              ...answer, 
                              staticFileIds: [...(answer.staticFileIds || []), ...urls] 
                            });
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <button
                type="button"
                onClick={addAnswer}
                style={styles.addAnswerButton}
              >
                {formData.type === QuestionType.FreeText ? 'Add Acceptable Answer' : 'Add Answer'}
              </button>
            </div>
          )}

          <div style={styles.footer}>
            <button
              type="button"
              onClick={onClose}
              style={styles.cancelButton}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                ...styles.submitButton,
                ...(isSubmitting ? styles.submitButtonDisabled : {})
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : question ? 'Update Question' : 'Create Question'}
            </button>
          </div>
        </form>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div 
          ref={previewModalRef}
          style={styles.previewModalOverlay} 
          onClick={closePreview}
          onKeyUp={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              e.stopPropagation();
              e.nativeEvent.stopImmediatePropagation();
              closePreview();
            }
          }}
          tabIndex={0}
        >
          <div style={styles.previewModalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.previewModalHeader}>
              <h3 style={styles.previewModalTitle}>{previewTitle}</h3>
              <button 
                style={styles.previewCloseButton}
                onClick={closePreview}
              >
                ×
              </button>
            </div>
            <div style={styles.previewModalBody}>
              <div style={styles.previewNote}>
                <p style={styles.previewNoteText}>
                  🗑️ Click the "×" button on any file to remove it from this answer.
                </p>
              </div>
              <FilePreview 
                files={previewFiles}
                onFilesChange={handleRemoveFileFromPreview}
                readonly={false}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed' as const,
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
    zIndex: 50,
    outline: 'none', // Remove default focus outline since we're handling keyboard events
  },
  fileUploadContainer: {
    padding: '0 24px 16px 24px',
    marginBottom: '8px',
    borderBottom: '1px solid #f3f4f6',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '12px',
    marginTop: 0,
  },

  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    maxWidth: '800px',
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto' as const,
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '24px 24px 0 24px',
    borderBottom: '1px solid #f3f4f6',
    paddingBottom: '24px',
    marginBottom: '24px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#111827',
    margin: '0 0 4px 0',
  },
  subtitle: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
  },
  closeButton: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#6b7280',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '4px',
    transition: 'color 0.2s ease-in-out',
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    padding: '16px',
    margin: '0 24px 24px 24px',
  },
  errorHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  errorIcon: {
    fontSize: '16px',
  },
  errorTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#dc2626',
  },
  errorList: {
    margin: 0,
    paddingLeft: '20px',
  },
  errorItem: {
    color: '#dc2626',
    fontSize: '14px',
    marginBottom: '4px',
  },
  form: {
    padding: '0 24px 24px 24px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
  },
  textarea: {
    width: '100%',
    padding: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    resize: 'vertical' as const,
    fontFamily: 'inherit',
    transition: 'border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  },
  select: {
    width: '100%',
    padding: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    backgroundColor: '#ffffff',
    cursor: 'pointer',
    transition: 'border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  },
  answersSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  answersHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addAnswerButton: {
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease-in-out',
  },
  answersList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  answerItem: {
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '16px',
    backgroundColor: '#f9fafb',
  },
  answerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  answerLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
  },
  removeAnswerButton: {
    backgroundColor: 'transparent',
    color: '#dc2626',
    border: 'none',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '4px',
  },
  answerInputGroup: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  answerInput: {
    flex: 1,
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: '#ffffff',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#374151',
    fontWeight: '500',
  },
  checkbox: {
    width: '16px',
    height: '16px',
    cursor: 'pointer',
  },
  checkboxText: {
    userSelect: 'none' as const,
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    paddingTop: '24px',
    borderTop: '1px solid #f3f4f6',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    color: '#6b7280',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
    cursor: 'not-allowed',
  },
  attachmentButton: {
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
  },
  attachmentsList: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '8px',
    marginTop: '8px',
  },
  attachmentItem: {
    backgroundColor: '#f3f4f6',
    color: '#374151',
    fontSize: '12px',
    padding: '4px 8px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  removeAttachmentButton: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#9ca3af',
    fontSize: '14px',
    cursor: 'pointer',
    padding: '0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewAttachmentsButton: {
    background: 'none',
    border: '1px solid #3b82f6',
    color: '#3b82f6',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500',
    padding: '6px 12px',
    borderRadius: '6px',
    transition: 'all 0.2s ease-in-out',
  },
  previewModalOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000, // Higher than the form modal
  },
  previewModalContent: {
    backgroundColor: 'white',
    borderRadius: '8px',
    maxWidth: '90vw',
    maxHeight: '90vh',
    width: '800px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  },
  previewModalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '24px 24px 0 24px',
    borderBottom: '1px solid #e5e7eb',
  },
  previewModalTitle: {
    fontSize: '18px',
    fontWeight: '600',
    margin: 0,
    color: '#111827',
  },
  previewCloseButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#666',
    padding: '0',
    width: '30px',
    height: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewModalBody: {
    padding: '20px 24px 24px 24px',
  },
  answerAttachmentsSection: {
    marginTop: '12px',
    padding: '12px 0',
    borderTop: '1px solid #f3f4f6',
  },
  attachmentControls: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    marginBottom: '8px',
  },
  previewNote: {
    marginBottom: '16px',
    padding: '12px',
    backgroundColor: '#fef3c7',
    border: '1px solid #fbbf24',
    borderRadius: '6px',
  },
  previewNoteText: {
    margin: 0,
    fontSize: '14px',
    color: '#92400e',
    fontWeight: '500',
  },
  keyboardHints: {
    padding: '8px 24px',
    backgroundColor: 'transparent',
    textAlign: 'center' as const,
  },
  hintText: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  answerHelpText: {
    fontSize: '12px',
    color: '#6b7280',
    fontStyle: 'italic',
    margin: '4px 0 0 0',
    lineHeight: '1.4',
  },
  characterCounter: {
    fontSize: '12px',
    textAlign: 'right' as const,
    marginTop: '4px',
    fontFamily: 'monospace',
  },
};

// Declare window.__blobFiles for TypeScript to resolve lint error.
declare global {
  interface Window {
    __blobFiles?: { [url: string]: File };
  }
}