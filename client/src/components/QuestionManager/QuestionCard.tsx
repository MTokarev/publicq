import { useState } from 'react';
import { QuestionDto } from '../../models/assessment-module';
import { QuestionType } from '../../models/question-types';
import { StaticFileDto } from '../../models/static-file';
import { FilePreview } from '../Shared/FilePreview';

interface Props {
  question: QuestionDto;
  index: number;
  readonly: boolean
  onEdit: () => void;
  onDelete: () => void;
}

export const QuestionCard = ({ question, index, readonly, onEdit, onDelete }: Props) => {
  const [showPreview, setShowPreview] = useState(false);
  const [previewFiles, setPreviewFiles] = useState<StaticFileDto[]>([]);
  const [previewTitle, setPreviewTitle] = useState('');

  const getTypeLabel = (type: QuestionType) => {
    // Parse question type to ensure consistent comparison
    let questionType = type;
    if (typeof type === 'string') {
      questionType = QuestionType[type as keyof typeof QuestionType] ?? QuestionType.SingleChoice;
    }
    
    switch (questionType) {
      case QuestionType.SingleChoice:
        return 'Single Choice';
      case QuestionType.MultipleChoice:
        return 'Multiple Choice';
      case QuestionType.FreeText:
        return 'Free Text';
      default:
        return 'Unknown';
    }
  };

  const handlePreviewQuestionAttachments = () => {
    if (!question.staticFileUrls || question.staticFileUrls.length === 0) return;

    const files: StaticFileDto[] = question.staticFileUrls.map((url, index) => ({
      id: question.staticFileIds?.[index] || `temp-q-${index}`,
      url: url,
      name: url.split('/').pop() || `Question-Attachment-${index + 1}`,
      type: 'application/octet-stream'
    }));

    setPreviewFiles(files);
    setPreviewTitle('Question Attachments');
    setShowPreview(true);
  };

  const handlePreviewAnswerAttachments = (answer: any, answerIndex: number) => {
    if (!answer.staticFileUrls || answer.staticFileUrls.length === 0) return;

    const files: StaticFileDto[] = answer.staticFileUrls.map((url: string, index: number) => ({
      id: answer.staticFileIds?.[index] || `temp-a-${answerIndex}-${index}`,
      url: url,
      name: url.split('/').pop() || `Answer-Attachment-${index + 1}`,
      type: 'application/octet-stream'
    }));

    setPreviewFiles(files);
    setPreviewTitle(`Answer ${String.fromCharCode(65 + answerIndex)} Attachments`);
    setShowPreview(true);
  };

  const correctAnswers = question.answers.filter(a => a.isCorrect);

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <div style={styles.questionInfo}>
          <div style={styles.badges}>
            <span style={styles.questionNumber}>
              Q{index}
            </span>
            <span style={styles.typeBadge}>
              {getTypeLabel(question.type)}
            </span>
          </div>
          <h3 style={styles.questionText}>{question.text}</h3>

          {/* Use question.staticFileUrls to check for attachments */}
          {question.staticFileUrls && question.staticFileUrls.length > 0 && (
            <div style={styles.attachments}>
              <button
                style={styles.attachmentButton}
                onClick={handlePreviewQuestionAttachments}
              >
                <img src="/images/icons/attachment.svg" alt="" style={{width: '14px', height: '14px', marginRight: '6px', verticalAlign: 'middle'}} />{question.staticFileUrls.length} attachment{question.staticFileUrls.length > 1 ? 's' : ''}
              </button>
            </div>
          )}
        </div>

        {!readonly && (
          <div style={styles.actions}>
            <button onClick={onEdit} style={styles.editButton}>
              Edit
            </button>
            <button onClick={onDelete} style={styles.deleteButton}>
              Delete
            </button>
          </div>
        )}
      </div>

      <div style={styles.answersSection}>
        <div style={styles.answersHeader}>
          <span style={styles.answersCount}>
            {question.answers.length} answer{question.answers.length > 1 ? 's' : ''} • {correctAnswers.length} correct
          </span>
        </div>
        <div style={styles.answersList}>
          {question.answers.map((answer, idx) => (
            <div
              key={answer.id}
              style={{
                ...styles.answerItem,
                ...(answer.isCorrect ? styles.correctAnswer : styles.incorrectAnswer)
              }}
            >
              <div style={styles.answerContent}>
                <span style={styles.answerLetter}>
                  {String.fromCharCode(65 + idx)}.
                </span>
                <span style={styles.answerText}>{answer.text}</span>
                {answer.isCorrect && (
                  <span style={styles.correctBadge}>✓ Correct</span>
                )}
              </div>
              {/* Show answer attachments */}
              {answer.staticFileUrls && answer.staticFileUrls.length > 0 && (
                <div style={styles.answerAttachments}>
                  <button
                    style={styles.attachmentButton}
                    onClick={() => handlePreviewAnswerAttachments(answer, idx)}
                  >
                    <img src="/images/icons/attachment.svg" alt="" style={{width: '14px', height: '14px', marginRight: '6px', verticalAlign: 'middle'}} />{answer.staticFileUrls.length} attachment{answer.staticFileUrls.length > 1 ? 's' : ''}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div style={styles.modalOverlay} onClick={() => setShowPreview(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>{previewTitle}</h3>
              <button
                style={styles.closeButton}
                onClick={() => setShowPreview(false)}
              >
                ×
              </button>
            </div>
            <div style={styles.modalBody}>
              <FilePreview
                files={previewFiles}
                readonly={true}
              />
              {readonly && (
                <div style={styles.editNote}>
                  <p style={styles.editNoteText}>
                    <img src="/images/icons/light-bulb.svg" alt="" style={{width: '14px', height: '14px', marginRight: '6px', verticalAlign: 'middle'}} />To remove attachments, use the "Edit" button and manage them in the edit form.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  card: {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '24px',
    marginBottom: '16px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    transition: 'box-shadow 0.2s ease-in-out',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '20px',
  },
  questionInfo: {
    flex: 1,
  },
  badges: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px',
    flexWrap: 'nowrap' as const,
  },
  questionNumber: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    fontSize: '12px',
    fontWeight: '600',
    padding: '4px 10px',
    borderRadius: '12px',
    letterSpacing: '0.05em',
  },
  typeBadge: {
    backgroundColor: '#f3f4f6',
    color: '#374151',
    fontSize: '12px',
    fontWeight: '500',
    padding: '4px 10px',
    borderRadius: '12px',
  },
  questionText: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#111827',
    margin: '0 0 12px 0',
    lineHeight: '1.5',
    whiteSpace: 'pre-wrap',
  },
  attachments: {
    marginBottom: '8px',
  },
  attachmentText: {
    fontSize: '14px',
    color: '#6b7280',
    fontStyle: 'italic',
  },
  actions: {
    display: 'flex',
    gap: '8px',
    marginLeft: '16px',
    flexShrink: 0,
  },
  editButton: {
    color: '#2563eb',
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    padding: '6px 12px',
    borderRadius: '4px',
    transition: 'all 0.2s ease-in-out',
  },
  deleteButton: {
    color: '#dc2626',
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    padding: '6px 12px',
    borderRadius: '4px',
    transition: 'all 0.2s ease-in-out',
  },
  answersSection: {
    borderTop: '1px solid #f3f4f6',
    paddingTop: '16px',
  },
  answersHeader: {
    marginBottom: '12px',
  },
  answersCount: {
    fontSize: '14px',
    color: '#6b7280',
    fontWeight: '500',
  },
  answersList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  answerItem: {
    padding: '12px 16px',
    borderRadius: '6px',
    border: '1px solid',
    fontSize: '14px',
  },
  correctAnswer: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
    color: '#166534',
  },
  incorrectAnswer: {
    backgroundColor: '#f9fafb',
    borderColor: '#e5e7eb',
    color: '#374151',
  },
  answerContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  answerLetter: {
    fontWeight: '600',
    minWidth: '20px',
  },
  answerText: {
    flex: 1,
  },
  correctBadge: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#059669',
    marginLeft: 'auto',
  },
  answerAttachments: {
    marginTop: '8px',
    paddingLeft: '28px', // Align with answer text
  },
  answerAttachmentText: {
    fontSize: '12px',
    color: '#6b7280',
    fontStyle: 'italic',
  },
  attachmentButton: {
    background: 'none',
    border: 'none',
    color: '#3b82f6',
    cursor: 'pointer',
    fontSize: '12px',
    fontStyle: 'italic',
    padding: '2px 4px',
    borderRadius: '4px',
    transition: 'color 0.2s ease-in-out',
    ':hover': {
      color: '#1d4ed8',
    },
  },
  modalOverlay: {
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
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '8px',
    maxWidth: '90vw',
    maxHeight: '90vh',
    width: '800px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '24px 24px 0 24px',
    borderBottom: '1px solid #e5e7eb',
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: '600',
    margin: 0,
    color: '#111827',
  },
  closeButton: {
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
  modalBody: {
    padding: '20px 24px 24px 24px',
  },
  editNote: {
    marginTop: '16px',
    padding: '12px',
    backgroundColor: '#f0f9ff',
    border: '1px solid #bae6fd',
    borderRadius: '6px',
  },
  editNoteText: {
    display: 'flex',
    alignItems: 'center',
    margin: 0,
    fontSize: '14px',
    color: '#0369a1',
    fontStyle: 'italic',
  },
};