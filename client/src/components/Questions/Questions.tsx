import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Assignment } from '../../models/assignment';
import { GroupMemberStateWithUserProgress } from '../../models/group-member-state-with-user-progress';
import { User } from '../../models/user';
import { ExamTakerState } from '../../models/exam-taker-state';
import { ModuleProgress } from '../../models/module-progress';
import { ExamTakerModuleVersion } from '../../models/exam-taker-module-version';
import { ExamTakerPossibleAnswer } from '../../models/exam-taker-possible-answer';
import { sessionService } from '../../services/sessionService';
import { FilePreview } from '../Shared/FilePreview';
import { StaticFileDto } from '../../models/static-file';
import { QuestionResponseOperation } from '../../models/question-response-operation';
import { QuestionType } from '../../models/question-types';
import { calculateModuleTimeRemaining, formatDateToLocal } from '../../utils/dateUtils';
import { cn } from '../../utils/cn';
import cssStyles from './Questions.module.css';

interface QuestionsProps {
  // Demo mode props (optional)
  demoMode?: boolean;
  demoModuleVersion?: ExamTakerModuleVersion;
  onDemoComplete?: (answers: Record<string, string[]>) => void;
  onDemoExit?: () => void;
}

interface LocationState {
  moduleProgress: ModuleProgress | null;
  assignment: Assignment;
  groupMember: GroupMemberStateWithUserProgress;
  user: User | ExamTakerState;
}

const Questions: React.FC<QuestionsProps> = ({ 
  demoMode = false, 
  demoModuleVersion, 
  onDemoComplete,
  onDemoExit 
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState;

  const [moduleVersion, setModuleVersion] = useState<ExamTakerModuleVersion | null>(null);
  const [moduleProgress, setModuleProgress] = useState<ModuleProgress | null>(state?.moduleProgress || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [goToInput, setGoToInput] = useState('');
  const [showShakeAnimation, setShowShakeAnimation] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [showGoToModal, setShowGoToModal] = useState(false);
  const [initialAnswers, setInitialAnswers] = useState<Record<string, string[]>>({});
  const [pendingAnswers, setPendingAnswers] = useState<Record<string, string[]>>({});
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<any>(null);
  const [showTimeExpiredModal, setShowTimeExpiredModal] = useState(false);
  const [isTimeBoxHidden, setIsTimeBoxHidden] = useState(false);
  const [showColon, setShowColon] = useState(true);
  const [freeTextAnswers, setFreeTextAnswers] = useState<Record<string, string>>({});
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [timerStartTime, setTimerStartTime] = useState<Date | null>(null);
  const [initialTimeRemaining, setInitialTimeRemaining] = useState<number | null>(null);

  // Handle window resize for responsive grid
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Helper function to convert string question type to enum
  const parseQuestionType = (typeString: string | number): QuestionType => {
    if (typeof typeString === 'number') {
      return typeString as QuestionType;
    }
    
    switch (typeString) {
      case 'SingleChoice':
        return QuestionType.SingleChoice;
      case 'MultipleChoice':
        return QuestionType.MultipleChoice;
      case 'FreeText':
        return QuestionType.FreeText;
      default:
        return QuestionType.SingleChoice; // Default fallback
    }
  };

  const formatQuestionType = (type: string | number): string => {
    const questionType = parseQuestionType(type);
    switch (questionType) {
      case QuestionType.SingleChoice:
        return 'Single Choice';
      case QuestionType.MultipleChoice:
        return 'Multiple Choice';
      case QuestionType.FreeText:
        return 'Free Text';
      default:
        return 'Single Choice';
    }
  };

  useEffect(() => {
    // In demo mode, skip state validation and use demo data
    if (demoMode) {
      if (demoModuleVersion) {
        setModuleVersion(demoModuleVersion);
        setLoading(false);
      }
      return;
    }

    if (!state || !state.assignment || !state.groupMember || !state.user) {
      navigate('/');
      return;
    }

    loadModuleData();
  }, [demoMode, demoModuleVersion]);

  // Add keyboard event handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if not typing in an input field
      if (e.target instanceof HTMLInputElement) return;
      
      // Don't allow any navigation if time expired modal is showing
      if (showTimeExpiredModal) return;
      
      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          setShowErrorPopup(false);
          break;
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.go-to-container')) {
        setShowErrorPopup(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('click', handleClickOutside);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [currentQuestionIndex, moduleVersion, showTimeExpiredModal]);

  // Handle ESC key to close Go to Q# modal
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showGoToModal) {
        setShowGoToModal(false);
      }
    };

    window.addEventListener('keydown', handleEscKey);
    return () => window.removeEventListener('keydown', handleEscKey);
  }, [showGoToModal]);

  // State to store demo start time (so it doesn't reset on re-renders)
  const [demoStartTime] = useState<string>(() => new Date().toISOString());

  // Initialize timer from server's timeRemaining
  useEffect(() => {
    if (demoMode || !moduleVersion?.timeRemaining) return;
    
    // Parse server's timeRemaining (format: "HH:MM:SS")
    const parts = moduleVersion.timeRemaining.split(':');
    const hours = parseInt(parts[0] || '0', 10);
    const minutes = parseInt(parts[1] || '0', 10);
    const seconds = parseInt(parts[2] || '0', 10);
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    
    // Initialize timer with server time and current timestamp
    setInitialTimeRemaining(totalSeconds);
    setTimerStartTime(new Date());
  }, [demoMode, moduleVersion?.timeRemaining]);

  // Timer logic - update every second when module is active and has a time limit
  useEffect(() => {
    // Check if we have the necessary data for timer
    if (!moduleVersion?.durationInMinutes) {
      return;
    }

    const updateTimer = () => {
      let timeInfo;
      
      if (demoMode) {
        // For demo mode, calculate client-side
        timeInfo = calculateModuleTimeRemaining(
          demoStartTime,
          moduleVersion.durationInMinutes
        );
      } else if (timerStartTime && initialTimeRemaining !== null) {
        // Calculate remaining time based on initial server time and elapsed client time
        // This prevents clock manipulation while providing smooth countdown
        const now = new Date();
        const elapsedSeconds = Math.floor((now.getTime() - timerStartTime.getTime()) / 1000);
        const remainingSeconds = Math.max(0, initialTimeRemaining - elapsedSeconds);
        
        const hours = Math.floor(remainingSeconds / 3600);
        const minutes = Math.floor((remainingSeconds % 3600) / 60);
        const seconds = remainingSeconds % 60;
        const expired = remainingSeconds <= 0;
        const totalMinutes = expired ? 0 : Math.ceil(remainingSeconds / 60);
        const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        
        timeInfo = {
          hasTimeRemaining: !expired,
          isExpired: expired,
          totalMinutes,
          hours,
          minutes,
          formattedTime,
          formattedDisplay: expired 
            ? 'Time Expired'
            : (hours > 0 ? `${hours}h ${minutes}m remaining` : `${minutes}m remaining`)
        };
      } else {
        return;
      }
      
      setTimeRemaining(timeInfo);
      
      // Toggle colon visibility for blinking effect
      setShowColon(prev => !prev);
      
      // Check if time just expired
      if (timeInfo.isExpired && !showTimeExpiredModal) {
        setShowTimeExpiredModal(true);
      }
    };

    // Update immediately
    updateTimer();

    // Update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [demoMode, demoStartTime, timerStartTime, initialTimeRemaining, showTimeExpiredModal, moduleVersion?.durationInMinutes]);

  const loadModuleData = async () => {
    if (!state || !state.assignment || !state.groupMember || !state.user) {
      setError('Missing required data to load module');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // If we don't have module progress yet, we need to get it to get the correct version ID
      let currentModuleProgress = moduleProgress;
      
      if (!currentModuleProgress) {
        // Get module progress to get the correct version ID
        const progressResponse = await sessionService.getModuleProgress(
          state.user.id,
          state.assignment.id,
          state.groupMember.assessmentModuleId
        );

        if (progressResponse.isSuccess && progressResponse.data) {
          currentModuleProgress = progressResponse.data;
          setModuleProgress(currentModuleProgress);
        } else {
          setError('Failed to create module progress: ' + (progressResponse.message || 'Unknown error'));
          return;
        }
      }

      // Now get the module version for the exam taker using the version ID from progress
      const versionId = currentModuleProgress.assessmentModuleVersionId;
      
      const moduleVersionResponse = await sessionService.getModuleVersionForExamTaker(
        state.user.id,
        state.assignment.id,
        versionId
      );

      if (moduleVersionResponse.isSuccess && moduleVersionResponse.data) {
        setModuleVersion(moduleVersionResponse.data);
      } else {
        setError('Failed to load module data: ' + (moduleVersionResponse.message || 'Unknown error'));
      }
    } catch (err: any) {
      setError('Failed to load questions: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleBack = async () => {
    // In demo mode, call the exit callback
    if (demoMode && onDemoExit) {
      onDemoExit();
      return;
    }

    // Submit pending answer for current question before leaving
    const currentQuestion = moduleVersion?.questions[currentQuestionIndex];
    if (currentQuestion) {
      await submitPendingAnswerForQuestion(currentQuestion.id);
    }
    navigate(-1);
  };

  const getCurrentQuestion = () => {
    if (!moduleVersion?.questions || currentQuestionIndex >= moduleVersion.questions.length) {
      return null;
    }
    return moduleVersion.questions[currentQuestionIndex];
  };

  const handleNextQuestion = async () => {
    // Don't allow navigation if time has expired
    if (timeRemaining?.isExpired) return;
    
    if (moduleVersion?.questions && currentQuestionIndex < moduleVersion.questions.length - 1) {
      // Submit pending answer for current question before navigating
      const currentQuestion = moduleVersion.questions[currentQuestionIndex];
      if (currentQuestion) {
        await submitPendingAnswerForQuestion(currentQuestion.id);
      }
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = async () => {
    // Don't allow navigation if time has expired
    if (timeRemaining?.isExpired) return;
    
    if (currentQuestionIndex > 0) {
      // Submit pending answer for current question before navigating
      const currentQuestion = moduleVersion?.questions[currentQuestionIndex];
      if (currentQuestion) {
        await submitPendingAnswerForQuestion(currentQuestion.id);
      }
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleGoToQuestion = async (questionNumber: number) => {
    // Don't allow navigation if time has expired
    if (timeRemaining?.isExpired) return;
    
    if (moduleVersion?.questions && questionNumber >= 1 && questionNumber <= moduleVersion.questions.length) {
      // Submit pending answer for current question before navigating
      const currentQuestion = moduleVersion.questions[currentQuestionIndex];
      if (currentQuestion) {
        await submitPendingAnswerForQuestion(currentQuestion.id);
      }
      setCurrentQuestionIndex(questionNumber - 1);
      setGoToInput('');
      setShowErrorPopup(false);
      setShowGoToModal(false); // Close modal after navigation
    } else {
      triggerShakeAndError();
    }
  };

  const triggerShakeAndError = () => {
    // Trigger shake animation and show error popup
    setShowShakeAnimation(true);
    setShowErrorPopup(true);
    
    // Create a more pronounced shake effect
    const element = document.querySelector('.go-to-container') as HTMLElement;
    if (element) {
      element.style.animation = 'none';
      void element.offsetHeight; // Trigger reflow
      element.style.animation = 'shake 0.5s ease-in-out';
    }
    
    // Reset shake animation after it completes
    setTimeout(() => {
      setShowShakeAnimation(false);
      if (element) {
        element.style.animation = '';
      }
    }, 500);
    
    // Hide error popup after 3 seconds
    setTimeout(() => {
      setShowErrorPopup(false);
    }, 3000);
  };

  const handleGoToInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numeric input
    if (value === '' || /^\d+$/.test(value)) {
      setGoToInput(value);
      
      // Check if the entered number is invalid and trigger shake
      if (value !== '' && moduleVersion?.questions) {
        const questionNumber = parseInt(value);
        if (!isNaN(questionNumber) && (questionNumber < 1 || questionNumber > moduleVersion.questions.length)) {
          triggerShakeAndError();
        } else {
          // Hide error popup if valid number is entered
          setShowErrorPopup(false);
        }
      }
    }
  };

  const handleGoToKeyPress = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const questionNumber = parseInt(goToInput);
      if (!isNaN(questionNumber)) {
        await handleGoToQuestion(questionNumber);
      }
    }
  };

  const handleGoToSubmit = async () => {
    const questionNumber = parseInt(goToInput);
    if (!isNaN(questionNumber)) {
      await handleGoToQuestion(questionNumber);
    }
  };

  // Helper function to convert staticFileUrls to StaticFileDto format for FilePreview
  const convertUrlsToStaticFiles = (urls: string[] | undefined): StaticFileDto[] => {
    if (!urls || urls.length === 0) return [];
    
    return urls.map((url, index) => {
      const fileName = url.split('/').pop() || `file-${index + 1}`;
      const extension = fileName.split('.').pop() || '';
      
      return {
        id: `static-${index}`,
        name: fileName,
        url: url,
        type: getFileTypeFromExtension(extension)
      };
    });
  };

  // Helper function to determine file type from extension
  const getFileTypeFromExtension = (extension: string): string => {
    const ext = extension.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image/' + ext;
    if (['mp4', 'webm', 'mov', 'avi'].includes(ext)) return 'video/' + ext;
    if (['mp3', 'wav', 'ogg', 'aac'].includes(ext)) return 'audio/' + ext;
    if (ext === 'pdf') return 'application/pdf';
    return 'application/octet-stream';
  };



  // Helper function to get the current question's response from module progress
  const getCurrentQuestionResponse = () => {
    if (!moduleProgress?.questionResponses || !moduleVersion) {
      return null;
    }
    
    const currentQuestion = getCurrentQuestion();
    if (!currentQuestion) return null;
    
    return moduleProgress.questionResponses.find(
      response => response.questionId === currentQuestion.id
    );
  };

  // Helper function to check if an answer is selected based on pending answers or progress
  const isAnswerSelected = (answerId: string): boolean => {
    const currentQuestion = moduleVersion?.questions[currentQuestionIndex];
    if (!currentQuestion) return false;
    
    // Check pending answers first (user's current selections)
    const pendingAnswer = pendingAnswers[currentQuestion.id];
    if (pendingAnswer) {
      return pendingAnswer.includes(answerId);
    }
    
    // Fall back to saved progress if no pending changes
    const response = getCurrentQuestionResponse();
    if (!response?.selectedAnswerIds) {
      return false;
    }
    
    return response.selectedAnswerIds.includes(answerId);
  };

  // Function to handle free text input changes
  const handleFreeTextChange = (questionId: string, value: string) => {
    // Don't allow changes if time has expired
    if (timeRemaining?.isExpired) return;
    
    setFreeTextAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  // Function to handle answer selection (store locally, don't submit yet)
  const handleAnswerSelection = (answerId: string, questionId: string, questionType: QuestionType) => {
    // Don't allow answer changes if time has expired
    if (timeRemaining?.isExpired) return;
    
    const currentlySelected = pendingAnswers[questionId] || [];
    let newSelectedAnswerIds: string[];
    
    // Handle different question types
    if (questionType === QuestionType.SingleChoice) {
      // For single choice, replace the selection
      newSelectedAnswerIds = [answerId];
    } else if (questionType === QuestionType.MultipleChoice) {
      // For multiple choice, toggle the selection
      if (currentlySelected.includes(answerId)) {
        newSelectedAnswerIds = currentlySelected.filter(id => id !== answerId);
      } else {
        newSelectedAnswerIds = [...currentlySelected, answerId];
      }
    } else {
      // For other types, default to single choice behavior
      newSelectedAnswerIds = [answerId];
    }
    
    // Update pending answers
    setPendingAnswers(prev => ({
      ...prev,
      [questionId]: newSelectedAnswerIds
    }));
  };

  // Function to submit pending answers for the current question
  const submitPendingAnswerForQuestion = async (questionId: string) => {
    // In demo mode, just move pending answers to initial answers (mark as submitted)
    if (demoMode) {
      const pendingAnswer = pendingAnswers[questionId];
      if (pendingAnswer && pendingAnswer.length > 0) {
        setInitialAnswers(prev => ({
          ...prev,
          [questionId]: [...pendingAnswer]
        }));
      }
      return;
    }

    if (!moduleProgress?.id) {
      return;
    }

    const question = moduleVersion?.questions.find(q => q.id === questionId);
    if (!question) {
      return;
    }

    let pendingAnswer: string[];
    let initialAnswer: string[] = initialAnswers[questionId] || [];

    // Handle free text questions differently
    if (parseQuestionType(question.type) === QuestionType.FreeText) {
      const freeTextValue = freeTextAnswers[questionId];
      if (!freeTextValue || freeTextValue.trim() === '') {
        return; // No answer to submit
      }
      
      // Check if the free text content has actually changed
      const existingResponse = moduleProgress.questionResponses?.find(r => r.questionId === questionId);
      const existingTextResponse = existingResponse?.textResponse || '';
      
      if (freeTextValue.trim() === existingTextResponse.trim()) {
        return; // No changes to submit - text is the same
      }
      
      // For free text, we submit the text value, but need to match it with answer IDs
      // The backend will handle matching the text to acceptable answers
      pendingAnswer = [freeTextValue]; // Store the text value temporarily
    } else {
      pendingAnswer = pendingAnswers[questionId];
      // Check if there are pending changes for this question
      if (!pendingAnswer || JSON.stringify(pendingAnswer.sort()) === JSON.stringify(initialAnswer.sort())) {
        return; // No changes to submit
      }
    }

    try {
      const questionResponse: QuestionResponseOperation = {
        questionId: questionId,
        selectedAnswerIds: parseQuestionType(question.type) === QuestionType.FreeText ? [] : pendingAnswer, // Empty for free text
        textResponse: parseQuestionType(question.type) === QuestionType.FreeText ? freeTextAnswers[questionId] : undefined, // For FreeText
        questionType: question.type,
        respondedAtUtc: new Date().toISOString()
      };

      await sessionService.submitAnswer(moduleProgress.id, questionResponse);
      
      // Update the module progress state to reflect the change
      setModuleProgress(prev => {
        if (!prev) return prev;
        
        const updatedResponses = prev.questionResponses ? [...prev.questionResponses] : [];
        const existingResponseIndex = updatedResponses.findIndex(r => r.questionId === questionId);
        
        const isFreetextQuestion = parseQuestionType(question.type) === QuestionType.FreeText;
        
        if (existingResponseIndex >= 0) {
          // Update existing response
          updatedResponses[existingResponseIndex] = {
            ...updatedResponses[existingResponseIndex],
            selectedAnswerIds: isFreetextQuestion ? [] : pendingAnswer,
            textResponse: isFreetextQuestion ? freeTextAnswers[questionId] : updatedResponses[existingResponseIndex].textResponse,
            respondedAtUtc: new Date().toISOString()
          };
        } else {
          // Add new response
          updatedResponses.push({
            id: '', // Will be set by backend
            questionId: questionId,
            selectedAnswerIds: isFreetextQuestion ? [] : pendingAnswer,
            textResponse: isFreetextQuestion ? freeTextAnswers[questionId] : undefined,
            questionType: question.type === QuestionType.SingleChoice ? 'SingleChoice' :
                          question.type === QuestionType.MultipleChoice ? 'MultipleChoice' : 
                          'FreeText',
            respondedAtUtc: new Date().toISOString(),
            moduleProgressId: prev.id
          });
        }
        
        return {
          ...prev,
          questionResponses: updatedResponses
        };
      });
      
      // Update initial answers to reflect the new submitted state
      if (parseQuestionType(question.type) === QuestionType.FreeText) {
        // For free text questions, we don't store the text in initialAnswers
        // The text is already stored in the moduleProgress.textResponse above
      } else {
        setInitialAnswers(prev => ({
          ...prev,
          [questionId]: [...pendingAnswer]
        }));
      }
      
    } catch (error) {
      // Error submitting answer
    }
  };

  // Function to get list of unanswered questions
  const getUnansweredQuestions = () => {
    if (!moduleVersion?.questions) return [];
    
    return moduleVersion.questions.filter((question, index) => {
      const isAnswered = initialAnswers[question.id]?.length > 0 || 
                        (freeTextAnswers[question.id] && freeTextAnswers[question.id].trim().length > 0);
      return !isAnswered;
    });
  };

  // Function to handle module submit button click (shows confirmation modal)
  const handleSubmitModule = async () => {
    // Submit pending answer for current question before showing confirmation
    const currentQuestion = moduleVersion?.questions[currentQuestionIndex];
    if (currentQuestion) {
      await submitPendingAnswerForQuestion(currentQuestion.id);
    }
    
    setShowConfirmationModal(true);
  };

  // Function to handle confirmed module submission
  const handleConfirmSubmit = async () => {
    // In demo mode, call the completion callback with all answers
    if (demoMode) {
      setIsSubmitting(true);
      try {
        // Collect all answers (both pending and free text)
        const allAnswers = { ...pendingAnswers };
        
        // Add free text answers
        Object.keys(freeTextAnswers).forEach(questionId => {
          if (freeTextAnswers[questionId]) {
            allAnswers[questionId] = [freeTextAnswers[questionId]];
          }
        });
        
        // Store in localStorage for demo scoring
        localStorage.setItem('demo_user_answers', JSON.stringify(allAnswers));
        
        if (onDemoComplete) {
          onDemoComplete(allAnswers);
        }
      } finally {
        setIsSubmitting(false);
        setShowConfirmationModal(false);
      }
      return;
    }

    if (!moduleProgress) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await sessionService.completeModule(moduleProgress.id);
      
      if (response.isSuccess) {
        // Store completion info in localStorage for celebration animation
        if (state && state.groupMember) {
          const completionInfo = {
            moduleId: state.groupMember.id,
            completedAt: new Date().toISOString(),
            assignmentId: state.assignment.id
          };
          localStorage.setItem('moduleCompletion', JSON.stringify(completionInfo));
        }
        
        // Navigate back normally
        navigate(-1);
      } else {
        setError('Failed to complete module: ' + (response.message || 'Unknown error'));
        setShowConfirmationModal(false);
      }
    } catch (err: any) {
      setError('Failed to complete module: ' + (err.response?.data?.message || err.message));
      setShowConfirmationModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to cancel module submission
  const handleCancelSubmit = () => {
    setShowConfirmationModal(false);
  };

  // Function to handle time expired - redirect back to assignment execution
  const handleTimeExpired = async () => {
    // In demo mode, just exit
    if (demoMode && onDemoExit) {
      onDemoExit();
      return;
    }

    // Submit pending answer for current question before leaving
    const currentQuestion = moduleVersion?.questions[currentQuestionIndex];
    if (currentQuestion) {
      await submitPendingAnswerForQuestion(currentQuestion.id);
    }
    
    // Navigate back to assignment execution
    navigate(-1);
  };

  // Function to initialize the initial answers and pending answers when module progress loads
  const initializeAnswers = useCallback(() => {
    if (!moduleProgress?.questionResponses || !moduleVersion?.questions) {
      return;
    }
    
    const initial: Record<string, string[]> = {};
    const pending: Record<string, string[]> = {};
    const freeTextAnswers: Record<string, string> = {};
    
    moduleProgress.questionResponses.forEach(response => {
      if (response.selectedAnswerIds) {
        initial[response.questionId] = [...response.selectedAnswerIds];
        pending[response.questionId] = [...response.selectedAnswerIds];
      }
      if (response.textResponse) {
        freeTextAnswers[response.questionId] = response.textResponse;
      }
    });
    
    setInitialAnswers(initial);
    setPendingAnswers(pending);
    setFreeTextAnswers(freeTextAnswers);
  }, [moduleProgress, moduleVersion]);

  // Initialize answers when module progress or version changes
  useEffect(() => {
    initializeAnswers();
  }, [initializeAnswers]);

  // Prevent text copying via keyboard shortcuts and context menu
  useEffect(() => {
    const preventCopy = (e: KeyboardEvent) => {
      // Prevent Ctrl+C, Ctrl+A, Ctrl+X, Ctrl+V, Ctrl+S, F12, etc.
      if ((e.ctrlKey || e.metaKey) && (
        e.key === 'c' || 
        e.key === 'a' || 
        e.key === 'x' || 
        e.key === 'v' || 
        e.key === 's' ||
        e.key === 'p'
      )) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      
      // Prevent F12 (Developer Tools)
      if (e.key === 'F12') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      
      // Prevent Ctrl+Shift+I (Developer Tools)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    const preventContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // Add event listeners
    document.addEventListener('keydown', preventCopy, true);
    document.addEventListener('contextmenu', preventContextMenu, true);

    return () => {
      // Clean up event listeners
      document.removeEventListener('keydown', preventCopy, true);
      document.removeEventListener('contextmenu', preventContextMenu, true);
    };
  }, []);

  const currentQuestion = getCurrentQuestion();

  // Validate that we have required state before rendering (skip in demo mode)
  if (!demoMode && (!state || !state.assignment || !state.groupMember || !state.user)) {
    return (
      <div className={cssStyles.container}>
        <div className={cssStyles.header}>
          <button onClick={() => navigate('/')} className={cssStyles.backButton}>
            ← Back
          </button>
        </div>
        <div className={cssStyles.errorContainer}>
          <h3>Error</h3>
          <p>Missing required data. Please try accessing this module from the assignment page.</p>
          <button onClick={() => navigate('/')} className={cssStyles.retryButton}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={cssStyles.container}>
        <div className={cssStyles.header}>
          <button onClick={handleBack} className={cssStyles.backButton}>
            ← Back
          </button>
        </div>
        <div className={cssStyles.loadingContainer}>
          <div className={cssStyles.spinner}></div>
          <p>Loading questions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cssStyles.container}>
        <div className={cssStyles.header}>
          <button onClick={handleBack} className={cssStyles.backButton}>
            ← Back
          </button>
        </div>
        <div className={cssStyles.errorContainer}>
          <h3>Error</h3>
          <p>{error}</p>
          <button onClick={loadModuleData} className={cssStyles.retryButton}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!moduleVersion || !currentQuestion) {
    return (
      <div className={cssStyles.container}>
        <div className={cssStyles.header}>
          <button onClick={handleBack} className={cssStyles.backButton}>
            ← Back
          </button>
        </div>
        <div className={cssStyles.errorContainer}>
          <h3>No Questions Available</h3>
          <p>This module does not contain any questions.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(cssStyles.container, "questions-container")}>
      <style>
        {`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-3px); }
            75% { transform: translateX(3px); }
          }
          
          /* Mobile responsive styles for Questions component */
          @media (max-width: 768px) {
            .questions-container {
              padding: 12px !important;
              overflow-x: auto !important;
            }
            
            .questions-header {
              flex-direction: row !important;
              flex-wrap: wrap !important;
              gap: 8px !important;
              margin-bottom: 16px !important;
              align-items: center !important;
            }
            
            .questions-header-info {
              flex: 1 1 0 !important;
              min-width: 0 !important;
              overflow: hidden !important;
            }
            
            .questions-header-info h2 {
              font-size: 18px !important;
              margin: 0 0 4px 0 !important;
              white-space: nowrap !important;
              overflow: hidden !important;
              text-overflow: ellipsis !important;
            }
            
            .questions-header-info p {
              font-size: 13px !important;
              margin: 0 !important;
              white-space: nowrap !important;
              overflow: hidden !important;
              text-overflow: ellipsis !important;
            }
            
            .questions-back-button {
              padding: 8px 16px !important;
              font-size: 14px !important;
              width: fit-content !important;
              order: -1 !important;
              flex-basis: 100% !important;
            }
            
            .questions-time-remaining-box {
              position: static !important;
              margin: 0 !important;
              width: fit-content !important;
              flex-shrink: 0 !important;
            }
            
            .questions-progress-bar {
              margin-bottom: 20px !important;
            }
            
            .questions-question-container {
              padding: 16px !important;
              margin-bottom: 16px !important;
            }
            
            .questions-question-header {
              margin-bottom: 16px !important;
            }
            
            .questions-question-header h3 {
              font-size: 16px !important;
              margin: 0 !important;
              white-space: nowrap !important;
            }
            
            .questions-question-text {
              font-size: 16px !important;
              margin-bottom: 20px !important;
            }
            
            .questions-question-attachments {
              margin-bottom: 16px !important;
            }
            
            .questions-answers-container {
              gap: 12px !important;
              overflow-x: auto !important;
            }
            
            .questions-answer-option {
              padding: 12px !important;
              flex-direction: column !important;
              align-items: flex-start !important;
              gap: 8px !important;
            }
            
            .questions-answer-label {
              font-size: 14px !important;
            }
            
            .questions-navigation {
              position: sticky !important;
              bottom: 0 !important;
              padding: 16px !important;
            }
            
            .questions-navigation-controls {
              flex-direction: column !important;
              gap: 16px !important;
            }
            
            .questions-main-buttons {
              display: flex !important;
              flex-direction: row !important;
              gap: 8px !important;
              width: 100% !important;
              justify-content: space-between !important;
            }
            
            .questions-navigation-button,
            .questions-submit-button {
              flex: 1 !important;
              padding: 10px 8px !important;
              font-size: 13px !important;
              min-width: 0 !important;
              white-space: nowrap !important;
            }
            
            .questions-go-to-container {
              flex-direction: column !important;
              gap: 8px !important;
              width: 100% !important;
            }
            
            .questions-go-to-input {
              width: 100% !important;
              padding: 10px !important;
            }
            
            .questions-go-to-button {
              width: 100% !important;
              padding: 10px !important;
            }
            
            .questions-modal {
              width: 95% !important;
              max-width: 95% !important;
              max-height: 90% !important;
              margin: 20px auto !important;
            }
          }
          
          @media (max-width: 480px) {
            .questions-container {
              padding: 8px !important;
            }
            
            .questions-question-container {
              padding: 12px !important;
            }
            
            .questions-header-info h2 {
              font-size: 18px !important;
            }
            
            .questions-question-text {
              font-size: 14px !important;
            }
            
            .questions-answer-label {
              font-size: 13px !important;
            }
            
            .questions-modal {
              width: 98% !important;
              margin: 10px auto !important;
            }
          }
          
          /* Super narrow screens - make scrollable */
          @media (max-width: 320px) {
            .questions-container {
              padding: 4px !important;
              min-height: 100vh !important;
              overflow-x: auto !important;
              min-width: 280px !important;
            }
            
            .questions-header {
              flex-wrap: wrap !important;
              gap: 8px !important;
              margin-bottom: 12px !important;
              min-width: 280px !important;
            }
            
            .questions-header-info {
              min-width: 240px !important;
            }
            
            .questions-header-info h2 {
              font-size: 16px !important;
              line-height: 1.2 !important;
              word-break: break-word !important;
            }
            
            .questions-header-info p {
              font-size: 12px !important;
              line-height: 1.3 !important;
              word-break: break-word !important;
            }
            
            .questions-question-container {
              padding: 8px !important;
              min-width: 270px !important;
              overflow-x: auto !important;
            }
            
            .questions-question-header h3 {
              font-size: 16px !important;
              word-break: break-word !important;
            }
            
            .questions-question-text {
              font-size: 13px !important;
              line-height: 1.4 !important;
              word-break: break-word !important;
              overflow-wrap: break-word !important;
              margin-bottom: 12px !important;
              min-width: 260px !important;
            }
            
            .questions-question-attachments {
              margin-bottom: 12px !important;
              min-width: 260px !important;
            }
            
            .questions-answers-container {
              min-width: 260px !important;
              overflow-x: auto !important;
            }
            
            .questions-answer-option {
              padding: 8px !important;
              min-width: 250px !important;
              word-break: break-word !important;
            }
            
            .questions-answer-label {
              font-size: 12px !important;
              line-height: 1.3 !important;
              word-break: break-word !important;
            }
            
            .questions-navigation {
              padding: 8px !important;
              min-width: 270px !important;
              overflow-x: auto !important;
            }
            
            .questions-navigation-button,
            .questions-submit-button {
              flex: 1 !important;
              padding: 8px 6px !important;
              font-size: 11px !important;
              min-height: 36px !important;
              min-width: 0 !important;
              white-space: nowrap !important;
              overflow: hidden !important;
              text-overflow: ellipsis !important;
            }
            
            .questions-main-buttons {
              display: flex !important;
              flex-direction: row !important;
              gap: 4px !important;
              width: 100% !important;
            }
            
            .questions-go-to-container {
              min-width: 250px !important;
            }
            
            .questions-modal {
              width: 99% !important;
              margin: 5px auto !important;
              max-height: 95vh !important;
              overflow-y: auto !important;
            }
            
            .questions-back-button {
              padding: 6px 12px !important;
              font-size: 12px !important;
              min-width: 60px !important;
            }
            
            .questions-time-remaining-box {
              transform: scale(0.9) !important;
            }
          }
        `}
      </style>
      <div className={cn(cssStyles.header, "questions-header")}>
        <button onClick={handleBack} className={cn(cssStyles.backButton, "questions-back-button")}>
          ← Back
        </button>
        <div className={cn(cssStyles.headerInfo, "questions-header-info")}>
          {demoMode ? (
            <>
              <h2>Demo Assessment</h2>
              <p>{moduleVersion.title}</p>
            </>
          ) : (
            <>
              <h2>{state.assignment.title}</h2>
              <p>{state.groupMember.assessmentModuleTitle}</p>
            </>
          )}
        </div>
        {timeRemaining && !timeRemaining.isExpired && (
          <div 
            className={cn(cssStyles.timeRemainingBox, "questions-time-remaining-box")}
            onClick={() => setIsTimeBoxHidden(!isTimeBoxHidden)}
            title={isTimeBoxHidden ? "Click to show remaining time" : "Click to hide remaining time"}
          >
            <div className={cssStyles.timeRemainingContent}>
              <div className={cssStyles.timeRemainingText}>
                {isTimeBoxHidden 
                  ? '--:--' 
                  : timeRemaining.formattedTime.replace(/:/g, showColon ? ':' : ' ')
                }
              </div>
              <div className={cssStyles.timeRemainingHint}>
                Click to {isTimeBoxHidden ? 'show' : 'hide'}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className={cn(cssStyles.progressBar, "questions-progress-bar")}>
        <div className={cssStyles.progressContainer}>
          {moduleVersion.questions.map((question, index) => {
            const isAnswered = initialAnswers[question.id]?.length > 0 || 
                              (freeTextAnswers[question.id] && freeTextAnswers[question.id].trim().length > 0);
            const isPast = index < currentQuestionIndex;
            const isCurrent = index === currentQuestionIndex;
            const isSkipped = !isAnswered && isPast;
            const segmentWidth = (1 / moduleVersion.questions.length) * 100;
            
            return (
              <div
                key={question.id}
                className={cn(
                  cssStyles.progressSegment,
                  isAnswered && cssStyles['progressSegment--answered'],
                  isSkipped && cssStyles['progressSegment--skipped'],
                  isCurrent && cssStyles['progressSegment--current'],
                  isSkipped && cssStyles['progressSegment--clickable']
                )}
                style={{ width: `${segmentWidth}%` }}
                onClick={isSkipped ? () => handleGoToQuestion(index + 1) : undefined}
                title={isSkipped ? `Go to Question ${index + 1} (Skipped)` : undefined}
              />
            );
          })}
        </div>
        <div className={cssStyles.progressInfo}>
          <span className={cssStyles.progressText}>
            Question {currentQuestionIndex + 1} of {moduleVersion.questions.length}
          </span>
        </div>
      </div>

      <div className={cn(cssStyles.questionContainer, "questions-question-container")}>
        {timeRemaining?.isExpired && (
          <div className={cssStyles.expiredOverlay}>
            <div className={cssStyles.expiredMessage}>
              <div className={cssStyles.expiredIcon}><img src="/images/icons/time.svg" alt="Time expired" style={{width: '48px', height: '48px'}} /></div>
              <div className={cssStyles.expiredText}>Time Expired</div>
            </div>
          </div>
        )}
        
        <div className={cn(cssStyles.questionHeader, "questions-question-header")}>
          <div className={cssStyles.questionHeaderTop}>
            <h3>Question {currentQuestionIndex + 1}</h3>
            <div className={cssStyles.questionType}>
              {formatQuestionType(currentQuestion.type)}
            </div>
          </div>
        </div>

        {/* Separator after question header */}
        <div className={cssStyles.questionHeaderSeparator}></div>

        {currentQuestion.text && (
          <div className={cn(cssStyles.questionText, "questions-question-text")}>
            {currentQuestion.text}
          </div>
        )}

        {currentQuestion.staticFileUrls && currentQuestion.staticFileUrls.length > 0 && (
          <div className={cn(cssStyles.questionAttachments, "questions-question-attachments")}>
            <FilePreview 
              files={convertUrlsToStaticFiles(currentQuestion.staticFileUrls)} 
              readonly={true}
              title=""
              showFileName={false}
              customStyles={{
                filesGrid: {
                  display: 'grid',
                  gridTemplateColumns: currentQuestion.staticFileUrls.length > 1 
                    ? 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))' 
                    : '1fr',
                  gap: '8px',
                  paddingTop: '8px',
                  maxWidth: '100%'
                }
              }}
            />
          </div>
        )}

        {/* Separator between question and answers */}
        <div className={cssStyles.questionAnswersSeparator}></div>

        <div 
          className={cn(
            cssStyles.answersContainer,
            "questions-answers-container",
            // Use grid layout when all answers have attachments
            currentQuestion.answers.length > 1 && 
            currentQuestion.answers.every(answer => answer.staticFileUrls && answer.staticFileUrls.length > 0) && 
            "questions-grid-layout"
          )}
          style={{
            // Dynamic grid layout override when needed
            ...(currentQuestion.answers.length > 1 && 
                currentQuestion.answers.every(answer => answer.staticFileUrls && answer.staticFileUrls.length > 0) ? {
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, max-content))',
              gap: '4px',
              alignItems: 'start'
            } : {})
          }}
        >
          {parseQuestionType(currentQuestion.type) === QuestionType.FreeText ? (
            <div className={cssStyles.freeTextInputContainer}>
              <textarea
                placeholder="Enter your answer here..."
                className={cssStyles.freeTextInput}
                disabled={timeRemaining?.isExpired}
                value={freeTextAnswers[currentQuestion.id] || ''}
                onChange={(e) => handleFreeTextChange(currentQuestion.id, e.target.value)}
              />
            </div>
          ) : (
            currentQuestion.answers.map((answer: ExamTakerPossibleAnswer, index: number) => (
              <div 
                key={answer.id} 
                className={cn(
                  cssStyles.answerOption,
                  "questions-answer-option",
                  timeRemaining?.isExpired && cssStyles.disabled
                )}
                onClick={() => {
                  if (!timeRemaining?.isExpired) {
                    handleAnswerSelection(answer.id, currentQuestion.id, parseQuestionType(currentQuestion.type));
                  }
                }}
                style={{
                  cursor: timeRemaining?.isExpired ? 'not-allowed' : 'pointer',
                  // When in grid mode (all answers have attachments), improve layout
                  ...(currentQuestion.answers.length > 1 && 
                      currentQuestion.answers.every(ans => ans.staticFileUrls && ans.staticFileUrls.length > 0) ? {
                    flexDirection: 'column' as const,
                    alignItems: 'flex-start',
                    minHeight: 'auto',
                    height: 'auto',
                    position: 'relative' as const
                  } : {})
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                  <input
                    type={parseQuestionType(currentQuestion.type) === QuestionType.MultipleChoice ? "checkbox" : "radio"}
                    id={`answer-${answer.id}`}
                    name={`question-${currentQuestion.id}`}
                    value={answer.id}
                    className={cn(cssStyles.answerRadio)}
                    checked={isAnswerSelected(answer.id)}
                    disabled={timeRemaining?.isExpired}
                    onChange={() => {
                      if (!timeRemaining?.isExpired) {
                        handleAnswerSelection(answer.id, currentQuestion.id, parseQuestionType(currentQuestion.type));
                      }
                    }}
                  />
                  <span 
                    className={cssStyles.answerLetter}
                  >
                    {String.fromCharCode(65 + index)}
                  </span>
                </div>
                <label 
                  htmlFor={`answer-${answer.id}`} 
                  className={cn(cssStyles.answerLabel)}
                  style={{
                    cursor: timeRemaining?.isExpired ? 'not-allowed' : 'pointer',
                    opacity: timeRemaining?.isExpired ? 0.6 : 1,
                    // When in grid mode, stack letter below the input
                    ...(currentQuestion.answers.length > 1 && 
                        currentQuestion.answers.every(ans => ans.staticFileUrls && ans.staticFileUrls.length > 0) ? {
                      width: '100%',
                      flexDirection: 'column' as const,
                      alignItems: 'flex-start',
                      paddingLeft: '0px',
                      paddingTop: answer.text ? '45px' : '0px' // Minimal space when no text, just attachment
                    } : {})
                  }}
                  onClick={(e) => e.preventDefault()} // Prevent label from triggering the input
                >
                  <div 
                    className={cssStyles.answerContent}
                    style={{
                      // When in grid mode, content goes below the letter
                      ...(currentQuestion.answers.length > 1 && 
                          currentQuestion.answers.every(ans => ans.staticFileUrls && ans.staticFileUrls.length > 0) ? {
                      width: '100%',
                      marginLeft: '0px',
                      marginTop: answer.text ? '4px' : '0px' // No top margin when no text
                    } : {})
                  }}>
                    {answer.text && <div>{answer.text}</div>}
                    {answer.staticFileUrls && answer.staticFileUrls.length > 0 && (
                      <div 
                        className={cssStyles.answerAttachments}
                        onClick={(e) => e.stopPropagation()} // Prevent answer selection when clicking on attachments
                      >
                        <FilePreview 
                          files={convertUrlsToStaticFiles(answer.staticFileUrls)} 
                          readonly={true}
                          title=""
                          showFileName={false}
                          customStyles={{
                            container: {
                              width: '100%',
                              maxWidth: '100%'
                            },
                            filesGrid: {
                              display: 'grid',
                              gridTemplateColumns: 
                                // If all answers have attachments (grid mode), keep it simple
                                currentQuestion.answers.length > 1 && 
                                currentQuestion.answers.every(ans => ans.staticFileUrls && ans.staticFileUrls.length > 0)
                                  ? '1fr'
                                  : answer.staticFileUrls.length > 1 
                                    ? 'repeat(auto-fit, minmax(180px, 1fr))' 
                                    : '1fr',
                              gap: '4px',
                              paddingTop: '4px'
                            },
                            fileCard: {
                              width: '100%',
                              marginTop: '0px'
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>
                </label>
              </div>
            ))
          )}
        </div>
      </div>

      <div className={cn(cssStyles.navigation, "questions-navigation")}>
        <div className={cn(cssStyles.navigationControls, "questions-navigation-controls")}>
          <div className={cn(cssStyles.mainButtons, "questions-main-buttons")}>
            {currentQuestionIndex > 0 ? (
              <button
                onClick={handlePreviousQuestion}
                disabled={timeRemaining?.isExpired}
                className={cn(
                  timeRemaining?.isExpired 
                    ? cssStyles.navigationButtonDisabled 
                    : cssStyles.navigationButton,
                  "questions-navigation-button"
                )}
              >
                ← Previous
              </button>
            ) : (
              <button 
                className={cn(cssStyles.navigationButtonDisabled, "questions-navigation-button")}
                disabled
              >
                ← Previous
              </button>
            )}
            
            <button
              onClick={() => setShowGoToModal(true)}
              disabled={timeRemaining?.isExpired}
              className={cn(
                timeRemaining?.isExpired 
                  ? cssStyles.navigationButtonDisabled 
                  : cssStyles.goToButton,
                "questions-navigation-button"
              )}
              title="Jump to question"
            >
              Go to Q#
            </button>
            
            {currentQuestionIndex < moduleVersion.questions.length - 1 ? (
              <button
                onClick={handleNextQuestion}
                disabled={timeRemaining?.isExpired}
                className={cn(
                  timeRemaining?.isExpired 
                    ? cssStyles.navigationButtonDisabled 
                    : cssStyles.navigationButton,
                  "questions-navigation-button"
                )}
              >
                Next →
              </button>
            ) : (
              <button
                onClick={handleSubmitModule}
                className={cn(
                  timeRemaining?.isExpired 
                    ? cssStyles.navigationButtonDisabled 
                    : cssStyles.submitButton,
                  "questions-submit-button"
                )}
                disabled={isSubmitting || timeRemaining?.isExpired}
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Go to Q# Modal */}
      {showGoToModal && (
        <div className={cssStyles.modalOverlay} onClick={() => setShowGoToModal(false)}>
          <div className={cn(cssStyles.modal, cssStyles.goToQuestionModal, "questions-modal")} onClick={(e) => e.stopPropagation()}>
            <div className={cssStyles.modalHeader}>
              <h3 className={cssStyles.modalTitle}>Go to Question</h3>
              <button
                onClick={() => setShowGoToModal(false)}
                className={cssStyles.modalCloseButton}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className={cssStyles.modalBody}>
              <div className={cn(
                cssStyles.goToContainer,
                "go-to-container",
                showShakeAnimation && cssStyles.shakeAnimation
              )}>
                <label className={cssStyles.goToLabel}>Enter question number (1-{moduleVersion.questions.length}):</label>
                <input
                  type="text"
                  value={goToInput}
                  onChange={handleGoToInputChange}
                  onKeyPress={handleGoToKeyPress}
                  placeholder={`1 - ${moduleVersion.questions.length}`}
                  className={cn(cssStyles.goToInput, "questions-go-to-input")}
                  autoFocus
                />
                {showErrorPopup && (
                  <div className={cssStyles.errorMessage} style={{ color: '#d32f2f', marginTop: '8px', fontSize: '14px' }}>
                    <img src="/images/icons/warning.svg" alt="Warning" style={{width: '16px', height: '16px', marginRight: '6px', verticalAlign: 'middle', display: 'inline-block'}} /> Please enter a number between 1 and {moduleVersion.questions.length}
                  </div>
                )}
              </div>
            </div>
            <div className={cssStyles.modalFooter}>
              <button
                onClick={() => setShowGoToModal(false)}
                className={cssStyles.cancelButton}
              >
                Cancel
              </button>
              <button
                onClick={handleGoToSubmit}
                disabled={!goToInput || isNaN(parseInt(goToInput)) || parseInt(goToInput) < 1 || parseInt(goToInput) > moduleVersion.questions.length}
                className={cn(
                  !goToInput || isNaN(parseInt(goToInput)) || parseInt(goToInput) < 1 || parseInt(goToInput) > moduleVersion.questions.length
                    ? cssStyles.goToButtonDisabled
                    : cssStyles.navigationButton,
                  "questions-go-to-button"
                )}
              >
                Go to Question
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmationModal && (
        <div className={cssStyles.modalOverlay}>
          <div className={cn(cssStyles.modal, cssStyles.modalLarge, "questions-modal")}>
            <div className={cssStyles.modalHeader}>
              <h3 className={cssStyles.modalTitle}>Confirm Module Submission</h3>
            </div>
            <div className={cssStyles.modalBody}>
              {(() => {
                const unansweredQuestions = getUnansweredQuestions();
                const hasUnanswered = unansweredQuestions.length > 0;
                
                return (
                  <>
                    <div className={cssStyles.warningIcon}>
                      {hasUnanswered ? 
                        <img src="/images/icons/warning.svg" alt="Warning" style={{width: '32px', height: '32px'}} /> : 
                        <img src="/images/icons/check.svg" alt="Check" style={{width: '32px', height: '32px'}} />
                      }
                    </div>
                    <div className={cssStyles.modalContent}>
                      {hasUnanswered ? (
                        <>
                          <p className={cssStyles.modalText}>
                            <strong>Warning:</strong> You have {unansweredQuestions.length} unanswered question{unansweredQuestions.length > 1 ? 's' : ''}:
                          </p>
                          <div className={cssStyles.unansweredList}>
                            {unansweredQuestions.map((question, idx) => {
                              const questionIndex = moduleVersion?.questions.findIndex(q => q.id === question.id);
                              return (
                                <div 
                                  key={question.id} 
                                  className={cssStyles.unansweredItem}
                                  onClick={() => {
                                    setShowConfirmationModal(false);
                                    if (questionIndex !== undefined && questionIndex >= 0) {
                                      handleGoToQuestion(questionIndex + 1);
                                    }
                                  }}
                                >
                                  <span className={cssStyles.unansweredNumber}>Question {questionIndex !== undefined ? questionIndex + 1 : '?'}</span>
                                  <span className={cssStyles.unansweredIcon}>→</span>
                                </div>
                              );
                            })}
                          </div>
                          <p className={cssStyles.modalText}>
                            Click on a question above to go back and answer it, or proceed to submit with unanswered questions.
                          </p>
                        </>
                      ) : (
                        <p className={cssStyles.modalText}>
                          All questions have been answered.
                        </p>
                      )}
                      <p className={cssStyles.modalText}>
                        <strong>Important:</strong> Once you submit this module, you will not be able to change any of your answers.
                      </p>
                      <p className={cssStyles.modalText}>
                        Are you sure you want to submit your responses?
                      </p>
                    </div>
                  </>
                );
              })()}
            </div>
            <div className={cssStyles.modalFooter}>
              <button
                onClick={handleCancelSubmit}
                className={cssStyles.cancelButton}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSubmit}
                className={cn(
                  cssStyles.confirmButton,
                  isSubmitting && "opacity-70 cursor-not-allowed"
                )}
                style={isSubmitting ? { opacity: 0.7, cursor: 'not-allowed' } : {}}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Confirm Submission'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Time Expired Modal */}
      {showTimeExpiredModal && (
        <div 
          className={cssStyles.modalOverlay}
          onClick={(e) => e.stopPropagation()} // Prevent closing on overlay click
        >
          <div className={cn(cssStyles.modal, "questions-modal")}>
            <div className={cssStyles.modalBody}>
              <div className={cssStyles.timeExpiredIcon}><img src="/images/icons/time.svg" alt="Time expired" style={{width: '48px', height: '48px'}} /></div>
              <div className={cssStyles.modalContent}>
                <p className={cssStyles.modalText}>
                  <strong>Time has run out!</strong>
                </p>
                <p className={cssStyles.modalText}>
                  The time limit for this module has been reached. Your current answers have been automatically saved.
                </p>
                {moduleProgress?.startedAtUtc && (
                  <p className={cssStyles.modalText}>
                    Module started: {formatDateToLocal(moduleProgress.startedAtUtc)}
                  </p>
                )}
                <p className={cssStyles.modalText}>
                  Click the button below to return to the assignment page.
                </p>
              </div>
            </div>
            <div className={cssStyles.modalFooter}>
              <button
                onClick={handleTimeExpired}
                className={cssStyles.timeExpiredButton}
              >
                Back to Assignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Questions;
