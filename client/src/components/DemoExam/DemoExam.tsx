import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Questions from '../Questions/Questions';
import { DEMO_MODULE, DEMO_ASSIGNMENT, DEMO_USER, DEMO_CORRECT_ANSWERS } from './mockDemoData';
import { ModuleProgress } from '../../models/module-progress';
import { ROUTES } from '../../constants/contstants';
import styles from './DemoExam.module.css';

/**
 * DemoExam Component
 * 
 * Wraps the Questions component to provide a demo experience without backend calls.
 * - Uses mock data from mockDemoData.ts
 * - Stores answers in localStorage
 * - Calculates score client-side
 * - Shows demo banner and results
 */

const DEMO_STORAGE_KEY = 'publicq_demo_state';

interface DemoState {
  isComplete: boolean;
  score: number | null;
  correctCount: number;
  totalQuestions: number;
  timeSpent: number;
  completedAt: string | null;
}

export const DemoExam: React.FC = () => {
  const navigate = useNavigate();
  const [demoState, setDemoState] = useState<DemoState>(() => {
    const stored = localStorage.getItem(DEMO_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {
      isComplete: false,
      score: null,
      correctCount: 0,
      totalQuestions: DEMO_MODULE.questions.length,
      timeSpent: 0,
      completedAt: null
    };
  });

  const [showStartScreen, setShowStartScreen] = useState(!demoState.isComplete);
  const [demoStartTime] = useState(new Date().toISOString());

  const handleStartDemo = () => {
    // Reset demo state
    const freshState: DemoState = {
      isComplete: false,
      score: null,
      correctCount: 0,
      totalQuestions: DEMO_MODULE.questions.length,
      timeSpent: 0,
      completedAt: null
    };
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(freshState));
    localStorage.removeItem('demo_user_answers'); // Clear previous answers
    setDemoState(freshState);
    setShowStartScreen(false);
  };

  const handleRetakeDemo = () => {
    handleStartDemo();
  };

  const handleExit = useCallback(() => {
    localStorage.removeItem('demo_user_answers');
    navigate(ROUTES.HOME);
  }, [navigate]);

  // Calculate score when demo is complete
  const calculateDemoScore = useCallback(() => {
    // Get user answers from localStorage (stored by Questions component)
    const userAnswers = JSON.parse(localStorage.getItem('demo_user_answers') || '{}');
    
    let correctCount = 0;
    Object.keys(DEMO_CORRECT_ANSWERS).forEach(questionId => {
      const correctAnswers = DEMO_CORRECT_ANSWERS[questionId].sort();
      const userAnswer = (userAnswers[questionId] || []).sort();
      
      if (JSON.stringify(correctAnswers) === JSON.stringify(userAnswer)) {
        correctCount++;
      }
    });

    const score = Math.round((correctCount / DEMO_MODULE.questions.length) * 100);

    const completedState: DemoState = {
      isComplete: true,
      score,
      correctCount,
      totalQuestions: DEMO_MODULE.questions.length,
      timeSpent: Math.floor((Date.now() - Date.parse(demoStartTime)) / 60000),
      completedAt: new Date().toISOString()
    };

    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(completedState));
    setDemoState(completedState);
    setShowStartScreen(false); // This will trigger showing results screen
  }, [demoStartTime]);

  if (showStartScreen) {
    return (
      <div className={styles.startScreen}>
        <div className={styles.startCard}>
          <div className={styles.demoBadge}>
            <img src="/images/icons/student.svg" alt="" style={{width: '16px', height: '16px', marginRight: '6px'}} /> Demo Mode
          </div>
          
          <h1 className={styles.title}>Professional Skills Demo Assessment</h1>
          
          <p className={styles.description}>
            Experience our assessment platform with this comprehensive demo. Test your logical reasoning, 
            language skills, and general knowledge through 10 carefully crafted questions.
          </p>

          <div className={styles.features}>
            <div className={styles.feature}>
              <span className={styles.featureIcon}><img src="/images/icons/chart.svg" alt="" style={{width: '24px', height: '24px'}} /></span>
              <div>
                <strong>10 Questions</strong>
                <p>Covering logic, language, and general knowledge</p>
              </div>
            </div>
            
            <div className={styles.feature}>
              <span className={styles.featureIcon}><img src="/images/icons/time.svg" alt="" style={{width: '24px', height: '24px'}} /></span>
              <div>
                <strong>20 Minutes</strong>
                <p>Time limit to complete the assessment</p>
              </div>
            </div>
            
            <div className={styles.feature}>
              <span className={styles.featureIcon}><img src="/images/icons/target.svg" alt="" style={{width: '24px', height: '24px'}} /></span>
              <div>
                <strong>Instant Results</strong>
                <p>Get your score immediately after submission</p>
              </div>
            </div>
            
            <div className={styles.feature}>
              <span className={styles.featureIcon}><img src="/images/icons/again.svg" alt="" style={{width: '24px', height: '24px'}} /></span>
              <div>
                <strong>Retake Anytime</strong>
                <p>Your answers are not saved - practice freely</p>
              </div>
            </div>
          </div>

          <div className={styles.info}>
            <p style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                <img src="/images/icons/warning.svg" alt="" style={{width: '16px', height: '16px'}} />
                <strong>Note:</strong>
              </span>
              <span>This is a demonstration. Your answers are stored only in your browser and are not sent to any server. Feel free to retake this assessment as many times as you like!</span>
            </p>
          </div>

          <div className={styles.navigationTips}>
            <h3 className={styles.tipsTitle}><img src="/images/icons/navigation.svg" alt="" style={{width: '18px', height: '18px', marginRight: '6px'}} /> Navigation Tips</h3>
            <ul className={styles.tipsList}>
              <li>Use the "Go to" field to jump directly to any question number</li>
              <li>
                <div>Progress bar at the top shows color-coded status for each question:</div>
                <div style={{ marginTop: '8px', marginLeft: '0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '24px', height: '10px', backgroundColor: '#22c55e', borderRadius: '2px', flexShrink: 0 }}></div>
                    <span style={{ fontSize: '14px' }}>Green = Answered</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '24px', height: '10px', backgroundColor: '#f59e0b', borderRadius: '2px', cursor: 'pointer', flexShrink: 0 }}></div>
                    <span style={{ fontSize: '14px' }}>Orange = Skipped (clickable to return)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '24px', height: '10px', backgroundColor: '#3b82f6', borderRadius: '2px', flexShrink: 0 }}></div>
                    <span style={{ fontSize: '14px' }}>Blue = Current question</span>
                  </div>
                </div>
              </li>
              <li>When submitting, you'll see clickable badges like <span style={{ display: 'inline-block', padding: '3px 10px', backgroundColor: '#f59e0b', color: 'white', borderRadius: '4px', fontSize: '12px', fontWeight: '500', marginLeft: '4px', verticalAlign: 'middle' }}>Question 5 →</span> for any unanswered questions</li>
            </ul>
          </div>

          {demoState.isComplete && (
            <div className={styles.previousScore}>
              <h3>Your Previous Score:</h3>
              <div className={styles.scoreDisplay}>
                <span className={styles.scoreLarge}>{demoState.score}%</span>
                <span className={styles.scoreDetails}>
                  {demoState.correctCount} out of {demoState.totalQuestions} correct
                </span>
              </div>
            </div>
          )}

          <div className={styles.actions}>
            <button 
              onClick={handleStartDemo} 
              className={styles.startButton}
            >
              <img src="/images/icons/rocket.svg" alt="" style={{width: '18px', height: '18px', marginRight: '8px'}} />
              {demoState.isComplete ? 'Retake Assessment' : 'Start Assessment'}
            </button>
            
            <button 
              onClick={handleExit} 
              className={styles.exitButton}
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If demo is complete and user is viewing results
  if (demoState.isComplete) {
    const isPassed = (demoState.score || 0) >= DEMO_MODULE.passingScorePercentage;
    
    return (
      <div className={styles.resultsScreen}>
        <div className={styles.resultsCard}>
          <div className={styles.demoBadge}>
            <img src="/images/icons/student.svg" alt="" style={{width: '16px', height: '16px', marginRight: '6px'}} /> Demo Mode
          </div>
          
          <div className={isPassed ? styles.passedIcon : styles.failedIcon}>
            {isPassed ? <img src="/images/icons/check.svg" alt="Passed" style={{width: '48px', height: '48px'}} /> : <img src="/images/icons/fail.svg" alt="Failed" style={{width: '48px', height: '48px'}} />}
          </div>
          
          <h1 className={styles.resultsTitle}>
            {isPassed ? 'Congratulations!' : 'Assessment Complete'}
          </h1>
          
          <p className={styles.resultsSubtitle}>
            {isPassed 
              ? `You passed with a score of ${demoState.score}%!` 
              : `You scored ${demoState.score}%. Passing score is ${DEMO_MODULE.passingScorePercentage}%.`
            }
          </p>

          <div className={styles.resultsStats}>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{demoState.score}%</span>
              <span className={styles.statLabel}>Final Score</span>
            </div>
            
            <div className={styles.statCard}>
              <span className={styles.statValue}>{demoState.correctCount}/{demoState.totalQuestions}</span>
              <span className={styles.statLabel}>Correct Answers</span>
            </div>
            
            <div className={styles.statCard}>
              <span className={styles.statValue}>{demoState.timeSpent} min</span>
              <span className={styles.statLabel}>Time Spent</span>
            </div>
          </div>

          <div className={styles.resultsInfo}>
            <p>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <img src="/images/icons/light-bulb.svg" alt="" style={{width: '16px', height: '16px', flexShrink: 0}} />
                <strong>This was a demo assessment.</strong>
              </span>
              Your answers and results are stored only in your browser. In the real platform, instructors can track progress, generate reports, and analyze detailed performance metrics.
            </p>
          </div>

          <div className={styles.actions}>
            <button 
              onClick={handleRetakeDemo} 
              className={styles.retakeButton}
            >
              <img src="/images/icons/rocket.svg" alt="" style={{width: '18px', height: '18px', marginRight: '8px'}} />
              Retake Assessment
            </button>
            
            <button 
              onClick={handleExit} 
              className={styles.exitButton}
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render the Questions component with mock data in demo mode
  return (
    <Questions 
      demoMode={true}
      demoModuleVersion={DEMO_MODULE}
      onDemoComplete={calculateDemoScore}
      onDemoExit={handleExit}
    />
  );
};

export default DemoExam;
