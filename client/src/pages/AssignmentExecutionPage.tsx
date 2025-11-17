import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AssignmentExecution from '../components/AssignmentExecution/AssignmentExecution';
import { Assignment } from '../models/assignment';
import { getUserInformation, type CurrentUser } from '../utils/tokenUtils';
import { CONSTANTS } from '../constants/contstants';
import { ExamTakerState } from '../models/exam-taker-state';
import { assignmentService } from '../services/assignmentService';
import styles from './AssignmentExecutionPage.module.css';

const AssignmentExecutionPage: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showExamTakerPrompt, setShowExamTakerPrompt] = useState(false);
  const [examTakerId, setExamTakerId] = useState('');
  const [examTakerError, setExamTakerError] = useState('');

  // Load assignment by ID from URL
  const loadAssignmentById = async (assignmentId: string) => {
    setIsLoading(true);
    try {
      const response = await assignmentService.getAssignmentById(assignmentId);
      if (response.isSuccess && response.data) {
        setSelectedAssignment(response.data);
        return response.data;
      } else {
        // If assignment can't be loaded, redirect to my assignments
        navigate('/my-assignments');
        return null;
      }
    } catch (error) {
      navigate('/my-assignments');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Load assignment when component mounts or assignment ID changes
    const assignmentId = params.assignmentId;
    if (assignmentId) {
      loadAssignmentById(assignmentId);
    } else {
      // No assignment ID, redirect to my assignments
      navigate('/my-assignments');
    }
  }, [params.assignmentId]);

  useEffect(() => {
    // Check if userId is provided in the route
    const userIdFromRoute = params.userId;
    
    // Load current user information
    try {
      const user = getUserInformation();
      setCurrentUser(user);
    } catch (error) {
      // If userId provided in route, use it directly
      if (userIdFromRoute) {
        const examTakerState: ExamTakerState = {
          id: userIdFromRoute,
          fullName: '',
          email: ''
        };
        localStorage.setItem(CONSTANTS.EXAM_TAKER, JSON.stringify(examTakerState));
        setCurrentUser(examTakerState);
        return;
      }

      // No token or invalid token, check localStorage for exam taker
      try {
        const examTakerFromStorageJson = localStorage.getItem(CONSTANTS.EXAM_TAKER);
        if (examTakerFromStorageJson) {
          const examTakerFromStorage = JSON.parse(examTakerFromStorageJson) as ExamTakerState;
          
          if (examTakerFromStorage && examTakerFromStorage.id) {
            setCurrentUser(examTakerFromStorage);
          } else {
            // Show prompt for exam taker ID
            setShowExamTakerPrompt(true);
          }
        } else {
          // Show prompt for exam taker ID
          setShowExamTakerPrompt(true);
        }
      } catch (storageError) {
        // Show prompt for exam taker ID
        setShowExamTakerPrompt(true);
      }
    }
  }, [params.userId]);

  const handleExamTakerSubmit = () => {
    if (!examTakerId.trim()) {
      setExamTakerError('Please enter your exam taker ID');
      return;
    }

    const examTakerState: ExamTakerState = {
      id: examTakerId.trim(),
      fullName: '',
      email: ''
    };

    try {
      localStorage.setItem(CONSTANTS.EXAM_TAKER, JSON.stringify(examTakerState));
      setCurrentUser(examTakerState);
      setShowExamTakerPrompt(false);
      setExamTakerError('');
    } catch (error) {
      setExamTakerError('Failed to save exam taker information');
    }
  };

  const handleBackToDashboard = () => {
    navigate('/my-assignments');
  };

  // Show exam taker ID prompt if needed
  if (showExamTakerPrompt) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.promptCard}>
            <h2 className={styles.promptTitle}>Enter Your Exam Taker ID</h2>
            <p className={styles.promptText}>
              Please enter your exam taker ID to access this assignment.
            </p>
            <div className={styles.inputGroup}>
              <input
                type="text"
                placeholder="Enter your ID"
                value={examTakerId}
                onChange={(e) => setExamTakerId(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleExamTakerSubmit()}
                className={styles.input}
              />
              {examTakerError && (
                <p className={styles.errorText}>{examTakerError}</p>
              )}
            </div>
            <button 
              onClick={handleExamTakerSubmit}
              className={styles.submitButton}
            >
              Continue
            </button>
            <button 
              onClick={() => navigate('/my-assignments')}
              className={styles.cancelButton}
            >
              Go to My Assignments
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state while fetching assignment or user info
  if (isLoading || !selectedAssignment || !currentUser) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>
              {isLoading ? 'Loading assignment...' : 
               !selectedAssignment ? 'Assignment not found...' : 
               'Loading user information...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show execution view
  return (
    <AssignmentExecution 
      assignment={selectedAssignment}
      user={currentUser}
      onBack={handleBackToDashboard}
    />
  );
};

export default AssignmentExecutionPage;
