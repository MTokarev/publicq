import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import { CONSTANTS } from '../constants/contstants';
import { UserCreateRequest } from "../models/userCreateRequest";
import { ResponseWithData } from "../models/responseWithData";
import { GenericOperationStatuses } from "../models/GenericOperationStatuses";
import { useAuth } from "../context/AuthContext";
import { userService } from "../services/userService";
import { configurationService } from "../services/configurationService";
import { PasswordPolicyOptions } from "../models/password-policy-options";
import { cn } from '../utils/cn';
import registerStyles from './Register.module.css';

const Register = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordPolicy, setPasswordPolicy] = useState<PasswordPolicyOptions | null>(null);
  const [policyLoading, setPolicyLoading] = useState(false);
  const [showPasswordInfo, setShowPasswordInfo] = useState(false);
  const [registrationEnabled, setRegistrationEnabled] = useState<boolean | null>(null);
  const [registrationLoading, setRegistrationLoading] = useState(true);
  const { saveToken } = useAuth()
  const emailInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on email input when component mounts and check registration status
  useEffect(() => {
    if (emailInputRef.current) {
      emailInputRef.current.focus();
    }
    checkRegistrationStatus();
  }, []);

  // Load password policy only when registration is enabled
  useEffect(() => {
    if (registrationEnabled === true) {
      loadPasswordPolicy();
    }
  }, [registrationEnabled]);

  const checkRegistrationStatus = async () => {
    setRegistrationLoading(true);
    try {
      const response = await configurationService.getSelfServiceRegistration();
      setRegistrationEnabled(response.data);
    } catch (err) {
      setRegistrationEnabled(false); // Default to disabled if we can't check
    } finally {
      setRegistrationLoading(false);
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
    // Check if any field has validation errors by using the existing getFieldError function
    // This prevents duplication of validation messages
    const hasEmailError = getFieldError('email');
    const hasFullNameError = getFieldError('fullName');
    const hasPasswordError = getFieldError('password');
    const hasConfirmPasswordError = getFieldError('confirmPassword');

    // Return true if any field has errors, false if all fields are valid
    return hasEmailError || hasFullNameError || hasPasswordError || hasConfirmPasswordError;
  };

  const getFieldError = (fieldName: string) => {
    if (!touched[fieldName]) return null;

    switch (fieldName) {
      case 'email':
        if (!username.trim()) return 'Email is required';
        if (!/\S+@\S+\.\S+/.test(username)) return 'Please enter a valid email address';
        break;
      case 'fullName':
        if (!fullName.trim()) return 'Full name is required';
        break;
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

  const handleRegister = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (isSubmitting) return; // Prevent double submission

    // Mark all fields as touched for validation display
    setTouched({
      email: true,
      fullName: true,
      dateOfBirth: true,
      password: true,
      confirmPassword: true,
    });

    const hasValidationErrors = validateForm();
    if (hasValidationErrors) {
      setErrors([]); // Clear any previous API errors, field errors will show under inputs
      setIsSubmitting(false); // Reset submitting state if validation fails
      return;
    }

    setErrors([]);
    setIsSubmitting(true);

    const registerData: UserCreateRequest = {
      email: username,
      fullName: fullName,
      password: password,
      ...(dateOfBirth && { dateOfBirth }),
    };

    try {
      const response = await userService.createUser(registerData);
      const token = response.accessToken;

      localStorage.setItem(CONSTANTS.TOKEN_VARIABLE_NAME, token);
      saveToken(token);
      
      // Redirect to home page after successful registration
      navigate('/');
    } catch (err: any) {
      const result = err.response?.data as ResponseWithData<string, GenericOperationStatuses> | undefined;
      if (result?.errors) {
        setErrors(result.errors);
      } else {
        setErrors(['Registration failed. Please try again.']);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [username, fullName, dateOfBirth, password, confirmPassword, isSubmitting, navigate]);

  // Handle Ctrl+Enter keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRegister();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleRegister]);

  return (
    <div className={registerStyles.container}>
      <div className={registerStyles.registerCard}>
        {registrationLoading ? (
          <div className={registerStyles.header}>
            <h1 className={registerStyles.title}>Create an Account</h1>
            <p className={registerStyles.subtitle}>Join PublicQ to create and manage assessment modules</p>
          </div>
        ) : registrationEnabled === false ? (
          <div className={registerStyles.header}>
            <h2 className={registerStyles.title}>Registration Currently Disabled</h2>
            <p className={registerStyles.subtitle}>
              Students will get IDs and instructions from platform managers. 
              If you need a user account to manage site content, please contact the administrator.
            </p>
          </div>
        ) : (
          <div className={registerStyles.header}>
            <h2 className={registerStyles.title}>Create Your Account</h2>
            <p className={registerStyles.subtitle}>Join PublicQ to create and manage assessment modules</p>
          </div>
        )}

        {registrationLoading ? (
          <div className={registerStyles.loadingContainer}>
            <div className={registerStyles.loadingSpinner}></div>
            <p className={registerStyles.loadingText}>Checking registration availability...</p>
          </div>
        ) : registrationEnabled === true ? (
          <>
            {errors.length > 0 && (
              <div className={registerStyles.errorContainer}>
                <ul className={registerStyles.errorList}>
                  {errors.map((error, index) => (
                    <li key={index} className={registerStyles.errorItem}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
            <form onSubmit={handleRegister} className={registerStyles.form}>
              <div className={registerStyles.inputGroup}>
                <input
                  ref={emailInputRef}
                  type="email"
                  placeholder="Email address"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className={cn(
                    registerStyles.input,
                    touched.email && getFieldError('email') && registerStyles['input--error']
                  )}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = touched.email && getFieldError('email') ? '#ef4444' : '#3b82f6';
                  }}
                  onBlur={(e) => {
                    handleFieldTouch('email');
                    e.currentTarget.style.borderColor = touched.email && getFieldError('email') ? '#ef4444' : '#d1d5db';
                  }}
                />
                {touched.email && getFieldError('email') && (
                  <div className={registerStyles.fieldError}>{getFieldError('email')}</div>
                )}
              </div>

              <div className={registerStyles.inputGroup}>
                <input
                  type="text"
                  placeholder="Full name"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className={cn(
                    registerStyles.input,
                    touched.fullName && getFieldError('fullName') && registerStyles['input--error']
                  )}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = touched.fullName && getFieldError('fullName') ? '#ef4444' : '#3b82f6';
                  }}
                  onBlur={(e) => {
                    handleFieldTouch('fullName');
                    e.currentTarget.style.borderColor = touched.fullName && getFieldError('fullName') ? '#ef4444' : '#d1d5db';
                  }}
                />
                {touched.fullName && getFieldError('fullName') && (
                  <div className={registerStyles.fieldError}>{getFieldError('fullName')}</div>
                )}
              </div>

              <div className={registerStyles.inputGroup}>
                <input
                  type="date"
                  placeholder="Date of Birth (optional)"
                  value={dateOfBirth}
                  onChange={e => setDateOfBirth(e.target.value)}
                  className={registerStyles.input}
                  style={{
                    color: dateOfBirth ? '#111827' : '#9ca3af',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#3b82f6';
                  }}
                  onBlur={(e) => {
                    handleFieldTouch('dateOfBirth');
                    e.currentTarget.style.borderColor = '#d1d5db';
                  }}
                />
                <div className={registerStyles.optionalFieldHint}>Date of Birth (optional)</div>
              </div>

              <div className={registerStyles.inputGroup}>
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value);
                    // Show password info when user starts typing
                    if (e.target.value.length > 0 && !showPasswordInfo) {
                      setShowPasswordInfo(true);
                    }
                  }}
                  className={cn(
                    registerStyles.input,
                    touched.password && getFieldError('password') && registerStyles['input--error']
                  )}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = touched.password && getFieldError('password') ? '#ef4444' : '#3b82f6';
                    // Also show password info when user focuses on password field
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
                  <div className={registerStyles.fieldError}>{getFieldError('password')}</div>
                )}
              </div>

              <div className={registerStyles.inputGroup}>
                <input
                  type="password"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className={cn(
                    registerStyles.input,
                    touched.confirmPassword && getFieldError('confirmPassword') && registerStyles['input--error']
                  )}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = touched.confirmPassword && getFieldError('confirmPassword') ? '#ef4444' : '#3b82f6';
                  }}
                  onBlur={(e) => {
                    handleFieldTouch('confirmPassword');
                    e.currentTarget.style.borderColor = touched.confirmPassword && getFieldError('confirmPassword') ? '#ef4444' : '#d1d5db';
                  }}
                />
                {touched.confirmPassword && getFieldError('confirmPassword') && (
                  <div className={registerStyles.fieldError}>{getFieldError('confirmPassword')}</div>
                )}
              </div>

          {/* Error Messages */}
          {errors.length > 0 && (
            <div className={registerStyles.errorContainer}>
              {errors.map((error, i) => (
                <div key={i} className={registerStyles.errorMessage}>{error}</div>
              ))}
            </div>
          )}

              {/* Password Policy Information - Only show when user starts typing password */}
              {showPasswordInfo && (
                <div className={registerStyles.passwordInfo}>
                  <h4 className={registerStyles.passwordInfoTitle}>Password Requirements:</h4>
                  {policyLoading ? (
                    <p className={registerStyles.loadingText}>Loading password requirements...</p>
                  ) : passwordPolicy ? (
                    <ul className={registerStyles.passwordInfoList}>
                      <li className={registerStyles.passwordInfoItem}>
                        Minimum length: <strong>{passwordPolicy.requiredLength} characters</strong>
                      </li>
                      {passwordPolicy.requireDigit && (
                        <li className={registerStyles.passwordInfoItem}>Must contain at least one digit (0-9)</li>
                      )}
                      {passwordPolicy.requireUppercase && (
                        <li className={registerStyles.passwordInfoItem}>Must contain at least one uppercase letter (A-Z)</li>
                      )}
                      {passwordPolicy.requireLowercase && (
                        <li className={registerStyles.passwordInfoItem}>Must contain at least one lowercase letter (a-z)</li>
                      )}
                      {passwordPolicy.requireNonAlphanumeric && (
                        <li className={registerStyles.passwordInfoItem}>Must contain at least one special character (!@#$%^&* etc.)</li>
                      )}
                    </ul>
                  ) : (
                    <p className={registerStyles.passwordInfoError}>Failed to load password requirements. Please ensure your password is at least 6 characters long.</p>
                  )}
                </div>
              )}

          <button
            type="submit"
            className={cn(registerStyles.submitButton, {
              [registerStyles.submitButtonDisabled]: isSubmitting
            })}
            disabled={isSubmitting}
            title="Press Ctrl+Enter to create account quickly"
          >
            {isSubmitting ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
      </>
        ) : null}

        <div className={registerStyles.loginLink}>
          Already have an account?{' '}
          <a href="/login" className={registerStyles.link}>Sign in here</a>
        </div>
      </div>
    </div>
  );
};

export default Register;