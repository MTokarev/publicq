import React, { useState, useEffect } from 'react';
import { configurationService } from '../../services/configurationService';
import { PasswordPolicyOptions } from '../../models/password-policy-options';
import styles from './PasswordManagement.module.css';

// Utility function for conditional class names
const cn = (...classes: (string | undefined | false)[]): string => 
  classes.filter(Boolean).join(' ');

interface PasswordManagementProps {
  passwordConfig: PasswordPolicyOptions & { dataLoaded: boolean };
  setPasswordConfig: React.Dispatch<React.SetStateAction<PasswordPolicyOptions & { dataLoaded: boolean }>>;
}

const PasswordManagement: React.FC<PasswordManagementProps> = ({ passwordConfig, setPasswordConfig }) => {
  const [originalOptions, setOriginalOptions] = useState<PasswordPolicyOptions>({
    requiredLength: 6,
    requireDigit: false,
    requireUppercase: false,
    requireLowercase: false,
    requireNonAlphanumeric: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (passwordConfig.dataLoaded) {
      return;
    }
    loadPasswordPolicy();
  }, []);

  const loadPasswordPolicy = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await configurationService.getPasswordPolicy();
      const options = response.data;
      setPasswordConfig({ ...options, dataLoaded: true });
      setOriginalOptions(options);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load password policy configuration');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    // Validate required length
    if (passwordConfig.requiredLength < 1 || passwordConfig.requiredLength > 128) {
      setError('Password length must be between 1 and 128 characters');
      return false;
    }

    return true;
  };

  const handleSavePasswordPolicy = async () => {
    // Validate form fields
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const { dataLoaded, ...optionsToSave } = passwordConfig;
      await configurationService.setPasswordPolicy(optionsToSave);
      setOriginalOptions(optionsToSave);
      setSuccess('Password policy saved successfully');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save password policy');
    } finally {
      setLoading(false);
    }
  };

  const hasUnsavedChanges = () => {
    return passwordConfig.requiredLength !== originalOptions.requiredLength ||
           passwordConfig.requireDigit !== originalOptions.requireDigit ||
           passwordConfig.requireUppercase !== originalOptions.requireUppercase ||
           passwordConfig.requireLowercase !== originalOptions.requireLowercase ||
           passwordConfig.requireNonAlphanumeric !== originalOptions.requireNonAlphanumeric;
  };

  const handleReset = () => {
    setPasswordConfig({ ...originalOptions, dataLoaded: true });
    setError('');
    setSuccess('');
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title} style={{display: 'flex', alignItems: 'center'}}><img src="/images/icons/lock.svg" alt="" style={{width: '28px', height: '28px', marginRight: '10px'}} />Password Policy Settings</h2>

      {error && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}

      {success && (
        <div className={styles.successMessage}>
          {success}
        </div>
      )}

      {/* Information Section */}
      <div className={styles.infoSection}>
        <h3 className={styles.sectionTitle}>Information</h3>
        <div className={styles.infoCard}>
          <h4 className={styles.infoTitle}>
            Password Policy Status: {passwordConfig.requiredLength ? 
              <span className={styles.statusConfigured}>Configured</span> : 
              <span className={styles.statusNotConfigured}>Not Configured</span>
            }
          </h4>
          <p className={styles.infoText}>
            Configure password requirements for all user accounts. These settings apply to new passwords during registration and password changes.
          </p>
          <p className={styles.infoText}>
            <strong>Current Policy:</strong> Minimum {passwordConfig.requiredLength} characters
            {passwordConfig.requireDigit && ', requires digits'}
            {passwordConfig.requireUppercase && ', requires uppercase letters'}
            {passwordConfig.requireLowercase && ', requires lowercase letters'}
            {passwordConfig.requireNonAlphanumeric && ', requires special characters'}
          </p>
        </div>
      </div>

      {/* Password Policy Configuration */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Password Requirements</h3>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Minimum Password Length</label>
            <input
              type="number"
              min="1"
              max="128"
              value={passwordConfig.requiredLength}
              onChange={(e) => setPasswordConfig(prev => ({
                ...prev,
                requiredLength: parseInt(e.target.value) || 1
              }))}
              className={styles.input}
            />
            <div className={styles.infoText}>
              Minimum number of characters required (1-128)
            </div>
          </div>

          <div className={styles.formGroup}>
            <div className={styles.checkboxGroup}>
              <input
                type="checkbox"
                id="requireDigit"
                checked={passwordConfig.requireDigit}
                onChange={(e) => setPasswordConfig(prev => ({
                  ...prev,
                  requireDigit: e.target.checked
                }))}
                className={styles.checkbox}
              />
              <label htmlFor="requireDigit" className={styles.checkboxLabel}>
                Require at least one digit (0-9)
              </label>
            </div>
          </div>

          <div className={styles.formGroup}>
            <div className={styles.checkboxGroup}>
              <input
                type="checkbox"
                id="requireUppercase"
                checked={passwordConfig.requireUppercase}
                onChange={(e) => setPasswordConfig(prev => ({
                  ...prev,
                  requireUppercase: e.target.checked
                }))}
                className={styles.checkbox}
              />
              <label htmlFor="requireUppercase" className={styles.checkboxLabel}>
                Require at least one uppercase letter (A-Z)
              </label>
            </div>
          </div>

          <div className={styles.formGroup}>
            <div className={styles.checkboxGroup}>
              <input
                type="checkbox"
                id="requireLowercase"
                checked={passwordConfig.requireLowercase}
                onChange={(e) => setPasswordConfig(prev => ({
                  ...prev,
                  requireLowercase: e.target.checked
                }))}
                className={styles.checkbox}
              />
              <label htmlFor="requireLowercase" className={styles.checkboxLabel}>
                Require at least one lowercase letter (a-z)
              </label>
            </div>
          </div>

          <div className={styles.formGroup}>
            <div className={styles.checkboxGroup}>
              <input
                type="checkbox"
                id="requireNonAlphanumeric"
                checked={passwordConfig.requireNonAlphanumeric}
                onChange={(e) => setPasswordConfig(prev => ({
                  ...prev,
                  requireNonAlphanumeric: e.target.checked
                }))}
                className={styles.checkbox}
              />
              <label htmlFor="requireNonAlphanumeric" className={styles.checkboxLabel}>
                Require at least one special character (!@#$%^&* etc.)
              </label>
            </div>
          </div>
        </div>

        <div className={styles.buttonGroup}>
          <button
            onClick={handleSavePasswordPolicy}
            disabled={loading || !hasUnsavedChanges()}
            className={cn(styles.button, styles.saveButton)}
          >
            {loading ? 'Saving...' : 'Save Password Policy'}
          </button>

          <button
            onClick={handleReset}
            disabled={loading || !hasUnsavedChanges()}
            className={cn(styles.button, styles.resetButton)}
          >
            Reset Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default PasswordManagement;