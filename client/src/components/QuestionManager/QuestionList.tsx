import { useState, useEffect } from "react";
import { QuestionDto, AssessmentModuleVersionDto } from "../../models/assessment-module";
import { assessmentService } from "../../services/assessmentService";
import { questionService } from "../../services/questionService";
import { QuestionCard } from "./QuestionCard";
import { QuestionForm } from "./QuestionForm";
import { answerCreateDtoToReturnDto, QuestionCreateDto, questionCreateDtoToUpdateDto, questionDtoToCreateDto, QuestionUpdateDto } from "../../models/assessment-modules-create";
import { StaticFileDto } from "../../models/static-file";

type PreviewFile = File | StaticFileDto;

interface Props {
  moduleId: string;
  moduleVersionId: string;
  moduleVersionIsPublished: boolean;
  onQuestionsChange?: (questions: QuestionDto[]) => void;
  onVersionDataLoaded?: (versionData: AssessmentModuleVersionDto) => void;
}

export const QuestionList = ({ moduleId, moduleVersionId, moduleVersionIsPublished, onQuestionsChange, onVersionDataLoaded }: Props) => {
  const [questions, setQuestions] = useState<QuestionDto[]>([]);
  const [staticFiles, setStaticFiles] = useState<PreviewFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionCreateDto | null>(null);
  const [answerAttachmentNames, setAnswerAttachmentNames] = useState<Record<string, string>>({});
  const [answerAttachmentUrls, setAnswerAttachmentUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    loadQuestions();
  }, [moduleVersionId]);

  const loadQuestions = async () => {
    setIsLoading(true);
    try {
      const response = await assessmentService.fetchModuleLatestVersion(moduleVersionId);
      if (!response.isFailed) {
        // Pass the complete version data back to parent
        onVersionDataLoaded?.(response.data);
        
        // Make sure we have the latest data with updated file references
        const questions = response.data.questions || [];
        setQuestions(questions);
        onQuestionsChange?.(questions);
      }
    } catch (err) {
      setError('Failed to load questions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuestionAdded = async (newQuestion: QuestionCreateDto) => {
    
    // Calculate the next order using the current array length
    // This ensures sequential ordering: 0, 1, 2, 3, etc.
    const nextOrder = questions.length;
    
    // Update the question with the correct order
    const questionWithCorrectOrder = {
      ...newQuestion,
      order: nextOrder
    };
    
    const response = await questionService.createQuestion(questionWithCorrectOrder);

    if (response.isFailed) {
      setError('Failed to create question. Error: ' + response.errors.join(', '));
      return;
    }

    // Clear static files
    setStaticFiles([]);
    
    // Update the local state with the new question instead of reloading all questions
    setQuestions(prev => {
      const newQuestions = [...prev, response.data];
      onQuestionsChange?.(newQuestions);
      return newQuestions;
    });
    
    setShowAddForm(false);
  };

  const handleQuestionUpdated = async (updatedQuestion: QuestionCreateDto) => {
    const questionToUpdate: QuestionUpdateDto = questionCreateDtoToUpdateDto(updatedQuestion);
    try {
      const response = await questionService.updateQuestion(questionToUpdate);
      if (response.isFailed) {
        setError('Failed to update question. Error: ' + response.errors.join(', '));
        return;
      }

      // Clear the static files state
      setStaticFiles([]);
      
      // Update our local state without refetching everything
      setQuestions(prev => {
        const updatedQuestions = prev.map((q: QuestionDto) =>
          q.id === updatedQuestion.internalId
            ? {
              ...q,
              text: updatedQuestion.text,
              type: updatedQuestion.type,
              answers: response.data.answers || updatedQuestion.answers.map(answerCreateDtoToReturnDto),
              staticFileIds: updatedQuestion.staticFileIds,
              staticFileUrls: response.data.staticFileUrls || [] 
            }
            : q
        );
        onQuestionsChange?.(updatedQuestions);
        return updatedQuestions;
      });

      setEditingQuestion(null);
    } catch (error) {
      setError(`Failed to update question: ${error}`);
    }
  };

  const handleQuestionDeleted = async (questionId: string) => {
    const response = await questionService.deleteQuestion(questionId);

    if (response.isFailed) {
      setError('Failed to delete question. Error: ' + response.errors.join(', '));
      return;
    }

    setQuestions(prev => {
      const filteredQuestions = prev.filter(q => q.id !== questionId);
      onQuestionsChange?.(filteredQuestions);
      return filteredQuestions;
    });
  };

  const handleQuestionEdit = async (question: QuestionDto) => {
    // Preload files for editing - question-level attachments
    const urls = question.staticFileUrls || [];
    
    // Create array of StaticFileDto objects from URLs
    const staticFileDtos = urls.map((url, index) => {
      const fileId = question.staticFileIds?.[index] || `temp-${index}`;
      const fileName = url.split('/').pop() || `File-${index}`;
      const fileType = getFileTypeFromExtension(fileName);
      
      return {
        id: fileId,
        url: url,
        name: fileName,
        type: fileType
      };
    });
    
    // Create mapping of answer attachment file IDs to names and URLs for better display
    const answerAttachmentNames: Record<string, string> = {};
    const answerAttachmentUrls: Record<string, string> = {};
    question.answers.forEach((answer) => {
      if (answer.staticFileIds && answer.staticFileUrls) {
        answer.staticFileIds.forEach((id, index) => {
          if (answer.staticFileUrls && answer.staticFileUrls[index]) {
            const url = Array.from(answer.staticFileUrls)[index];
            const fileName = url.split('/').pop() || `Attachment-${index + 1}`;
            answerAttachmentNames[id] = fileName;
            answerAttachmentUrls[id] = url;
          }
        });
      }
    });
    
    setStaticFiles(staticFileDtos);
    setEditingQuestion(questionDtoToCreateDto(question));
    setAnswerAttachmentNames(answerAttachmentNames);
    setAnswerAttachmentUrls(answerAttachmentUrls);
  };
  
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

  // This helper is no longer needed as we're using StaticFileDto objects directly
  // Keeping it commented in case we need to fetch actual File objects in the future
  /*
  const fetchFilesFromUrls = async (urls: string[]): Promise<File[]> => {
    const files: File[] = [];
    for (const url of urls) {
      const response = await axios.get(url, { responseType: 'blob' });
      const blob = await response.data;
      const filename = url.split('/').pop() || 'attachment';
      files.push(new File([blob], filename, { type: blob.type }));
    }
    return files;
  }
  */

  if (isLoading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingText}>Loading questions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorText}>{error}</div>
        <button
          onClick={() => setError(null)}
          style={styles.dismissButton}
        >
          Dismiss
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Questions ({questions.length})</h2>
      </div>

      {questions.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyText}>No questions added yet</p>
          {!moduleVersionIsPublished ? (
            <button
              onClick={() => setShowAddForm(true)}
              style={styles.createFirstButton}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#2980b9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#3498db';
              }}
            >
              Create First Question
            </button>
          ) : (
            <div style={styles.publishedEmptyHint}>
              <span style={styles.emptyHintText}>
                📋 This is a published module. Create a new version to add questions.
              </span>
            </div>
          )}
        </div>
      ) : (
        <div style={styles.questionsGrid}>
          {questions.map((question, index) => (
            <QuestionCard
              key={question.id}
              readonly={moduleVersionIsPublished}
              question={question}
              index={index + 1}
              onEdit={() => handleQuestionEdit(question)}
              onDelete={() => handleQuestionDeleted(question.id)}
            />
          ))}
        </div>
      )}

      {/* Add Question Button at Bottom */}
      {!moduleVersionIsPublished && questions.length > 0 && (
        <div style={styles.bottomButtonContainer}>
          <button
            onClick={() => setShowAddForm(true)}
            style={styles.bottomAddButton}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2980b9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#3498db';
            }}
          >
            + Add Question
          </button>
        </div>
      )}

      {showAddForm && (
        <QuestionForm
          moduleId={moduleId}
          staticFiles={staticFiles}
          setStaticFiles={setStaticFiles}
          moduleVersionId={moduleVersionId}
          onClose={() => {
            setShowAddForm(false);
            setStaticFiles([]); // Clear static files when closing the form
          }}
          onSuccess={handleQuestionAdded}
        />
      )}

      {editingQuestion && (
        <QuestionForm
          moduleId={moduleId}
          staticFiles={staticFiles}
          setStaticFiles={setStaticFiles}
          moduleVersionId={moduleVersionId}
          question={editingQuestion}
          answerAttachmentNames={answerAttachmentNames}
          answerAttachmentUrls={answerAttachmentUrls}
          onClose={() => {
            setEditingQuestion(null);
            setStaticFiles([]); // Clear static files when closing the form
            setAnswerAttachmentNames({}); // Clear answer attachment names
            setAnswerAttachmentUrls({}); // Clear answer attachment URLs
          }}
          onSuccess={handleQuestionUpdated}
        />
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '20px',
  },
  dismissButton: {
    marginTop: '10px',
    padding: '8px 16px',
    backgroundColor: '#e74c3c',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    paddingBottom: '16px',
    borderBottom: '2px solid #e1e8ed',
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#2c3e50',
    margin: 0,
  },
  addButton: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '600',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#3498db',
    color: '#fff',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '12px',
    border: '1px solid #e1e8ed',
  },
  emptyText: {
    fontSize: '16px',
    color: '#6c757d',
    marginBottom: '20px',
    margin: '0 0 20px 0',
  },
  createFirstButton: {
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '600',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#3498db',
    color: '#fff',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  },
  questionsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '60px 20px',
  },
  loadingText: {
    fontSize: '16px',
    color: '#6c757d',
  },
  errorContainer: {
    padding: '20px',
    backgroundColor: '#f8d7da',
    color: '#721c24',
    border: '1px solid #f5c6cb',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  errorText: {
    fontSize: '14px',
    margin: 0,
  },
  publishedHint: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#fff3cd',
    border: '1px solid #ffeaa7',
    borderRadius: '6px',
    padding: '8px 12px',
  },
  hintText: {
    fontSize: '13px',
    color: '#856404',
    fontWeight: '500',
    margin: 0,
  },
  publishedEmptyHint: {
    backgroundColor: '#e2e3e5',
    border: '1px solid #d6d8db',
    borderRadius: '6px',
    padding: '12px 16px',
  },
  emptyHintText: {
    fontSize: '14px',
    color: '#6c757d',
    fontWeight: '500',
    margin: 0,
  },
  bottomButtonContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: '24px',
    paddingTop: '24px',
    borderTop: '1px solid #e1e8ed',
  },
  bottomAddButton: {
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '600',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#3498db',
    color: '#fff',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
};
