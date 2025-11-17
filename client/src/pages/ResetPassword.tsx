import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { userService } from '../services/userService';
import { configurationService } from '../services/configurationService';
import { ResetPasswordRequest } from '../models/reset-password-request';
import { PasswordPolicyOptions } from '../models/password-policy-options';
import { GenericOperationStatuses } from '../models/GenericOperationStatuses';
import { ResponseWithData } from '../models/responseWithData';
import { useAuth } from '../context/AuthContext';
import { CONSTANTS } from '../constants/contstants';

// Add spinner animation styles
const spinnerStyles = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// Inject styles into the document head
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = spinnerStyles;
  document.head.appendChild(styleSheet);
}

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordPolicy, setPasswordPolicy] = useState<PasswordPolicyOptions | null>(null);
  const [policyLoading, setPolicyLoading] = useState(false);
  const [showPasswordInfo, setShowPasswordInfo] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [isValidLink, setIsValidLink] = useState(true);
  const [isCheckingToken, setIsCheckingToken] = useState(true);
  const [isResendingLink, setIsResendingLink] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { saveToken } = useAuth();
  const passwordInputRef = useRef<HTMLInputElement>(null);

  // Extract email and token from URL parameters and validate token
  useEffect(() => {
    const emailParam = searchParams.get('email');
    const tokenParam = searchParams.get('token');
    
    if (!emailParam || !tokenParam) {
      setIsValidLink(false);
      setIsCheckingToken(false);
      setErrors(['Invalid password link. Please request a new password creation link.']);
      return;
    }
    
    setEmail(emailParam);
    setToken(tokenParam);
    
    // Validate the token before showing the form
    validateResetToken(emailParam, tokenParam);
    
    loadPasswordPolicy();
  }, [searchParams]);

  const validateResetToken = async (email: string, token: string) => {
    setIsCheckingToken(true);
    try {
      const response = await userService.checkResetToken({ email, token });
      
      // Parse the status string to enum for cleaner comparison
      const status = response.status as GenericOperationStatuses;
      
      if (status === GenericOperationStatuses.Completed) {
        setIsValidLink(true);
        // Auto-focus on password input when token is valid
        setTimeout(() => {
          if (passwordInputRef.current) {
            passwordInputRef.current.focus();
          }
        }, 100);
      } else {
        setIsValidLink(false);
        setErrors(['This password creation link has expired or has already been used. Please request a new password creation link.']);
      }
    } catch (err: any) {
      setIsValidLink(false);
      if (err.response?.status === 400) {
        setErrors(['This password creation link has expired or has already been used. Please request a new password creation link.']);
      } else {
        setErrors(['Unable to validate reset link. Please try again or request a new password reset link.']);
      }
    } finally {
      setIsCheckingToken(false);
    }
  };

  const loadPasswordPolicy = async () => {
    setPolicyLoading(true);
    try {
      const response = await configurationService.getPasswordPolicy();
      setPasswordPolicy(response.data);
    } catch (err) {
      // Set default policy if loading fails
      setPasswordPolicy({
        requiredLength: 6,
        requireDigit: false,
        requireUppercase: false,
        requireLowercase: false,
        requireNonAlphanumeric: false
      });
    } finally {
      setPolicyLoading(false);
    }
  };

  const validateForm = () => {
    const hasPasswordError = getFieldError('password');
    const hasConfirmPasswordError = getFieldError('confirmPassword');
    return hasPasswordError || hasConfirmPasswordError;
  };

  const getFieldError = (fieldName: string) => {
    if (!touched[fieldName]) return null;

    switch (fieldName) {
      case 'password':
        if (!password.trim()) return 'Password is required';
        if (passwordPolicy) {
          if (password.length < passwordPolicy.requiredLength) {
            return `Password must be at least ${passwordPolicy.requiredLength} characters long`;
          }
          if (passwordPolicy.requireDigit && !/\d/.test(password)) {
            return 'Password must contain at least one digit (0-9)';
          }
          if (passwordPolicy.requireUppercase && !/[A-Z]/.test(password)) {
            return 'Password must contain at least one uppercase letter (A-Z)';
          }
          if (passwordPolicy.requireLowercase && !/[a-z]/.test(password)) {
            return 'Password must contain at least one lowercase letter (a-z)';
          }
          if (passwordPolicy.requireNonAlphanumeric && !/[^A-Za-z0-9]/.test(password)) {
            return 'Password must contain at least one special character (!@#$%^&* etc.)';
          }
        } else if (password.length < 6) {
          return 'Password must be at least 6 characters long';
        }
        break;
      case 'confirmPassword':
        if (!confirmPassword.trim()) return 'Please confirm your password';
        if (password !== confirmPassword) return 'Passwords do not match';
        break;
    }
    return null;
  };

  const handleFieldTouch = (fieldName: string) => {
    setTouched({ ...touched, [fieldName]: true });
  };

  const handleResetPassword = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting || !isValidLink) return;
    
    // Mark all fields as touched for validation display
    setTouched({
      password: true,
      confirmPassword: true,
    });

    const hasValidationErrors = validateForm();
    if (hasValidationErrors) {
      setErrors([]);
      return;
    }

    setErrors([]);
    setIsSubmitting(true);

    const resetData: ResetPasswordRequest = {
      email: email,
      token: token,
      newPassword: password,
    };

    try {
      const response = await userService.resetPassword(resetData);
      
      // If successful, save the token and redirect
      if (response.data && response.status === GenericOperationStatuses.Completed) {
        const accessToken = response.data;
        localStorage.setItem(CONSTANTS.TOKEN_VARIABLE_NAME, accessToken);
        saveToken(accessToken);
        
        setSuccessMessage('New password has been set! You are now logged in.');
        
        // Redirect to home page after a short delay
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 2000);
      } else {
        setErrors(['Password reset failed. Please try again.']);
      }
    } catch (err: any) {
      const result = err.response?.data as ResponseWithData<string, GenericOperationStatuses> | undefined;
      if (result?.errors) {
        setErrors(result.errors);
      } else if (err.response?.status === 400) {
        setErrors(['Invalid or expired reset link. Please request a new password reset link.']);
      } else {
        setErrors(['Password reset failed. Please try again.']);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [password, confirmPassword, email, token, isSubmitting, isValidLink, navigate, saveToken]);

  const handleBackToLogin = () => {
    navigate('/login');
  };

  const handleResendResetLink = async () => {
    if (isResendingLink || !email) return;
    
    setIsResendingLink(true);
    setResendMessage('');
    
    try {
      await userService.forgetPassword(email);
      setResendMessage('A new password create link has been sent to your email address.');
    } catch (err: any) {
      setResendMessage('Failed to send reset link. Please try again or contact support.');
    } finally {
      setIsResendingLink(false);
    }
  };

  // Show loading state while checking token
  if (isCheckingToken) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2 style={styles.title}>Validating Reset Link</h2>
          <p style={styles.subtitle}>Please wait while we verify your password reset link...</p>
          
          <div style={styles.loadingContainer}>
            <div style={styles.loadingSpinner}></div>
            <div style={styles.loadingMessage}>Checking token validity...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!isValidLink) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2 style={styles.title}>Invalid Password Link</h2>
          <p style={styles.subtitle}>This password creation link is invalid, expired, or has already been used.</p>
          
          <div style={styles.errorContainer}>
            {errors.map((error, i) => (
              <div key={i} style={styles.errorMessage}>{error}</div>
            ))}
          </div>

          {resendMessage && (
            <div style={resendMessage.includes('Failed') ? styles.errorContainer : styles.successContainer}>
              <div style={resendMessage.includes('Failed') ? styles.errorMessage : styles.successMessage}>
                {resendMessage}
              </div>
            </div>
          )}

          <div style={styles.buttonGroup}>
            {email && (
              <button
                type="button"
                onClick={handleResendResetLink}
                disabled={isResendingLink}
                style={styles.primaryButton}
                onMouseEnter={(e) => {
                  if (!isResendingLink) {
                    e.currentTarget.style.backgroundColor = '#1e40af';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isResendingLink) {
                    e.currentTarget.style.backgroundColor = '#3b82f6';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                {isResendingLink ? 'Sending...' : 'Resend Link'}
              </button>
            )}
            
            <button
              type="button"
              onClick={handleBackToLogin}
              style={styles.secondaryButton}
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (successMessage) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2 style={styles.title}>New Password has been set!</h2>
          <p style={styles.subtitle}>Your password has been updated successfully.</p>
          
          <div style={styles.successContainer}>
            <div style={styles.successMessage}>{successMessage}</div>
          </div>
          
          <div style={styles.loginInfo}>
            Redirecting you to the dashboard...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Create a new password</h2>
        <p style={styles.subtitle}>Enter your new password for {email}</p>

        <form onSubmit={handleResetPassword} style={styles.form}>
          <div style={styles.inputGroup}>
            <input
              ref={passwordInputRef}
              type="password"
              placeholder="New password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (e.target.value.length > 0 && !showPasswordInfo) {
                  setShowPasswordInfo(true);
                }
              }}
              style={{
                ...styles.input,
                borderColor: touched.password && getFieldError('password') ? '#ef4444' : '#d1d5db',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = touched.password && getFieldError('password') ? '#ef4444' : '#3b82f6';
                if (password.length > 0 || !showPasswordInfo) {
                  setShowPasswordInfo(true);
                }
              }}
              onBlur={(e) => {
                handleFieldTouch('password');
                e.currentTarget.style.borderColor = touched.password && getFieldError('password') ? '#ef4444' : '#d1d5db';
              }}
            />
            {touched.password && getFieldError('password') && (
              <div style={styles.fieldError}>{getFieldError('password')}</div>
            )}
          </div>

          <div style={styles.inputGroup}>
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{
                ...styles.input,
                borderColor: touched.confirmPassword && getFieldError('confirmPassword') ? '#ef4444' : '#d1d5db',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = touched.confirmPassword && getFieldError('confirmPassword') ? '#ef4444' : '#3b82f6';
              }}
              onBlur={(e) => {
                handleFieldTouch('confirmPassword');
                e.currentTarget.style.borderColor = touched.confirmPassword && getFieldError('confirmPassword') ? '#ef4444' : '#d1d5db';
              }}
            />
            {touched.confirmPassword && getFieldError('confirmPassword') && (
              <div style={styles.fieldError}>{getFieldError('confirmPassword')}</div>
            )}
          </div>

          {/* Error Messages */}
          {errors.length > 0 && (
            <div style={styles.errorContainer}>
              {errors.map((error, i) => (
                <div key={i} style={styles.errorMessage}>{error}</div>
              ))}
            </div>
          )}

          {/* Password Policy Information */}
          {showPasswordInfo && (
            <div style={styles.passwordPolicyInfo}>
              <h4 style={styles.policyInfoTitle}>Password Requirements:</h4>
              {policyLoading ? (
                <p style={styles.policyInfoLoading}>Loading password requirements...</p>
              ) : passwordPolicy ? (
                <ul style={styles.policyInfoList}>
                  <li style={styles.policyInfoItem}>
                    Minimum length: <strong>{passwordPolicy.requiredLength} characters</strong>
                  </li>
                  {passwordPolicy.requireDigit && (
                    <li style={styles.policyInfoItem}>Must contain at least one digit (0-9)</li>
                  )}
                  {passwordPolicy.requireUppercase && (
                    <li style={styles.policyInfoItem}>Must contain at least one uppercase letter (A-Z)</li>
                  )}
                  {passwordPolicy.requireLowercase && (
                    <li style={styles.policyInfoItem}>Must contain at least one lowercase letter (a-z)</li>
                  )}
                  {passwordPolicy.requireNonAlphanumeric && (
                    <li style={styles.policyInfoItem}>Must contain at least one special character (!@#$%^&* etc.)</li>
                  )}
                </ul>
              ) : (
                <p style={styles.policyInfoError}>Failed to load password requirements. Please ensure your password is at least 6 characters long.</p>
              )}
            </div>
          )}

          <button
            type="submit"
            style={styles.button}
            disabled={isSubmitting}
            onMouseEnter={(e) => {
              if (!isSubmitting) {
                e.currentTarget.style.backgroundColor = '#1e40af';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSubmitting) {
                e.currentTarget.style.backgroundColor = '#3b82f6';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            {isSubmitting ? 'Creating Password...' : 'Create Password'}
          </button>

          <button
            type="button"
            onClick={handleBackToLogin}
            style={styles.backButton}
          >
            Back to Login
          </button>
        </form>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: 'calc(100vh - 80px)',
    background: 'linear-gradient(135deg, #f9fafb 0%, #e5e7eb 100%)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '2rem 1rem',
  },
  card: {
    width: '100%',
    maxWidth: '450px',
    padding: '2.5rem',
    borderRadius: '16px',
    backgroundColor: '#ffffff',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.8)',
  },
  title: {
    fontSize: '1.875rem',
    fontWeight: 700,
    textAlign: 'center' as const,
    marginBottom: '0.5rem',
    color: '#111827',
    background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    letterSpacing: '-0.025em',
  },
  subtitle: {
    fontSize: '0.875rem',
    color: '#6b7280',
    textAlign: 'center' as const,
    marginBottom: '2rem',
    lineHeight: '1.5',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1.5rem',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '0.875rem',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    backgroundColor: '#ffffff',
    boxSizing: 'border-box' as const,
    transition: 'all 0.2s ease-in-out',
    outline: 'none',
  },
  fieldError: {
    fontSize: '0.75rem',
    color: '#ef4444',
    fontWeight: '400',
  },
  button: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '1rem',
    fontWeight: 600,
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)',
    marginTop: '0.5rem',
  },
  backButton: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '1rem',
    fontWeight: 600,
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    backgroundColor: '#ffffff',
    color: '#374151',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    marginTop: '0.5rem',
  },
  errorContainer: {
    marginTop: '1.5rem',
    padding: '1rem',
    backgroundColor: '#fef2f2',
    borderRadius: '8px',
    border: '1px solid #fecaca',
  },
  errorMessage: {
    fontSize: '0.875rem',
    color: '#dc2626',
    marginBottom: '0.25rem',
  },
  successContainer: {
    marginTop: '1.5rem',
    padding: '1rem',
    backgroundColor: '#f0fdf4',
    borderRadius: '8px',
    border: '1px solid #bbf7d0',
  },
  successMessage: {
    fontSize: '0.875rem',
    color: '#16a34a',
  },
  loginInfo: {
    textAlign: 'center' as const,
    marginTop: '1rem',
    fontSize: '0.875rem',
    color: '#6b7280',
    fontStyle: 'italic' as const,
  },
  passwordPolicyInfo: {
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '14px 16px',
    marginTop: '6px',
    marginBottom: '4px',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    transition: 'all 0.2s ease-in-out',
  },
  policyInfoTitle: {
    fontSize: '0.8125rem',
    fontWeight: 600,
    color: '#374151',
    margin: '0 0 10px 0',
    letterSpacing: '-0.01em',
  },
  policyInfoList: {
    fontSize: '0.75rem',
    color: '#6b7280',
    margin: '0',
    paddingLeft: '18px',
    lineHeight: '1.5',
    listStyleType: 'disc',
  },
  policyInfoItem: {
    marginBottom: '5px',
    paddingLeft: '4px',
  },
  policyInfoLoading: {
    fontSize: '0.75rem',
    color: '#9ca3af',
    margin: '0',
    fontStyle: 'italic' as const,
    textAlign: 'center' as const,
  },
  policyInfoError: {
    fontSize: '0.75rem',
    color: '#ef4444',
    margin: '0',
    fontStyle: 'italic' as const,
    textAlign: 'center' as const,
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '1rem',
    padding: '2rem 0',
  },
  loadingSpinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #e5e7eb',
    borderTop: '3px solid #3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingMessage: {
    fontSize: '0.875rem',
    color: '#6b7280',
    textAlign: 'center' as const,
  },
  buttonGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.75rem',
    marginTop: '1.5rem',
  },
  primaryButton: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '1rem',
    fontWeight: 600,
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)',
  },
  secondaryButton: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '1rem',
    fontWeight: 600,
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    backgroundColor: '#ffffff',
    color: '#374151',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
  },
};

export default ResetPassword;
