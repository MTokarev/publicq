import React, { useEffect, useState, useRef } from 'react';
import { User } from '../../models/user';
import { userService } from '../../services/userService';
import { UserCreateByAdminRequest } from '../../models/userCreateByAdminRequest';
import { ExamTakerCreateRequest } from '../../models/exam-taker-create-request';
import { UserRoleAssignmentRequest } from '../../models/user-role-assignment-request';
import { UserRole } from '../../models/UserRole';
import UserTable from '../Shared/UserTable';
import { configurationService } from '../../services/configurationService';
import { PasswordPolicyOptions } from '../../models/password-policy-options';
import { ExamTakerImport } from '../../models/exam-taker-import';
import { VALIDATION_CONSTRAINTS } from '../../constants/contstants';
import userManagementStyles from './UserManagement.module.css';

// Utility function for conditional class names
const cn = (...classes: (string | undefined | false)[]): string => 
  classes.filter(Boolean).join(' ');

// Extend User interface for role management - roles fetched via getUserRoles API
interface UserWithRoles extends User {
  roles?: UserRole[];
}

interface CreateUserModalProps {
  isOpen: boolean;
  loading?: boolean;
  error?: string;
  onConfirm: (request: UserCreateByAdminRequest | ExamTakerCreateRequest, isExamTaker: boolean) => void;
  onCancel: () => void;
}

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  userEmail: string;
  userId: string;
  onConfirm: () => void;
  onCancel: () => void;
}

interface ResetPasswordModalProps {
  isOpen: boolean;
  userEmail: string;
  onConfirm: (password: string) => void;
  onCancel: () => void;
}

interface RoleManagementModalProps {
  isOpen: boolean;
  user: UserWithRoles | null;
  currentUserRoles: UserRole[];
  onAssignRole: (role: UserRole) => void;
  onUnassignRole: (role: UserRole) => void;
  onCancel: () => void;
}

const generateDefaultPassword = (): string => {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const special = '!@#$%*';
  
  // Ensure at least one character from each category
  let password = '';
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];
  
  // Fill remaining 4 characters randomly
  const allChars = lowercase + uppercase + numbers + special;
  for (let i = 4; i < 8; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

const CreateUserModal = ({ isOpen, loading = false, error, onConfirm, onCancel }: CreateUserModalProps) => {
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    password: '',
    id: '',
    dateOfBirth: '',
  });
  const [isExamTaker, setIsExamTaker] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [emailEnabled, setEmailEnabled] = useState<boolean | null>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        email: '',
        fullName: '',
        password: '',
        id: '',
        dateOfBirth: '',
      });
      setIsExamTaker(false);
      setValidationError('');
      
      // Check email configuration when modal opens
      checkEmailConfiguration();
      
      // Auto-focus on email input when modal opens
      setTimeout(() => {
        if (emailInputRef.current) {
          emailInputRef.current.focus();
        }
      }, 100); // Small delay to ensure modal is rendered
    }
  }, [isOpen]);

  const checkEmailConfiguration = async () => {
    try {
      const emailOptions = await configurationService.getEmailOptions();
      const isEmailEnabled = emailOptions.enabled || false;
      setEmailEnabled(isEmailEnabled);
      
      // If email is disabled and password is empty, generate a default password
      if (!isEmailEnabled && !formData.password) {
        const newPassword = generateDefaultPassword();
        setFormData(prev => ({
          ...prev,
          password: newPassword,
        }));
      }
    } catch (error) {
      setEmailEnabled(false);
      
      // If we can't check email config, assume it's disabled and generate password
      if (!formData.password) {
        const newPassword = generateDefaultPassword();
        setFormData(prev => ({
          ...prev,
          password: newPassword,
        }));
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen) {
        if (e.key === 'Escape') {
          e.preventDefault();
          onCancel();
        } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          e.preventDefault();
          handleConfirm();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, formData, isExamTaker]);

  const validateForm = (): boolean => {
    // For regular users, email is required
    if (!isExamTaker) {
      if (!formData.email.trim()) {
        setValidationError('Email is required');
        return false;
      }
      if (!formData.email.includes('@')) {
        setValidationError('Please enter a valid email address');
        return false;
      }
      if (formData.email.length > VALIDATION_CONSTRAINTS.USER.EMAIL_MAX_LENGTH) {
        setValidationError(`Email must not exceed ${VALIDATION_CONSTRAINTS.USER.EMAIL_MAX_LENGTH} characters`);
        return false;
      }
    } else {
      // For exam takers, validate email format only if provided
      if (formData.email.trim() && !formData.email.includes('@')) {
        setValidationError('Please enter a valid email address');
        return false;
      }
      if (formData.email.length > VALIDATION_CONSTRAINTS.EXAM_TAKER.EMAIL_MAX_LENGTH) {
        setValidationError(`Email must not exceed ${VALIDATION_CONSTRAINTS.EXAM_TAKER.EMAIL_MAX_LENGTH} characters`);
        return false;
      }
    }
    
    if (!formData.fullName.trim()) {
      setValidationError('Full name is required');
      return false;
    }
    if (formData.fullName.length > (isExamTaker ? VALIDATION_CONSTRAINTS.EXAM_TAKER.NAME_MAX_LENGTH : VALIDATION_CONSTRAINTS.USER.FULL_NAME_MAX_LENGTH)) {
      setValidationError(`Full name must not exceed ${isExamTaker ? VALIDATION_CONSTRAINTS.EXAM_TAKER.NAME_MAX_LENGTH : VALIDATION_CONSTRAINTS.USER.FULL_NAME_MAX_LENGTH} characters`);
      return false;
    }
    
    // For exam takers, validate ID if provided
    if (isExamTaker && formData.id && formData.id.length > VALIDATION_CONSTRAINTS.EXAM_TAKER.ID_MAX_LENGTH) {
      setValidationError(`ID must not exceed ${VALIDATION_CONSTRAINTS.EXAM_TAKER.ID_MAX_LENGTH} characters`);
      return false;
    }
    
    // For regular users: if email is disabled, password is required
    if (!isExamTaker && emailEnabled === false && !formData.password.trim()) {
      setValidationError('Password is required when email integration is disabled');
      return false;
    }
    
    // Only validate password for regular users if provided (password is now optional when email is enabled)
    if (!isExamTaker && formData.password.trim() && formData.password.length < 8) {
      setValidationError('Password must be at least 8 characters long (or leave empty)');
      return false;
    }
    if (!isExamTaker && formData.password.length > VALIDATION_CONSTRAINTS.USER.PASSWORD_MAX_LENGTH) {
      setValidationError(`Password must not exceed ${VALIDATION_CONSTRAINTS.USER.PASSWORD_MAX_LENGTH} characters`);
      return false;
    }
    
    setValidationError('');
    return true;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Convert Student ID to uppercase for exam takers
    const processedValue = (name === 'id' && isExamTaker) ? value.toUpperCase() : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue,
    }));
    if (validationError) setValidationError('');
  };

  const handleGeneratePassword = () => {
    const newPassword = generateDefaultPassword();
    setFormData(prev => ({
      ...prev,
      password: newPassword,
    }));
    if (validationError) setValidationError('');
  };

  const handleUserTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsExamTaker(e.target.checked);
    if (validationError) setValidationError('');
  };

  const handleConfirm = () => {
    if (validateForm()) {
      if (isExamTaker) {
        const examTakerRequest: ExamTakerCreateRequest = {
          fullName: formData.fullName.trim(),
          ...(formData.id.trim() && { id: formData.id.trim() }),
          ...(formData.email.trim() && { email: formData.email.trim() }),
          ...(formData.dateOfBirth.trim() && { dateOfBirth: formData.dateOfBirth.trim() })
        };
        onConfirm(examTakerRequest, true);
      } else {
        const userRequest: UserCreateByAdminRequest = {
          email: formData.email.trim(),
          fullName: formData.fullName.trim(),
          ...(formData.password.trim() && { password: formData.password.trim() }),
          ...(formData.dateOfBirth.trim() && { dateOfBirth: formData.dateOfBirth.trim() })
        };
        onConfirm(userRequest, false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className={userManagementStyles.modalOverlay}>
      <div className={userManagementStyles.modal}>
        <div className={userManagementStyles.modalHeader}>
          <h3 className={userManagementStyles.modalTitle}>{isExamTaker ? 'Create New Exam Taker' : 'Create New User'}</h3>
        </div>
        
        <div className={userManagementStyles.modalBody}>
          {(error || validationError) && (
            <div className={userManagementStyles.errorBox}>
              <p className={userManagementStyles.errorMessage}>{error || validationError}</p>
            </div>
          )}
          
          {isExamTaker && (
            <div className={userManagementStyles.infoBox}>
              <p className={userManagementStyles.modalInfoText}>
                Exam takers don't have passwords and can only access assigned exams. If no Student ID is provided, one will be generated automatically in the format XXXX-XXXX where X is an alphanumeric uppercase character (example: H9LC-4G4L).
              </p>
            </div>
          )}
          
          {!isExamTaker && (
            <div className={userManagementStyles.infoBox}>
              <p className={userManagementStyles.modalInfoText}>
                {emailEnabled === null 
                  ? 'Checking email configuration...'
                  : emailEnabled 
                    ? 'If no password is provided, the user will receive an email invitation to set their password. If you provide a password, you will need to share it with the user through other means (phone, in-person, etc.).'
                    : 'Password can be optional if email integration is enabled. Without email integration, you will need to communicate the password to the user through other means (phone, in-person, etc.).'
                }
              </p>
            </div>
          )}
          
          <div className={userManagementStyles.formContainer}>
            <div className={userManagementStyles.formGroup}>
              <div className={userManagementStyles.checkboxContainer}>
                <input
                  type="checkbox"
                  id="userTypeToggle"
                  checked={isExamTaker}
                  onChange={handleUserTypeChange}
                  className={userManagementStyles.checkbox}
                />
                <label htmlFor="userTypeToggle" className={userManagementStyles.checkboxLabel}>
                  Create as Exam Taker (no password required)
                </label>
              </div>
            </div>
          <div className={userManagementStyles.formGroup}>
            <label className={cn(
              userManagementStyles.formLabel,
              isExamTaker && userManagementStyles.optionalLabel
            )}>
              Email{isExamTaker ? ' (optional)' : ''}:
            </label>
            <input
              ref={emailInputRef}
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={userManagementStyles.formInput}
              placeholder={isExamTaker ? "Enter email (optional)" : "Enter email"}
              maxLength={isExamTaker ? VALIDATION_CONSTRAINTS.EXAM_TAKER.EMAIL_MAX_LENGTH : VALIDATION_CONSTRAINTS.USER.EMAIL_MAX_LENGTH}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#3b82f6';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = error ? '#dc2626' : '#d1d5db';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            <div className={cn(
              userManagementStyles.characterCounter,
              formData.email.length > (isExamTaker ? VALIDATION_CONSTRAINTS.EXAM_TAKER.EMAIL_MAX_LENGTH : VALIDATION_CONSTRAINTS.USER.EMAIL_MAX_LENGTH) * 0.9 ? userManagementStyles.counterWarning : ''
            )}>
              {formData.email.length}/{isExamTaker ? VALIDATION_CONSTRAINTS.EXAM_TAKER.EMAIL_MAX_LENGTH : VALIDATION_CONSTRAINTS.USER.EMAIL_MAX_LENGTH}
            </div>
          </div>
          <div className={userManagementStyles.formGroup}>
            <label className={userManagementStyles.formLabel}>Full Name:</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              className={userManagementStyles.formInput}
              placeholder="Enter full name"
              maxLength={isExamTaker ? VALIDATION_CONSTRAINTS.EXAM_TAKER.NAME_MAX_LENGTH : VALIDATION_CONSTRAINTS.USER.FULL_NAME_MAX_LENGTH}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#3b82f6';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = error ? '#dc2626' : '#d1d5db';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            <div className={cn(
              userManagementStyles.characterCounter,
              formData.fullName.length > (isExamTaker ? VALIDATION_CONSTRAINTS.EXAM_TAKER.NAME_MAX_LENGTH : VALIDATION_CONSTRAINTS.USER.FULL_NAME_MAX_LENGTH) * 0.9 ? userManagementStyles.counterWarning : ''
            )}>
              {formData.fullName.length}/{isExamTaker ? VALIDATION_CONSTRAINTS.EXAM_TAKER.NAME_MAX_LENGTH : VALIDATION_CONSTRAINTS.USER.FULL_NAME_MAX_LENGTH}
            </div>
          </div>
          <div className={userManagementStyles.formGroup}>
            <label className={cn(
              userManagementStyles.formLabel,
              userManagementStyles.optionalLabel
            )}>
              Date of Birth (optional):
            </label>
            <input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleInputChange}
              className={userManagementStyles.formInput}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#3b82f6';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = error ? '#dc2626' : '#d1d5db';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>
          {isExamTaker ? (
            <div className={userManagementStyles.formGroup}>
              <label className={cn(
                userManagementStyles.formLabel,
                userManagementStyles.optionalLabel
              )}>
                Student ID (optional):
              </label>
              <input
                type="text"
                name="id"
                value={formData.id}
                onChange={handleInputChange}
                className={userManagementStyles.formInput}
                placeholder="Enter student ID (optional)"
                maxLength={VALIDATION_CONSTRAINTS.EXAM_TAKER.ID_MAX_LENGTH}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#3b82f6';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = error ? '#dc2626' : '#d1d5db';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
              <div className={cn(
                userManagementStyles.characterCounter,
                formData.id.length > VALIDATION_CONSTRAINTS.EXAM_TAKER.ID_MAX_LENGTH * 0.9 ? userManagementStyles.counterWarning : ''
              )}>
                {formData.id.length}/{VALIDATION_CONSTRAINTS.EXAM_TAKER.ID_MAX_LENGTH}
              </div>
            </div>
          ) : (
            <div className={userManagementStyles.formGroup}>
              <label className={cn(
                userManagementStyles.formLabel,
                userManagementStyles.optionalLabel
              )}>{emailEnabled === false ? 'Password:' : 'Password (optional):'}</label>
              <div className={userManagementStyles.passwordInputWithButton}>
                <input
                  type="text"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={userManagementStyles.passwordInputWithInlineButton}
                  placeholder={emailEnabled === false ? "Enter password (required)" : "Enter password (or leave empty)"}
                  required={emailEnabled === false}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#3b82f6';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = error ? '#dc2626' : '#d1d5db';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className={userManagementStyles.generatePasswordInlineButton}
                  title="Generate secure password"
                >
                  🔄
                </button>
              </div>
            </div>
            )}
            <p className={userManagementStyles.keyboardShortcuts}>
              <kbd className={userManagementStyles.kbd}>Ctrl</kbd> + <kbd className={userManagementStyles.kbd}>Enter</kbd> to confirm, <kbd className={userManagementStyles.kbd}>Esc</kbd> to cancel
            </p>
          </div>
        </div>        <div className={userManagementStyles.modalFooter}>
          <button 
            onClick={onCancel} 
            disabled={loading}
            className={userManagementStyles.modalCancelButton}
          >
            Cancel
          </button>
          <button 
            onClick={handleConfirm} 
            disabled={loading}
            className={userManagementStyles.modalConfirmButton}
          >
            {loading ? 'Creating...' : (isExamTaker ? 'Create Exam Taker' : 'Create User')}
          </button>
        </div>
      </div>
    </div>
  );
};

const ResetPasswordModal = ({ isOpen, userEmail, onConfirm, onCancel }: ResetPasswordModalProps) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [passwordPolicy, setPasswordPolicy] = useState<PasswordPolicyOptions | null>(null);
  const [policyLoading, setPolicyLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPassword(generateDefaultPassword());
      setError('');
      loadPasswordPolicy();
    }
  }, [isOpen]);

  const loadPasswordPolicy = async () => {
    setPolicyLoading(true);
    try {
      const response = await configurationService.getPasswordPolicy();
      setPasswordPolicy(response.data);
    } catch (err) {
      // Set default policy if loading fails
      setPasswordPolicy({
        requiredLength: 8,
        requireDigit: true,
        requireUppercase: true,
        requireLowercase: true,
        requireNonAlphanumeric: false
      });
    } finally {
      setPolicyLoading(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen) {
        if (e.key === 'Escape') {
          e.preventDefault();
          onCancel();
        } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          e.preventDefault();
          handleConfirm();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, password]);

  const validatePassword = (pwd: string): boolean => {
    if (!passwordPolicy) {
      setError('Password policy not loaded');
      return false;
    }

    // Check length requirement
    if (pwd.length < passwordPolicy.requiredLength) {
      setError(`Password must be at least ${passwordPolicy.requiredLength} characters long`);
      return false;
    }

    // Check digit requirement
    if (passwordPolicy.requireDigit && !/\d/.test(pwd)) {
      setError('Password must contain at least one digit (0-9)');
      return false;
    }

    // Check uppercase requirement
    if (passwordPolicy.requireUppercase && !/[A-Z]/.test(pwd)) {
      setError('Password must contain at least one uppercase letter (A-Z)');
      return false;
    }

    // Check lowercase requirement
    if (passwordPolicy.requireLowercase && !/[a-z]/.test(pwd)) {
      setError('Password must contain at least one lowercase letter (a-z)');
      return false;
    }

    // Check non-alphanumeric requirement
    if (passwordPolicy.requireNonAlphanumeric && !/[^A-Za-z0-9]/.test(pwd)) {
      setError('Password must contain at least one special character (!@#$%^&* etc.)');
      return false;
    }

    setError('');
    return true;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    if (newPassword.length > 0) {
      validatePassword(newPassword);
    }
  };

  const handleConfirm = () => {
    if (validatePassword(password)) {
      onConfirm(password);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={userManagementStyles.modalOverlay}>
      <div className={userManagementStyles.modal}>
        <div className={userManagementStyles.modalHeader}>
          <h3 className={userManagementStyles.modalTitle}>Reset Password</h3>
          <p className={userManagementStyles.modalSubtitle}>
            Reset password for user: <strong>{userEmail}</strong>
          </p>
        </div>
        
        <div className={userManagementStyles.modalBody}>
          <div className={userManagementStyles.passwordPolicyInfo}>
            <h4 className={userManagementStyles.policyInfoTitle}>Current Password Policy:</h4>
            {policyLoading ? (
              <p className={userManagementStyles.policyInfoLoading}>Loading password policy...</p>
            ) : passwordPolicy ? (
              <ul className={userManagementStyles.policyInfoList}>
                <li className={userManagementStyles.policyInfoItem}>
                  Minimum length: <strong>{passwordPolicy.requiredLength} characters</strong>
                </li>
                {passwordPolicy.requireDigit && (
                  <li className={userManagementStyles.policyInfoItem}>Must contain at least one digit (0-9)</li>
                )}
                {passwordPolicy.requireUppercase && (
                  <li className={userManagementStyles.policyInfoItem}>Must contain at least one uppercase letter (A-Z)</li>
                )}
                {passwordPolicy.requireLowercase && (
                  <li className={userManagementStyles.policyInfoItem}>Must contain at least one lowercase letter (a-z)</li>
                )}
                {passwordPolicy.requireNonAlphanumeric && (
                  <li className={userManagementStyles.policyInfoItem}>Must contain at least one special character (!@#$%^&* etc.)</li>
                )}
              </ul>
            ) : (
              <p className={userManagementStyles.policyInfoError}>Failed to load password policy. Using default requirements.</p>
            )}
          </div>
          
          <div className={userManagementStyles.passwordInputContainer}>
            <label className={userManagementStyles.passwordLabel}>New Password:</label>
            <input
              type="text"
              value={password}
              onChange={handlePasswordChange}
              className={`${userManagementStyles.passwordInput} ${error ? userManagementStyles.error : ''}`}
              placeholder="Enter new password"
            />
            {error && <p className={userManagementStyles.passwordError}>{error}</p>}
          </div>
          <p className={userManagementStyles.keyboardShortcuts}>
            <kbd className={userManagementStyles.kbd}>Ctrl</kbd> + <kbd className={userManagementStyles.kbd}>Enter</kbd> to confirm, <kbd className={userManagementStyles.kbd}>Esc</kbd> to cancel
          </p>
        </div>
        
        <div className={userManagementStyles.modalFooter}>
          <button 
            onClick={onCancel} 
            className={userManagementStyles.modalCancelButton}
          >
            Cancel
          </button>
          <button 
            onClick={handleConfirm} 
            className={userManagementStyles.modalConfirmButton}
          >
            Reset Password
          </button>
        </div>
      </div>
    </div>
  );
};

const RoleManagementModal = ({ isOpen, user, currentUserRoles, onAssignRole, onUnassignRole, onCancel }: RoleManagementModalProps) => {
  const [selectedRole, setSelectedRole] = useState<UserRole | ''>('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [removingRole, setRemovingRole] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen && e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onCancel]);

  if (!isOpen || !user) return null;

  // Check if current user is Manager (but not Admin or Moderator)
  const isManagerOnly = currentUserRoles.includes(UserRole.MANAGER) && 
    !currentUserRoles.includes(UserRole.ADMINISTRATOR) && 
    !currentUserRoles.includes(UserRole.MODERATOR);

  // Get roles that user doesn't have yet, filtered by current user's permissions
  const availableRoles = Object.values(UserRole).filter(
    role => {
      // User doesn't have this role yet
      if (user.roles?.includes(role)) return false;
      
      // Managers cannot assign Administrator role (but can assign Moderator)
      if (isManagerOnly && role === UserRole.ADMINISTRATOR) {
        return false;
      }
      
      return true;
    }
  );

  const handleAssignRole = async () => {
    if (!selectedRole) return;
    
    setIsAssigning(true);
    try {
      await onAssignRole(selectedRole);
      setSelectedRole('');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemoveRole = async (role: string) => {
    setRemovingRole(role);
    try {
      await onUnassignRole(role as UserRole);
    } finally {
      setRemovingRole(null);
    }
  };

  return (
    <div className={userManagementStyles.modalOverlay}>
      <div className={userManagementStyles.modal}>
        <div className={userManagementStyles.modalHeader}>
          <h3 className={userManagementStyles.modalTitle}>Manage User Roles</h3>
          <p className={userManagementStyles.modalSubtitle}>
            Managing roles for user: <strong>{user.email}</strong>
          </p>
        </div>
        
        <div className={userManagementStyles.modalBody}>
        <div className={userManagementStyles.rolesContainer}>
          {/* Current Roles as Badges */}
          <div className={userManagementStyles.rolesSection}>
            <h4 className={userManagementStyles.rolesSectionTitle}>Current Roles</h4>
            {user.roles && user.roles.length > 0 ? (
              <div className={userManagementStyles.roleBadgesContainer}>
                {user.roles.map((role) => {
                  // Check if this role is restricted for the current user
                  // Managers can modify Moderator role, but not Administrator
                  const isRestricted = isManagerOnly && role === UserRole.ADMINISTRATOR;
                  
                  return (
                    <div 
                      key={role} 
                      className={cn(
                        userManagementStyles.roleBadge,
                        isRestricted && userManagementStyles.roleBadgeDisabled
                      )}
                      title={isRestricted ? 'Only Administrators can modify this role' : undefined}
                    >
                      <span className={userManagementStyles.roleBadgeText}>
                        {role}
                        {isRestricted && ' 🔒'}
                      </span>
                      <button
                        onClick={() => handleRemoveRole(role)}
                        disabled={removingRole === role || isRestricted}
                        className={userManagementStyles.roleBadgeRemove}
                        title={isRestricted ? 'Only Administrators can remove this role' : 'Remove role'}
                      >
                        {removingRole === role ? '...' : '×'}
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className={userManagementStyles.noRolesText}>No roles assigned</p>
            )}
          </div>

          {/* Assign New Role */}
          {availableRoles.length > 0 && (
            <div className={userManagementStyles.rolesSection}>
              <h4 className={userManagementStyles.rolesSectionTitle}>Assign New Role</h4>
              <div className={userManagementStyles.assignRoleForm}>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                  className={userManagementStyles.roleSelect}
                >
                  <option value="">Select a role to assign...</option>
                  {availableRoles.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
                <button
                  onClick={handleAssignRole}
                  disabled={!selectedRole || isAssigning}
                  className={userManagementStyles.assignRoleButton}
                >
                  {isAssigning ? 'Assigning...' : 'Assign Role'}
                </button>
              </div>
            </div>
          )}

          {availableRoles.length === 0 && user.roles && user.roles.length > 0 && (
            <div className={userManagementStyles.rolesSection}>
              <p className={userManagementStyles.allRolesAssigned}>
                <em>All available roles have been assigned to this user.</em>
              </p>
            </div>
          )}
        </div>
        </div>
        
        <div className={userManagementStyles.modalFooter}>
          <button 
            onClick={onCancel} 
            className={userManagementStyles.modalCancelButton}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

interface ImportResultModalProps {
  isOpen: boolean;
  result: any | null;
  error: string;
  onClose: () => void;
  onCopyImportedUsers: (users: User[]) => Promise<void>;
}

const ImportResultModal = ({ isOpen, result, error, onClose, onCopyImportedUsers }: ImportResultModalProps) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen && e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const hasError = !!error;
  const hasResult = !!result;
  const isBackendError = result && result.isFailed;
  const hasBackendErrors = isBackendError && result.errors && result.errors.length > 0;

  return (
    <div className={userManagementStyles.modalOverlay}>
      <div className={cn(userManagementStyles.modal, userManagementStyles.modalImport)}>
        <div className={userManagementStyles.modalHeader}>
          <h3 className={userManagementStyles.modalTitle}>
            {hasError || isBackendError ? 'Import Failed' : 'Import Results'}
          </h3>
        </div>
        
        <div className={userManagementStyles.modalBody}>
        {/* Backend validation errors */}
        {isBackendError && (
          <div className={userManagementStyles.importError}>
            <p className={userManagementStyles.importErrorTitle}><img src="/images/icons/fail.svg" alt="Error" style={{width: '16px', height: '16px', marginRight: '6px', verticalAlign: 'middle'}} /> Import failed due to validation errors:</p>
            <p className={userManagementStyles.importErrorMessage}>{result.message}</p>
            
            {hasBackendErrors && (
              <div className={userManagementStyles.backendErrorsList}>
                <p className={userManagementStyles.backendErrorsTitle}><img src="/images/icons/magnifying-glass.svg" alt="Details" style={{width: '14px', height: '14px', marginRight: '6px', verticalAlign: 'middle'}} /> Details:</p>
                <ul className={userManagementStyles.backendErrorsItems}>
                  {result.errors.map((errorMsg: string, index: number) => (
                    <li key={index} className={userManagementStyles.backendErrorItem}>
                      {errorMsg}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className={userManagementStyles.csvFormatHelp}>
              <p className={userManagementStyles.csvFormatTitle}><img src="/images/icons/light-bulb.svg" alt="Tips" style={{width: '14px', height: '14px', marginRight: '6px', verticalAlign: 'middle'}} /> Tips:</p>
              <ul className={userManagementStyles.csvRequirementsList}>
                <li>Check for duplicate IDs in your CSV file</li>
                <li>Check for duplicate email addresses in your CSV file</li>
                <li>Ensure IDs and emails are unique across the system</li>
                <li>Remove or modify conflicting entries and try again</li>
              </ul>
            </div>
          </div>
        )}
        
        {/* Generic/parsing errors */}
        {hasError && !isBackendError && (
          <div className={userManagementStyles.importError}>
            <p className={userManagementStyles.importErrorTitle}><img src="/images/icons/fail.svg" alt="Error" style={{width: '16px', height: '16px', marginRight: '6px', verticalAlign: 'middle'}} /> Error occurred during import:</p>
            <p className={userManagementStyles.importErrorMessage}>{error}</p>
            <div className={userManagementStyles.csvFormatHelp}>
              <p className={userManagementStyles.csvFormatTitle}><img src="/images/icons/clipboard.svg" alt="Format" style={{width: '14px', height: '14px', marginRight: '6px', verticalAlign: 'middle'}} /> Expected CSV Format:</p>
              <div className={userManagementStyles.csvExample}>
                <p className={userManagementStyles.csvExampleText}>id,name,email,date_of_birth,assignment_id</p>
                <p className={userManagementStyles.csvExampleText}>,"John Doe","john@example.com","1990-01-15","123e4567-e89b-12d3-a456-426614174000"</p>
                <p className={userManagementStyles.csvExampleText}>,"Jane Smith","jane@example.com","1992-05-20",</p>
                <p className={userManagementStyles.csvExampleText}>STUD001,"Bob Wilson",,,</p>
                <p className={userManagementStyles.csvExampleText}>,"Alice Johnson","alice@example.com","1988-12-03",</p>
              </div>
              <ul className={userManagementStyles.csvRequirementsList}>
                <li><strong>Required columns:</strong> id (or student_id), name (or full_name)</li>
                <li><strong>Optional columns:</strong> email, date_of_birth (or dob), assignment_id (or assignmentid)</li>
                <li>Column names are case-insensitive</li>
                <li>Leave ID empty for auto-generation, or provide custom ID</li>
                <li>Date of birth should be in YYYY-MM-DD format</li>
                <li>Email, date_of_birth, and assignment_id can be empty</li>
              </ul>
            </div>
          </div>
        )}
        
        {hasResult && !isBackendError && (
          <div className={userManagementStyles.importSuccess}>
            <p className={userManagementStyles.importSuccessTitle}>
              <img src="/images/icons/check.svg" alt="Success" style={{width: '16px', height: '16px', marginRight: '6px', verticalAlign: 'middle'}} /> Import completed successfully!
            </p>
            <div className={userManagementStyles.importStats}>
              <p className={userManagementStyles.importStat}>
                <strong>Created:</strong> {result.data?.length || 0} exam takers
              </p>
              {result.message && (
                <p className={userManagementStyles.importMessage}>{result.message}</p>
              )}
            </div>
            {result.data && result.data.length > 0 && (
              <div className={userManagementStyles.importedUsers}>
                <div className={userManagementStyles.importedUsersHeader}>
                  <p className={userManagementStyles.importedUsersTitle}>Imported Exam Takers:</p>
                  <button 
                    onClick={() => onCopyImportedUsers(result.data)}
                    className={userManagementStyles.copyButton}
                    title="Copy all imported exam takers to clipboard"
                  >
                    <img src="/images/icons/clipboard.svg" alt="Copy" style={{width: '14px', height: '14px', marginRight: '4px', verticalAlign: 'middle'}} /> Copy All
                  </button>
                </div>
                <div className={userManagementStyles.importedUsersList}>
                  {result.data.slice(0, 5).map((user: User, index: number) => (
                    <div key={user.id} className={userManagementStyles.importedUser}>
                      <span className={userManagementStyles.importedUserId}>{user.id}</span>
                      <span className={userManagementStyles.importedUserName}>{user.fullName}</span>
                      {user.email && (
                        <span className={userManagementStyles.importedUserEmail}>{user.email}</span>
                      )}
                    </div>
                  ))}
                  {result.data.length > 5 && (
                    <p className={userManagementStyles.moreUsersText}>
                      ... and {result.data.length - 5} more
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        </div>
        
        <div className={userManagementStyles.modalFooter}>
          <button 
            onClick={onClose} 
            className={userManagementStyles.modalConfirmButton}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const DeleteConfirmationModal = ({ isOpen, userEmail, userId, onConfirm, onCancel }: DeleteConfirmationModalProps) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen) {
        if (e.key === 'Escape') {
          e.preventDefault();
          onCancel();
        } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          e.preventDefault();
          onConfirm();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onConfirm, onCancel]);

  if (!isOpen) return null;

  return (
    <div className={userManagementStyles.modalOverlay}>
      <div className={userManagementStyles.modal}>
        <div className={userManagementStyles.modalHeader}>
          <h3 className={userManagementStyles.modalTitle}>Confirm User Deletion</h3>
        </div>
        
        <div className={userManagementStyles.modalBody}>
          <p className={userManagementStyles.modalMessage}>
            Are you sure you want to delete the user with email: <strong>{userEmail}</strong>?
          </p>
          <p className={userManagementStyles.modalWarning}>
            This action cannot be undone.
          </p>
          <p className={userManagementStyles.keyboardShortcuts}>
            <kbd className={userManagementStyles.kbd}>Ctrl</kbd> + <kbd className={userManagementStyles.kbd}>Enter</kbd> to confirm, <kbd className={userManagementStyles.kbd}>Esc</kbd> to cancel
          </p>
        </div>
        
        <div className={userManagementStyles.modalFooter}>
          <button 
            onClick={onCancel} 
            className={userManagementStyles.modalCancelButton}
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm} 
            className={userManagementStyles.modalDeleteButton}
          >
            Delete User
          </button>
        </div>
      </div>
    </div>
  );
};

interface UserManagementProps {
  userManagementData: {
    users: User[];
    totalPages: number;
    currentPage: number;
    dataLoaded: boolean;
  };
  setUserManagementData: React.Dispatch<React.SetStateAction<{
    users: User[];
    totalPages: number;
    currentPage: number;
    dataLoaded: boolean;
  }>>;
  currentUserRoles: UserRole[];
}

const UserManagement = ({ userManagementData, setUserManagementData, currentUserRoles }: UserManagementProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createUserError, setCreateUserError] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'email' | 'id'>('email');

  // Load users data
  const loadUsers = async (page: number = 1, newPageSize: number = pageSize, search: string = searchTerm, searchBy: 'email' | 'id' = searchType) => {
    setLoading(true);
    setError('');
    try {
      let response;
      
      if (search.trim()) {
        const emailPart = searchBy === 'email' ? search.trim() : '';
        const idPart = searchBy === 'id' ? search.trim() : '';
        response = await userService.searchUsers(emailPart, idPart, page, newPageSize);
      } else {
        response = await userService.fetchUsers(page, newPageSize);
      }
      
      setUserManagementData({
        users: response.data.data || [],
        totalPages: response.data.totalPages || 1,
        currentPage: page,
        dataLoaded: true,
      });
    } catch (err: any) {
      setError('Failed to load users: ' + (err.response?.data?.message || err.message));
      setUserManagementData(prev => ({ ...prev, users: [], dataLoaded: true }));
    } finally {
      setLoading(false);
    }
  };

  // Load users on component mount or when page size changes
  useEffect(() => {
    if (!userManagementData.dataLoaded) {
      loadUsers(1, pageSize);
    }
  }, [userManagementData.dataLoaded, pageSize]);

  // Handle page size changes with proper reset
  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    loadUsers(1, newPageSize);
  };

  // Handle page changes
  const handlePageChange = (newPage: number) => {
    loadUsers(newPage, pageSize, searchTerm, searchType);
  };
  
  // Handle search changes
  const handleSearchChange = (newSearchTerm: string) => {
    setSearchTerm(newSearchTerm);
    // Reset to page 1 when searching and trigger server-side search
    loadUsers(1, pageSize, newSearchTerm, searchType);
  };
  
  // Handle search type changes
  const handleSearchTypeChange = (newSearchType: 'email' | 'id') => {
    setSearchType(newSearchType);
    setSearchTerm(''); // Clear search when changing type
    // Reset to page 1 and reload
    loadUsers(1, pageSize, '', newSearchType);
  };
  const [createUserModal, setCreateUserModal] = useState({ isOpen: false });
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    userEmail: string;
    userId: string;
  }>({ isOpen: false, userEmail: '', userId: '' });
  const [resetPasswordModal, setResetPasswordModal] = useState<{
    isOpen: boolean;
    userEmail: string;
  }>({ isOpen: false, userEmail: '' });
  const [roleManagementModal, setRoleManagementModal] = useState<{
    isOpen: boolean;
    user: UserWithRoles | null;
  }>({ isOpen: false, user: null });
  const [importResultModal, setImportResultModal] = useState<{
    isOpen: boolean;
    result: any | null;
    error: string;
  }>({ isOpen: false, result: null, error: '' });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Ctrl+N keyboard shortcut for creating new user
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n' && !createUserModal.isOpen) {
        e.preventDefault();
        handleCreateUser();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [createUserModal.isOpen]);

  // Add mobile responsive styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @media (max-width: 768px) {
        .user-management-header-buttons {
          flex-direction: row !important;
          flex-wrap: wrap !important;
          gap: 8px !important;
          justify-content: center !important;
        }
        .user-management-button {
          flex: 1 1 auto !important;
          min-width: 120px !important;
          font-size: 12px !important;
          padding: 10px 16px !important;
          white-space: nowrap !important;
        }
      }
      @media (max-width: 480px) {
        .user-management-header-buttons {
          gap: 6px !important;
        }
        .user-management-button {
          min-width: 100px !important;
          font-size: 11px !important;
          padding: 8px 12px !important;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const handleCreateUser = () => {
    setCreateUserModal({ isOpen: true });
  };

  const handleDeleteUser = (userEmail: string, userId: string) => {
    setDeleteModal({ isOpen: true, userEmail, userId });
  };

  const handleResetPassword = (userEmail: string) => {
    setResetPasswordModal({ isOpen: true, userEmail });
  };

  const confirmCreateUser = async (request: UserCreateByAdminRequest | ExamTakerCreateRequest, isExamTaker: boolean) => {
    setLoading(true);
    setCreateUserError('');
    
    try {
      if (isExamTaker) {
        await userService.createExamTakerByAdmin(request as ExamTakerCreateRequest);
      } else {
        await userService.createUserByAdmin(request as UserCreateByAdminRequest);
      }
      setCreateUserModal({ isOpen: false });
      // Refresh user list with current search state
      loadUsers(userManagementData.currentPage, pageSize, searchTerm, searchType);
    } catch (err: any) {
      // Extract detailed error message from backend response
      let errorMessage = '';
      
      if (err.response?.data) {
        const data = err.response.data;
        
        // Handle structured validation errors
        if (data.errors && typeof data.errors === 'object') {
          const errorDetails = [];
          
          // Add main message if present
          if (data.message) {
            errorDetails.push(data.message);
          }
          
          // Add validation errors
          for (const [field, messages] of Object.entries(data.errors)) {
            if (Array.isArray(messages)) {
              errorDetails.push(...messages);
            } else if (typeof messages === 'string') {
              errorDetails.push(messages);
            }
          }
          
          errorMessage = errorDetails.join(' ');
        }
        // Handle simple error array
        else if (data.errors && Array.isArray(data.errors)) {
          errorMessage = data.errors.join(', ');
          if (data.message) {
            errorMessage = `${data.message} ${errorMessage}`;
          }
        }
        // Handle simple message
        else if (data.message) {
          errorMessage = data.message;
        }
        // Handle error as string
        else if (typeof data === 'string') {
          errorMessage = data;
        }
      }
      
      // Fallback to generic error
      if (!errorMessage) {
        errorMessage = err.message || 'User registration failed. Please try again.';
      }
      
      setCreateUserError(errorMessage);
      // Don't close modal on error - let user see the error and retry
    } finally {
      setLoading(false);
    }
  };

  const cancelCreateUser = () => {
    setCreateUserModal({ isOpen: false });
    setCreateUserError('');
  };

  const confirmResetPassword = async (newPassword: string) => {
    setLoading(true);
    setError('');
    
    try {
      await userService.resetPasswordByAdmin(resetPasswordModal.userEmail, newPassword);
      setResetPasswordModal({ isOpen: false, userEmail: '' });
      // Refresh user list with current search state
      loadUsers(userManagementData.currentPage, pageSize, searchTerm, searchType);
    } catch (err: any) {
      setError('Failed to reset password: ' + (err.response?.data?.message || err.message));
      setResetPasswordModal({ isOpen: false, userEmail: '' });
    } finally {
      setLoading(false);
    }
  };

  const cancelResetPassword = () => {
    setResetPasswordModal({ isOpen: false, userEmail: '' });
  };

  const confirmDeleteUser = async () => {
    setLoading(true);
    setError('');
    
    try {
      await userService.deleteUser(deleteModal.userId);
      setDeleteModal({ isOpen: false, userEmail: '', userId: '' });
      // Refresh user list with current search state
      loadUsers(userManagementData.currentPage, pageSize, searchTerm, searchType);
    } catch (err: any) {
      setError('Failed to delete user: ' + (err.response?.data?.message || err.message));
      setDeleteModal({ isOpen: false, userEmail: '', userId: '' });
    } finally {
      setLoading(false);
    }
  };

  const cancelDeleteUser = () => {
    setDeleteModal({ isOpen: false, userEmail: '', userId: '' });
  };

  const handleManageRoles = async (user: User) => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch user's current roles
      const rolesResponse = await userService.getUserRoles(user.id);
      const userWithRoles: UserWithRoles = {
        ...user,
        roles: rolesResponse.data || []
      };
      
      setRoleManagementModal({ isOpen: true, user: userWithRoles });
    } catch (err: any) {
      // If no roles found or any error, still open modal with empty roles
      const userWithRoles: UserWithRoles = {
        ...user,
        roles: []
      };
      
      setRoleManagementModal({ isOpen: true, user: userWithRoles });
    } finally {
      setLoading(false);
    }
  };

  const assignRole = async (role: UserRole) => {
    if (!roleManagementModal.user) return;
    
    setLoading(true);
    setError('');
    
    try {
      const request: UserRoleAssignmentRequest = {
        userId: roleManagementModal.user.id,
        role: role
      };
      await userService.assignUserRole(request);
      
      // Update the user's roles in the modal state immediately
      const updatedUser = {
        ...roleManagementModal.user,
        roles: [...(roleManagementModal.user.roles || []), role]
      };
      setRoleManagementModal(prev => ({
        ...prev,
        user: updatedUser as UserWithRoles
      }));
    } catch (err: any) {
      setError(`Failed to assign role ${role}: ` + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const unassignRole = async (role: UserRole) => {
    if (!roleManagementModal.user) return;
    
    setLoading(true);
    setError('');
    
    try {
      const request: UserRoleAssignmentRequest = {
        userId: roleManagementModal.user.id,
        role: role
      };
      await userService.unassignUserRole(request);
      
      // Update the user's roles in the modal state immediately
      const updatedUser = {
        ...roleManagementModal.user,
        roles: roleManagementModal.user.roles?.filter(r => r !== role) || []
      };
      setRoleManagementModal(prev => ({
        ...prev,
        user: updatedUser as UserWithRoles
      }));
    } catch (err: any) {
      setError(`Failed to unassign role ${role}: ` + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const cancelRoleManagement = () => {
    setRoleManagementModal({ isOpen: false, user: null });
  };

  // CSV parsing and upload handlers
  const parseCsvFile = (file: File): Promise<ExamTakerImport[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const csv = event.target?.result as string;
          const lines = csv.trim().split('\n');
          
          if (lines.length < 2) {
            reject(new Error('CSV file must contain at least a header row and one data row'));
            return;
          }
          
          // Parse header to find column positions
          const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
          const idIndex = headers.findIndex(h => h === 'id' || h === 'student_id' || h === 'studentid');
          const nameIndex = headers.findIndex(h => 
            h === 'name' || h === 'full_name' || h === 'fullname' || 
            h.startsWith('name (') || h.startsWith('full_name (') || h.startsWith('fullname (')
          );
          const emailIndex = headers.findIndex(h => h === 'email');
          const dateOfBirthIndex = headers.findIndex(h => h === 'date_of_birth' || h === 'dateofbirth' || h === 'dob');
          const assignmentIdIndex = headers.findIndex(h => h === 'assignment_id' || h === 'assignmentid');
          
          if (idIndex === -1) {
            reject(new Error('CSV file must contain an "id", "student_id", or "studentid" column'));
            return;
          }
          
          if (nameIndex === -1) {
            reject(new Error('CSV file must contain a "name", "full_name", or "fullname" column'));
            return;
          }
          
          const examTakers: ExamTakerImport[] = [];
          
          // Parse data rows
          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
            
            // Require both id and name columns to be present (but id can be empty)
            if (values.length < Math.max(idIndex, nameIndex) + 1) {
              continue; // Skip incomplete rows
            }
            
            const examTaker: ExamTakerImport = {
              // Always include ID field - pass empty string if not provided, let backend handle null conversion
              id: values[idIndex] || '',
              name: values[nameIndex],
            };
            
            if (emailIndex !== -1 && values[emailIndex]) {
              examTaker.email = values[emailIndex];
            }
            
            if (dateOfBirthIndex !== -1 && values[dateOfBirthIndex]) {
              const dateValue = values[dateOfBirthIndex].trim();
              // Validate and format the date to ensure it's in ISO format (YYYY-MM-DD)
              const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
              if (dateRegex.test(dateValue)) {
                // Verify it's a valid date and send as ISO 8601 datetime string for .NET
                const parsedDate = new Date(dateValue + 'T00:00:00.000Z');
                if (!isNaN(parsedDate.getTime())) {
                  examTaker.dateOfBirth = parsedDate.toISOString();
                }
              }
            }
            
            if (assignmentIdIndex !== -1 && values[assignmentIdIndex]) {
              examTaker.assignmentId = values[assignmentIdIndex];
            }
            
            // Only require name to be present
            if (examTaker.name) {
              examTakers.push(examTaker);
            }
          }
          
          if (examTakers.length === 0) {
            reject(new Error('No valid exam taker records found in CSV file'));
            return;
          }
          
          resolve(examTakers);
        } catch (error) {
          reject(new Error(`Failed to parse CSV file: ${error}`));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read CSV file'));
      };
      
      reader.readAsText(file);
    });
  };

  const handleCsvUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Reset the input value to allow re-selecting the same file
    event.target.value = '';
    
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setImportResultModal({
        isOpen: true,
        result: null,
        error: 'Please select a CSV file'
      });
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const examTakers = await parseCsvFile(file);
      
      const result = await userService.importExamTakers(examTakers);
      
      setImportResultModal({
        isOpen: true,
        result: result,
        error: ''
      });
      
      // Refresh user list on successful import with current search state
      loadUsers(userManagementData.currentPage, pageSize, searchTerm, searchType);
      
    } catch (error: any) {
      
      // Handle backend validation errors
      let errorResult = null;
      if (error.response?.data) {
        errorResult = error.response.data;
      }
      
      setImportResultModal({
        isOpen: true,
        result: errorResult,
        error: error.message || 'Failed to import exam takers'
      });
    } finally {
      setLoading(false);
    }
  };

  const closeImportResultModal = () => {
    setImportResultModal({ isOpen: false, result: null, error: '' });
  };

  const handleDownloadSampleCsv = () => {
    userService.downloadSampleCsv();
  };

  const copyImportedUsers = async (users: User[]) => {
    try {
      // Format the users data for copying
      const formattedUsers = users.map(user => {
        const lines = [user.id, user.fullName];
        if (user.email) {
          lines.push(user.email);
        }
        return lines.join('\n');
      }).join('\n\n');

      await navigator.clipboard.writeText(formattedUsers);
      
      // Could add a brief success indicator here if needed
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      const formattedUsers = users.map(user => {
        const lines = [user.id, user.fullName];
        if (user.email) {
          lines.push(user.email);
        }
        return lines.join('\n');
      }).join('\n\n');
      
      textArea.value = formattedUsers;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  };

  return (
    <>
      <CreateUserModal
        isOpen={createUserModal.isOpen}
        loading={loading}
        error={createUserError}
        onConfirm={confirmCreateUser}
        onCancel={cancelCreateUser}
      />
      <ResetPasswordModal
        isOpen={resetPasswordModal.isOpen}
        userEmail={resetPasswordModal.userEmail}
        onConfirm={confirmResetPassword}
        onCancel={cancelResetPassword}
      />
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        userEmail={deleteModal.userEmail}
        userId={deleteModal.userId}
        onConfirm={confirmDeleteUser}
        onCancel={cancelDeleteUser}
      />
      <RoleManagementModal
        isOpen={roleManagementModal.isOpen}
        user={roleManagementModal.user}
        currentUserRoles={currentUserRoles}
        onAssignRole={assignRole}
        onUnassignRole={unassignRole}
        onCancel={cancelRoleManagement}
      />
      <ImportResultModal
        isOpen={importResultModal.isOpen}
        result={importResultModal.result}
        error={importResultModal.error}
        onClose={closeImportResultModal}
        onCopyImportedUsers={copyImportedUsers}
      />
      <div className={userManagementStyles.container}>
        <div className={userManagementStyles.header}>
          <h2 className={userManagementStyles.title} style={{display: 'flex', alignItems: 'center'}}><img src="/images/icons/users.svg" alt="" style={{width: '28px', height: '28px', marginRight: '10px'}} />User Management</h2>
        </div>

        <div className={userManagementStyles.infoSection}>
          <div className={userManagementStyles.infoHeader}>
            <span className={userManagementStyles.infoIcon}><img src="/images/icons/information.svg" alt="" style={{width: '16px', height: '16px', verticalAlign: 'middle'}} /></span>
            <span className={userManagementStyles.infoTitle}>User Management Information</span>
          </div>
          <div className={userManagementStyles.infoContent}>
            <p className={userManagementStyles.infoText}>
              <strong>User Types:</strong> Regular <span className={userManagementStyles.userBadgeInfo}>users</span> have login credentials and can reset passwords. <span className={userManagementStyles.examTakerBadgeInfo}>Exam takers</span> don't have credentials and cannot reset passwords. Email is optional for exam takers.
            </p>
            <p className={userManagementStyles.infoText}>
              <strong>User Types:</strong> Regular users have full credentials and can log in normally. Exam takers don't have passwords and can only access assigned exams. <span className={userManagementStyles.badgeUser}>users</span> and <span className={userManagementStyles.badgeTaker}>takers</span> are indicated in the User Type column.
            </p>
            <p className={userManagementStyles.infoText}>
              <strong>User Actions:</strong> Reset Password generates a secure 8-character password containing uppercase, lowercase, numbers, and special characters. This option is only available for users with credentials.
            </p>
            <p className={userManagementStyles.infoText}>
              Use the search functionality to quickly find users by email or ID. The table shows up to 10 users per page with pagination controls when needed.
            </p>
            <p className={userManagementStyles.infoText}>
              <strong>Bulk Import:</strong> Use "Download Sample CSV" to get a template with examples, then use "Import CSV" to upload multiple exam takers at once. CSV file should contain columns: id (required but can be empty for auto-generation), name (required), email (optional), date_of_birth (optional, YYYY-MM-DD format), assignment_id (optional).
            </p>
            <p className={userManagementStyles.infoText}>
              <strong>Keyboard Shortcut:</strong> Press <kbd className={userManagementStyles.kbd}>Ctrl+N</kbd> to quickly create a new user or exam taker.
            </p>
          </div>
        </div>

      <div className={userManagementStyles.searchContainer}>
        <div className={userManagementStyles.usersSection}>
          <div className={userManagementStyles.usersSectionHeader}>
            <div className={cn(userManagementStyles.headerButtons, "user-management-header-buttons")}>
              <input
                type="file"
                accept=".csv"
                onChange={handleCsvUpload}
                className={userManagementStyles.hiddenFileInput}
                ref={fileInputRef}
              />
              <button 
                onClick={handleDownloadSampleCsv}
                className={cn(userManagementStyles.downloadButton, "user-management-button")}
                title="Download sample CSV template with examples"
              >
                Download Sample CSV
              </button>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className={cn(userManagementStyles.importButton, "user-management-button")}
                title="Import exam takers from CSV file"
              >
                Import CSV
              </button>
              <button 
                onClick={handleCreateUser}
                className={cn(userManagementStyles.createButton, "user-management-button")}
                title="Create new user or exam taker (Ctrl+N)"
              >
                Create User/Taker
              </button>
            </div>
          </div>
        </div>
        
        {error && <p className={userManagementStyles.error}>{error}</p>}
        
        <UserTable
          users={userManagementData.users}
          showActions={true}
          enablePagination={true}
          pageSize={pageSize}
          onPageSizeChange={handlePageSizeChange}
          totalPages={userManagementData.totalPages}
          currentPage={userManagementData.currentPage}
          externalDataLoaded={userManagementData.dataLoaded}
          loading={loading}
          onPageChange={handlePageChange}
          onSearchChange={handleSearchChange}
          onSearchTypeChange={handleSearchTypeChange}
          currentUserRoles={currentUserRoles}
          onUserAction={(action, user) => {
            if (action === 'resetPassword') {
              handleResetPassword(user.email);
            } else if (action === 'delete') {
              handleDeleteUser(user.email, user.id);
            } else if (action === 'manageRoles') {
              handleManageRoles(user);
            }
          }}
          maxHeight="70vh"
        />
      </div>
      </div>
    </>
  );
};

export default UserManagement;
