import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AssignmentAccess from '../components/AssignmentAccess/AssignmentAccess';
import { Assignment } from '../models/assignment';
import { getUserInformation, type CurrentUser } from '../utils/tokenUtils';
import { CONSTANTS } from '../constants/contstants';
import { ExamTakerState } from '../models/exam-taker-state';

const MyAssignments: React.FC = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    // First, try to get authenticated user from token
    try {
      const user = getUserInformation();
      setCurrentUser(user);
      return;
    } catch (error) {
      // No token or invalid token, continue to check localStorage
    }
    
    // Check for exam taker in localStorage
    try {
      const examTakerFromStorageJson = localStorage.getItem(CONSTANTS.EXAM_TAKER);
      if (examTakerFromStorageJson) {
        const examTakerFromStorage = JSON.parse(examTakerFromStorageJson) as ExamTakerState;
        
        if (examTakerFromStorage && examTakerFromStorage.id) {
          setCurrentUser(examTakerFromStorage);
        }
      }
    } catch (storageError) {
      // Error parsing exam taker data from localStorage
    }
  }, []);
  
  const handleLoginRequest = () => {
    navigate('/login?redirectTo=/my-assignments');
  };

  const handleAssignmentOpen = (assignment: Assignment) => {
    // Navigate to the dedicated assignment execution page
    navigate(`/assignment/${assignment.id}`);
  };

  // Function to refresh user info - can be called when exam taker logs in
  const refreshUserInfo = () => {
    try {
      const user = getUserInformation();
      setCurrentUser(user);
    } catch (error) {
      try {
        const examTakerFromStorageJson = localStorage.getItem(CONSTANTS.EXAM_TAKER);
        if (examTakerFromStorageJson) {
          const examTakerFromStorage = JSON.parse(examTakerFromStorageJson) as ExamTakerState;
          if (examTakerFromStorage && examTakerFromStorage.id) {
            setCurrentUser(examTakerFromStorage);
          }
        }
      } catch (storageError) {
        // Error parsing exam taker data from localStorage
      }
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <AssignmentAccess 
          onLoginRequest={handleLoginRequest} 
          onAssignmentOpen={handleAssignmentOpen}
          currentUser={currentUser}
          onUserUpdate={refreshUserInfo}
        />
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: 'calc(100vh - 80px)',
    background: 'linear-gradient(135deg, #f9fafb 0%, #e5e7eb 100%)',
    padding: '2rem 1rem',
  },
  content: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
};

export default MyAssignments;
