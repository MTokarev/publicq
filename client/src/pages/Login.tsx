import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { UserLoginRequest } from '../models/user-login-request';
import { userService } from '../services/userService';
import { cn } from '../utils/cn';
import loginStyles from './Login.module.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [touched, setTouched] = useState<{[key: string]: boolean}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgetPassword, setShowForgetPassword] = useState(false);
  const [forgetPasswordEmail, setForgetPasswordEmail] = useState('');
  const [forgetPasswordMessage, setForgetPasswordMessage] = useState('');
  const [isForgetPasswordSubmitting, setIsForgetPasswordSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const emailInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on email input when component mounts
  useEffect(() => {
    if (emailInputRef.current) {
      emailInputRef.current.focus();
    }
  }, []);

  const getFieldError = (fieldName: string) => {
    if (!touched[fieldName]) return null;
    
    switch (fieldName) {
      case 'email':
        if (!username.trim()) return 'Email is required';
        if (!/\S+@\S+\.\S+/.test(username)) return 'Please enter a valid email address';
        break;
      case 'password':
        if (!password.trim()) return 'Password is required';
        break;
    }
    return null;
  };

  const handleFieldTouch = (fieldName: string) => {
    setTouched({ ...touched, [fieldName]: true });
  };

  const handleLogin = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (isSubmitting) return; // Prevent double submission
    
    setError('');

    // Mark all fields as touched for validation display
    setTouched({
      email: true,
      password: true,
    });

    // Basic validation
    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(username)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);

    const loginData: UserLoginRequest = {
      email: username,
      password,
    };

    try {
      await login(loginData);
      navigate('/', { replace: true });
    } catch (err: any) {
      setError('Login failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  }, [username, password, isSubmitting, login, navigate]);

  const handleForgetPassword = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isForgetPasswordSubmitting) return;
    
    setError('');
    setForgetPasswordMessage('');

    if (!forgetPasswordEmail.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(forgetPasswordEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsForgetPasswordSubmitting(true);

    try {
      await userService.forgetPassword(forgetPasswordEmail);
      setForgetPasswordMessage('If the email is registered, a password reset link has been sent to your email address.');
      setError('');
    } catch (err: any) {
      setError('Failed to send reset link: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsForgetPasswordSubmitting(false);
    }
  }, [forgetPasswordEmail, isForgetPasswordSubmitting]);

  const handleBackToLogin = () => {
    setShowForgetPassword(false);
    setForgetPasswordEmail('');
    setForgetPasswordMessage('');
    setError('');
  };

  // Handle Ctrl+Enter keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleLogin();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleLogin]);

  return (
    <div className={loginStyles.container}>
      <div className={loginStyles.loginCard}>
        <div className={loginStyles.header}>
          <h2 className={loginStyles.title}>{showForgetPassword ? 'Reset Password' : 'Welcome Back'}</h2>
          <p className={loginStyles.subtitle}>
            {showForgetPassword 
              ? 'Enter your email to receive a password reset link' 
              : 'Sign in to access your assessment modules'
            }
          </p>
        </div>

        {!showForgetPassword ? (
          <form onSubmit={handleLogin} className={loginStyles.form}>
            <div className={loginStyles.inputGroup}>
              <input
                ref={emailInputRef}
                type="email"
                placeholder="Email address"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={cn(
                  loginStyles.input,
                  touched.email && getFieldError('email') && loginStyles['input--error']
                )}
                onBlur={() => handleFieldTouch('email')}
              />
              {touched.email && getFieldError('email') && (
                <div className={loginStyles.errorMessage}>{getFieldError('email')}</div>
              )}
            </div>

            <div className={loginStyles.inputGroup}>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={cn(
                  loginStyles.input,
                  touched.password && getFieldError('password') && loginStyles['input--error']
                )}
                onBlur={() => handleFieldTouch('password')}
              />
              {touched.password && getFieldError('password') && (
                <div className={loginStyles.errorMessage}>{getFieldError('password')}</div>
              )}
            </div>

            <div className={loginStyles.forgotPassword}>
              <button
                type="button"
                onClick={() => setShowForgetPassword(true)}
                className={loginStyles.forgotPasswordLink}
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                loginStyles.submitButton,
                isSubmitting && loginStyles['submitButton--loading']
              )}
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleForgetPassword} className={loginStyles.form}>
            <div className={loginStyles.inputGroup}>
              <input
                type="email"
                placeholder="Email address"
                value={forgetPasswordEmail}
                onChange={(e) => setForgetPasswordEmail(e.target.value)}
                className={loginStyles.input}
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={isForgetPasswordSubmitting}
              className={cn(
                loginStyles.submitButton,
                isForgetPasswordSubmitting && loginStyles['submitButton--loading']
              )}
            >
              {isForgetPasswordSubmitting ? 'Sending...' : 'Send Reset Link'}
            </button>
            <button
              type="button"
              onClick={handleBackToLogin}
              className={loginStyles.backButton}
            >
              ← Back to sign in
            </button>
          </form>
        )}

        {error && (
          <div className={loginStyles.errorMessage}>
            {error}
          </div>
        )}

        {forgetPasswordMessage && (
          <div className={loginStyles.successMessage}>
            {forgetPasswordMessage}
          </div>
        )}

        <div className={loginStyles.registerLink}>
          <p className={loginStyles.registerLinkText}>Don't have an account?</p>
          <a href="/register" className={loginStyles.registerLinkButton}>Create one here</a>
        </div>
      </div>
    </div>
  );
};

export default Login;