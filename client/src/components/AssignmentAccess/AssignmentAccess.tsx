import React, { useState, useEffect, useRef } from 'react';
import { Assignment } from '../../models/assignment';
import { assignmentService } from '../../services/assignmentService';
import { userService } from '../../services/userService';
import { getTokenUserId, type CurrentUser } from '../../utils/tokenUtils';
import { formatDateToLocal, isBeforeNow, isBetweenDates } from '../../utils/dateUtils';
import { CONSTANTS } from '../../constants/contstants';
import { ExamTakerState } from '../../models/exam-taker-state';

interface AssignmentAccessProps {
  // Optional callback for when user wants to login
  onLoginRequest?: () => void;
  // Callback for when user opens an assignment
  onAssignmentOpen?: (assignment: Assignment) => void;
  // Current user information passed from parent
  currentUser?: CurrentUser | null;
  // Callback for when user information is updated (exam taker login)
  onUserUpdate?: () => void;
}

const AssignmentAccess: React.FC<AssignmentAccessProps> = ({ 
  onLoginRequest,
  onAssignmentOpen,
  onUserUpdate
}) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState('');
  const [examTakerId, setExamTakerId] = useState('');
  const [userIdError, setUserIdError] = useState('');
  const [mode, setMode] = useState<'guest' | 'authenticated'>('guest');
  const [examTakerInfo, setExamTakerInfo] = useState<ExamTakerState | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [serverTime, setServerTime] = useState<Date | null>(null);
  const loadingRef = useRef<boolean>(false);
  const requestCounterRef = useRef<number>(0);

  // Helper function to safely clear exam taker data from localStorage
  const clearExamTakerData = () => {
    try {
      localStorage.removeItem(CONSTANTS.EXAM_TAKER);
      setExamTakerInfo(null);
      setExamTakerId('');
      setAssignments([]);
      setError('');
    } catch (error) {
    }
  };

  // Helper function to determine assignment status based on dates
  const getAssignmentStatus = (assignment: Assignment) => {
    // Use server time if available to prevent clock manipulation
    const timeToUse = serverTime || currentTime;
    
    if (isBeforeNow(assignment.startDateUtc, timeToUse)) {
      return 'scheduled';
    } else if (isBetweenDates(assignment.startDateUtc, assignment.endDateUtc, timeToUse)) {
      return 'active';
    } else {
      return 'ended';
    }
  };

  // Helper function to get badge style and text for assignment status
  const getStatusBadge = (assignment: Assignment) => {
    const status = getAssignmentStatus(assignment);
    
    switch (status) {
      case 'scheduled':
        return {
          style: styles.scheduledBadge,
          text: 'Scheduled'
        };
      case 'active':
        return {
          style: styles.activeBadge,
          text: 'Active'
        };
      case 'ended':
        return {
          style: styles.endedBadge,
          text: 'Ended'
        };
      default:
        return {
          style: styles.draftBadge,
          text: 'Draft'
        };
    }
  };

  useEffect(() => {
    const userId = getTokenUserId();
    // Handle authenticated user
    if (userId) {
      setUserId(userId);
      setMode('authenticated');
      setInitializing(false);
      loadAssignments(userId);
      return;
    }
    // Handle exam taker data from local storage with proper error handling
    const validateAndLoadExamTaker = async () => {
      // Early return if no stored data
      const examTakerFromStorageJson = localStorage.getItem(CONSTANTS.EXAM_TAKER);
      if (!examTakerFromStorageJson) {
        setInitializing(false);
        return;
      }

      // Parse stored exam taker data
      let examTakerFromStorage: ExamTakerState;
      try {
        examTakerFromStorage = JSON.parse(examTakerFromStorageJson);
      } catch (parseError) {
        clearExamTakerData();
        setError('Invalid exam taker data found. Please log in again.');
        setInitializing(false);
        return;
      }

      // Validate parsed data has required fields
      if (!examTakerFromStorage?.id) {
        clearExamTakerData();
        setInitializing(false);
        return;
      }

      // Validate that the user still exists in the system
      try {
        const userResponse = await userService.getExamTaker(examTakerFromStorage.id);
        
        if (!userResponse.data) {
          clearExamTakerData();
          setError('Your exam taker account may have been removed. Please enter your exam taker ID again.');
          setInitializing(false);
          return;
        }
        
        // User exists, proceed with loading
        setExamTakerId(examTakerFromStorage.id);
        setExamTakerInfo(examTakerFromStorage);
        setMode('guest');
        setInitializing(false);
        loadAssignments(examTakerFromStorage.id);
      } catch (validationError: any) {
        // User deleted (404) - clear data and ask for re-entry
        if (validationError.response?.status === 404) {
          clearExamTakerData();
          setError('Your exam taker account may have been removed. Please enter your exam taker ID again.');
          setInitializing(false);
          return;
        }
        
        // Network or other errors - proceed anyway (graceful degradation)
        setExamTakerId(examTakerFromStorage.id);
        setExamTakerInfo(examTakerFromStorage);
        setMode('guest');
        setInitializing(false);
        loadAssignments(examTakerFromStorage.id);
      }
    };
    
    // Only validate exam taker if we're not already an authenticated user
    if (!userId) {
      validateAndLoadExamTaker();
    }
  }, [userId]);

  // Update current time every minute to refresh assignment statuses
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cancel any pending requests
      requestCounterRef.current++;
      loadingRef.current = false;
    };
  }, []);

  const loadAssignments = async (userId: string) => {
    // Prevent multiple simultaneous calls
    if (loadingRef.current) {
      return;
    }
    
    // Increment request counter to track this specific request
    const currentRequestId = ++requestCounterRef.current;
    loadingRef.current = true;
    setLoading(true);
    setError('');
    
    try {
      const response = await assignmentService.getAvailableAssignments(userId);
      
      // Only update state if this is still the latest request
      if (currentRequestId === requestCounterRef.current) {
        // Only update state if we got valid data
        if (response && response.data) {
          const assignmentsData = response.data || [];
          setAssignments(assignmentsData);
          
          // Store server time from the first assignment if available
          if (assignmentsData.length > 0 && assignmentsData[0].serverUtcNow) {
            setServerTime(new Date(assignmentsData[0].serverUtcNow));
          }
        } else {
          setError('Invalid response received from server');
        }
      } else {
      }
    } catch (err: any) {
      // Only set error if this is still the latest request
      if (currentRequestId === requestCounterRef.current) {
        setError('Failed to load assignments: ' + (err.response?.data?.message || err.message));
      }
    } finally {
      // Only update loading state if this is still the latest request
      if (currentRequestId === requestCounterRef.current) {
        loadingRef.current = false;
        setLoading(false);
      }
    }
  };

  const handleGuestAccess = async () => {
    if (!examTakerId.trim()) {
      setUserIdError('Please enter your exam taker ID');
      return;
    }

    setUserIdError('');
    setLoading(true);
    
    try {
      // Convert examTakerId to uppercase since it's stored in uppercase in the database
      const trimmedUserId = examTakerId.trim();
      
      // Validate if the user exists and is an exam taker
      const usersResponse = await userService.getExamTaker(trimmedUserId);
      const user = usersResponse.data;
      if (!user) {
        setUserIdError('Exam taker ID not found');
        setLoading(false);
        return;
      }

      // Check if user has credentials (regular user vs exam taker)
      // Exam takers don't have credentials and can access exams assigned to them
      if (user.hasCredential) {
        setUserIdError('This ID belongs to a regular user. Please use the login button.');
        setLoading(false);
        return;
      }

      // Store exam taker information in local storage with error handling
      try {
        localStorage.setItem(CONSTANTS.EXAM_TAKER, JSON.stringify(user));
        setExamTakerInfo(user as ExamTakerState);
        
        // Notify parent component that user info has been updated
        if (onUserUpdate) {
          onUserUpdate();
        }
      } catch (storageError) {
        // Continue without storing - user can still access assignments this session
        setError('Warning: Unable to save login information. You may need to re-enter your ID if you refresh the page.');
      }

      await loadAssignments(trimmedUserId);
    } catch (err: any) {
      setUserIdError('We couldn\'t find your Exam Taker ID in our system. Please verify your ID or contact your administrator to get the correct ID.');
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleGuestAccess();
    }
  };

  // Show loading during initialization
  if (initializing) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {mode === 'guest' && !examTakerInfo ? (
        <div style={styles.guestAccess}>
          <h2 style={styles.title}>Access Your Assignments</h2>
          <p style={styles.introText}>
            Choose how you want to access your assignments:
          </p>
          
          <div style={styles.accessOptions}>
            {/* Exam Taker Access */}
            <div style={styles.examTakerSection}>
              <div style={styles.optionHeader}>
                <span style={styles.optionIcon}>🆔</span>
                <h3 style={styles.sectionTitle}>Quick Access with Exam Taker ID</h3>
              </div>
              <p style={styles.sectionDescription}>
                <strong>For exam takers:</strong> Enter your unique exam taker ID to quickly access your assignments without needing a username or password.
              </p>
              
              <div style={styles.inputGroup}>
                <input
                  type="text"
                  placeholder="Enter your exam taker ID"
                  value={examTakerId}
                  onChange={(e) => {
                    setExamTakerId(e.target.value.toUpperCase());
                    setUserIdError('');
                  }}
                  onKeyPress={handleKeyPress}
                  style={userIdError ? styles.inputError : styles.input}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#3b82f6';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = userIdError ? '#dc2626' : '#d1d5db';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                <button 
                  onClick={handleGuestAccess}
                  style={styles.accessButton}
                  disabled={loading}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.currentTarget.style.backgroundColor = '#2563eb';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) {
                      e.currentTarget.style.backgroundColor = '#3b82f6';
                    }
                  }}
                >
                  {loading ? 'Checking...' : 'Access Assignments'}
                </button>
              </div>
              
              {userIdError && (
                <p style={styles.errorText}>{userIdError}</p>
              )}
            </div>

            {/* Login Option */}
            {onLoginRequest && (
              <div style={styles.loginSection}>
                <div style={styles.optionHeader}>
                  <span style={styles.optionIcon}>🔐</span>
                  <h3 style={styles.sectionTitle}>Full Account Access</h3>
                </div>
                <p style={styles.sectionDescription}>
                  <strong>Have username and password?</strong> Log in to your account for full access to assignments, progress tracking, and additional features.
                </p>
                <button 
                  onClick={onLoginRequest}
                  style={styles.loginButton}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#059669';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#10b981';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  Login to Your Account
                </button>
              </div>
            )}
          </div>
        </div>
      ) : examTakerInfo ? (
        <div style={styles.examTakerWelcome}>
          <div style={styles.welcomeHeader}>
            <span style={styles.welcomeIcon}>👋</span>
            <div style={styles.welcomeContent}>
              <h2 style={styles.welcomeTitle}>
                Welcome back{`${examTakerInfo.fullName ? `, ${examTakerInfo.fullName}` : ''}`}
              </h2>
              {examTakerInfo.email && (
                <p style={styles.examTakerEmail}>{examTakerInfo.email}</p>
              )}
            </div>
          </div>
          <button 
            onClick={clearExamTakerData}
            style={styles.switchUserButton}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
            }}
          >
            Switch User
          </button>
        </div>
      ) : mode === 'authenticated' ? (
        <div style={styles.authenticatedAccess}>
          <h2 style={styles.title}>
            Welcome to Your Assignment Dashboard
          </h2>
        </div>
      ) : null}

      {/* Assignment List Header */}
      {(mode === 'authenticated' || examTakerInfo) && assignments.length > 0 && (
        <>
          <div style={styles.demoInfoBox}>
            <div style={styles.demoInfoHeader}>
              <img src="/images/icons/rocket.svg" alt="" style={styles.demoInfoIcon} />
              <h3 style={styles.demoInfoTitle}>New to the platform?</h3>
            </div>
            <p style={styles.demoInfoText}>
              Before launching a module, you can use <strong>Demo Mode</strong> to familiarize yourself with the exam experience. 
              Try it out to understand how questions work, navigation, and submission process without affecting your actual assignments.
            </p>
            <a href="/demo" style={styles.demoInfoLink}>
              Try Demo Mode →
            </a>
          </div>
          <h3 style={styles.assignmentsHeader}>Your Available Assignments</h3>
        </>
      )}

      {/* Assignment List - shown for both modes after ID validation */}
      {(mode === 'authenticated' || assignments.length > 0 || (mode === 'guest' && examTakerId && loading)) && (
        <div style={styles.assignmentList}>
          {loading ? (
            <div style={styles.loadingContainer}>
              <p style={styles.loadingText}>Loading assignments...</p>
            </div>
          ) : error ? (
            <div style={styles.errorContainer}>
              <p style={styles.errorText}>{error}</p>
            </div>
          ) : assignments.length === 0 ? (
            <div style={styles.emptyContainer}>
              <p style={styles.emptyMessage}>No assignments available at this time.</p>
            </div>
          ) : (
            assignments.map(assignment => {
              const statusBadge = getStatusBadge(assignment);
              const status = getAssignmentStatus(assignment);
              const isAccessible = assignment.isPublished && (status === 'active' || status === 'ended');
              
              return (
                <div key={assignment.id} style={styles.assignmentCard}>
                  <div style={styles.assignmentHeader}>
                    <h4 style={styles.assignmentTitle}>{assignment.title}</h4>
                    <div style={styles.badgeContainer}>
                      {!assignment.isPublished && (
                        <span style={styles.draftBadge}>Draft</span>
                      )}
                      {assignment.isPublished && (
                        <span style={statusBadge.style}>{statusBadge.text}</span>
                      )}
                    </div>
                  </div>
                  <p 
                    style={styles.assignmentDescription}
                    title={assignment.description || 'No description available'}
                  >
                    {assignment.description 
                      ? assignment.description.length > 150 
                        ? `${assignment.description.substring(0, 150).split(' ').slice(0, -1).join(' ')}...` 
                        : assignment.description
                      : 'No description available'
                    }
                  </p>
                  <div style={styles.assignmentMeta}>
                    <div style={styles.dateInfo}>
                      <span style={styles.metaLabel}>Start:</span>
                      <span>{formatDateToLocal(assignment.startDateUtc)}</span>
                    </div>
                    <div style={styles.dateInfo}>
                      <span style={styles.metaLabel}>End:</span>
                      <span>{formatDateToLocal(assignment.endDateUtc)}</span>
                    </div>
                  </div>
                  {isAccessible && (
                    <button 
                      style={styles.startButton}
                      onClick={() => onAssignmentOpen && onAssignmentOpen(assignment)}
                    >
                      {status === 'ended' ? 'View Results' : 'Open Assignment'}
                    </button>
                  )}
                  {assignment.isPublished && status === 'scheduled' && (
                    <button style={styles.disabledButton} disabled>
                      Not Yet Available
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    marginBottom: '12px',
    textAlign: 'center',
    color: '#1f2937',
  },
  introText: {
    fontSize: '16px',
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: '32px',
    lineHeight: '1.5',
  },
  subtitle: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '20px',
    color: '#374151',
  },
  assignmentsHeader: {
    fontSize: '22px',
    fontWeight: '600',
    marginBottom: '24px',
    marginTop: '32px',
    color: '#374151',
    borderBottom: '2px solid #e5e7eb',
    paddingBottom: '8px',
  },
  demoInfoBox: {
    marginTop: '32px',
    marginBottom: '24px',
    padding: '20px 24px',
    backgroundColor: '#f0f9ff',
    border: '1px solid #bae6fd',
    borderRadius: '12px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
  },
  demoInfoHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px',
  },
  demoInfoIcon: {
    width: '24px',
    height: '24px',
  },
  demoInfoTitle: {
    fontSize: '18px',
    fontWeight: '600',
    margin: '0',
    color: '#0c4a6e',
  },
  demoInfoText: {
    fontSize: '14px',
    color: '#0c4a6e',
    lineHeight: '1.6',
    marginBottom: '12px',
  },
  demoInfoLink: {
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: '14px',
    fontWeight: '600',
    color: '#0284c7',
    textDecoration: 'none',
    transition: 'all 0.2s ease-in-out',
  } as React.CSSProperties,
  guestAccess: {
    marginBottom: '30px',
  },
  accessOptions: {
    display: 'grid',
    gap: '24px',
    marginTop: '20px',
  },
  optionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px',
  },
  optionIcon: {
    fontSize: '24px',
  },
  examTakerSection: {
    padding: '24px',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    backgroundColor: '#f9fafb',
  },
  loginSection: {
    padding: '24px',
    border: '1px solid #bfdbfe',
    borderRadius: '12px',
    backgroundColor: '#eff6ff',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    margin: '0',
    color: '#1f2937',
  },
  sectionDescription: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '16px',
    lineHeight: '1.5',
  },
  inputGroup: {
    display: 'flex',
    gap: '12px',
    marginTop: '16px',
  },
  input: {
    flex: 1,
    padding: '12px 16px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    transition: 'all 0.2s ease-in-out',
    outline: 'none',
  },
  inputError: {
    flex: 1,
    padding: '12px 16px',
    border: '1px solid #dc2626',
    borderRadius: '8px',
    fontSize: '14px',
    backgroundColor: '#fef2f2',
    transition: 'all 0.2s ease-in-out',
    outline: 'none',
  },
  accessButton: {
    padding: '12px 24px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s ease-in-out',
  },
  loginButton: {
    padding: '12px 24px',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '500',
    marginTop: '12px',
    transition: 'all 0.2s ease-in-out',
  },
  authenticatedAccess: {
    marginBottom: '20px',
  },
  examTakerWelcome: {
    marginBottom: '30px',
    padding: '32px',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  },
  welcomeHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '24px',
  },
  welcomeIcon: {
    fontSize: '32px',
    flexShrink: 0,
  },
  welcomeContent: {
    flex: 1,
    textAlign: 'left',
  },
  welcomeTitle: {
    fontSize: '24px',
    fontWeight: '600',
    margin: '0 0 8px 0',
    color: '#1f2937',
    lineHeight: '1.2',
  },
  examTakerEmail: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0',
    fontWeight: '400',
  },
  switchUserButton: {
    padding: '12px 24px',
    backgroundColor: '#ffffff',
    color: '#374151',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s ease-in-out',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
  },
  assignmentList: {
    marginTop: '20px',
  },
  assignmentCard: {
    padding: '20px',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    marginBottom: '16px',
    backgroundColor: 'white',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.2s ease-in-out',
  },
  assignmentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px',
  },
  assignmentTitle: {
    fontSize: '18px',
    fontWeight: '600',
    margin: '0',
    color: '#1f2937',
    flex: 1,
  },
  assignmentDescription: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '16px',
    lineHeight: '1.5',
    whiteSpace: 'pre-wrap',
  },
  assignmentMeta: {
    display: 'flex',
    gap: '24px',
    marginBottom: '16px',
  },
  dateInfo: {
    display: 'flex',
    gap: '6px',
    fontSize: '13px',
  },
  metaLabel: {
    fontWeight: '500',
    color: '#374151',
  },
  publishedBadge: {
    padding: '4px 12px',
    backgroundColor: '#dcfce7',
    color: '#166534',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  draftBadge: {
    padding: '4px 12px',
    backgroundColor: '#fef3c7',
    color: '#92400e',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  scheduledBadge: {
    padding: '4px 12px',
    backgroundColor: '#fef3c7',
    color: '#92400e',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  activeBadge: {
    padding: '4px 12px',
    backgroundColor: '#dcfce7',
    color: '#166534',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  endedBadge: {
    padding: '4px 12px',
    backgroundColor: '#f3f4f6',
    color: '#4b5563',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  badgeContainer: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  startButton: {
    padding: '10px 20px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s ease-in-out',
  },
  disabledButton: {
    padding: '10px 20px',
    backgroundColor: '#9ca3af',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'not-allowed',
    fontSize: '14px',
    fontWeight: '500',
    opacity: 0.7,
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100px',
  },
  loadingText: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: '16px',
    fontStyle: 'italic',
  },
  errorContainer: {
    padding: '20px',
    backgroundColor: '#fef2f2',
    borderRadius: '8px',
    border: '1px solid #fecaca',
  },
  errorText: {
    color: '#dc2626',
    fontSize: '14px',
    margin: '0',
  },
  emptyContainer: {
    padding: '40px 20px',
    textAlign: 'center',
  },
  emptyMessage: {
    color: '#9ca3af',
    fontStyle: 'italic',
    fontSize: '16px',
    margin: '0',
  },
};

export default AssignmentAccess;
