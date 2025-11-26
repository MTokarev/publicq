import React, { useState, useEffect } from 'react';
import { configurationService } from '../../services/configurationService';
import { AuthOptions } from '../../models/auth-options';
import cssStyles from './TokenManagement.module.css';

interface TokenManagementProps {
  tokenConfig: {
    jwtSettings: {
      secret: string;
      issuer: string;
      audience: string;
      tokenExpiryMinutes?: number;
    };
    dataLoaded: boolean;
  };
  setTokenConfig: React.Dispatch<React.SetStateAction<{
    jwtSettings: {
      secret: string;
      issuer: string;
      audience: string;
      tokenExpiryMinutes?: number;
    };
    dataLoaded: boolean;
  }>>;
}

const TokenManagement: React.FC<TokenManagementProps> = ({ tokenConfig, setTokenConfig }) => {
  const [originalOptions, setOriginalOptions] = useState<AuthOptions>({
    jwtSettings: {
      secret: '',
      issuer: '',
      audience: '',
      tokenExpiryMinutes: undefined
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  useEffect(() => {
    if (tokenConfig.dataLoaded) {
      return;
    }
    loadTokenOptions();
  }, []);

  const loadTokenOptions = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await configurationService.getTokenOptions();
      const options = response.data;
      setTokenConfig({ ...options, dataLoaded: true });
      setOriginalOptions(options);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load token configuration');
    } finally {
      setLoading(false);
    }
  };

  const hasCriticalChanges = () => {
    return tokenConfig.jwtSettings.secret !== originalOptions.jwtSettings.secret ||
           tokenConfig.jwtSettings.issuer !== originalOptions.jwtSettings.issuer ||
           tokenConfig.jwtSettings.audience !== originalOptions.jwtSettings.audience;
  };

  const validateForm = () => {
    // Validate JWT Secret
    if (!tokenConfig.jwtSettings.secret || tokenConfig.jwtSettings.secret.trim().length < 32) {
      setError('JWT Secret must be at least 32 characters long');
      return false;
    }

    // Validate Token Expiry
    const expiry = tokenConfig.jwtSettings.tokenExpiryMinutes;
    if (expiry !== undefined && (expiry < 60 || expiry > 43200)) {
      setError('Token expiry must be between 60 minutes (1 hour) and 43,200 minutes (30 days)');
      return false;
    }

    return true;
  };

  const handleSaveTokenOptions = async () => {
    // Validate form fields
    if (!validateForm()) {
      return;
    }

    // Check if critical settings changed that will invalidate all tokens
    if (hasCriticalChanges()) {
      setShowConfirmationModal(true);
      return;
    }

    // If only expiry time changed, save directly
    await performSave();
  };

  const performSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await configurationService.setTokenOptions(tokenConfig);
      setOriginalOptions(tokenConfig);
      setSuccess('Token configuration saved successfully');
      setShowConfirmationModal(false);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save token configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSave = async () => {
    // Validate again before confirming (in case user changed values while modal was open)
    if (!validateForm()) {
      setShowConfirmationModal(false);
      return;
    }
    await performSave();
  };

  const hasUnsavedChanges = () => {
    return tokenConfig.jwtSettings.secret !== originalOptions.jwtSettings.secret ||
           tokenConfig.jwtSettings.issuer !== originalOptions.jwtSettings.issuer ||
           tokenConfig.jwtSettings.audience !== originalOptions.jwtSettings.audience ||
           tokenConfig.jwtSettings.tokenExpiryMinutes !== originalOptions.jwtSettings.tokenExpiryMinutes;
  };

  const handleReset = () => {
    setTokenConfig({ ...originalOptions, dataLoaded: true });
    setError('');
    setSuccess('');
  };

  const generateSecret = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let result = '';
    for (let i = 0; i < 64; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setTokenConfig(prev => ({
      ...prev,
      jwtSettings: {
        ...prev.jwtSettings,
        secret: result
      }
    }));
  };

  if (loading && !tokenConfig.jwtSettings.secret) {
    return (
      <div className={cssStyles.loadingContainer}>
        <div className={cssStyles.loadingText}>Loading token configuration...</div>
      </div>
    );
  }

  // Confirmation Modal Component
  const ConfirmationModal = () => {
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (showConfirmationModal) {
          if (e.key === 'Escape') {
            e.preventDefault();
            setShowConfirmationModal(false);
          } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            if (!loading) {
              handleConfirmSave();
            }
          }
        }
      };

      if (showConfirmationModal) {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
      }
    }, [showConfirmationModal, loading]);

    if (!showConfirmationModal) return null;

    return (
      <div className={cssStyles.modalOverlay}>
        <div className={cssStyles.modal}>
          <h3 className={cssStyles.modalTitle}>⚠️ Critical Security Changes</h3>
          <div className={cssStyles.modalContent}>
            <p className={cssStyles.modalText}>
              You are about to change critical JWT settings that will <strong>immediately invalidate all existing tokens</strong>.
            </p>
            <p className={cssStyles.modalText}>
              This means:
            </p>
            <ul className={cssStyles.modalList}>
              <li>All currently logged-in users will be forced to log in again</li>
              <li>All active sessions will be terminated</li>
              <li>API tokens and authentication will be reset</li>
            </ul>
            <p className={cssStyles.modalWarning}>
              Are you sure you want to proceed with these changes?
            </p>
            <p className={cssStyles.keyboardShortcuts}>
              <kbd className={cssStyles.kbd}>Ctrl</kbd> + <kbd className={cssStyles.kbd}>Enter</kbd> to confirm, <kbd className={cssStyles.kbd}>Esc</kbd> to cancel
            </p>
          </div>
          <div className={cssStyles.modalActions}>
            <button
              onClick={() => setShowConfirmationModal(false)}
              disabled={loading}
              className={cssStyles.modalCancelButton}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmSave}
              disabled={loading}
              className={cssStyles.modalConfirmButton}
              style={{
                opacity: loading ? 0.6 : 1,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Saving...' : 'Yes, Force All Users to Re-login'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <ConfirmationModal />
    <div className={cssStyles.container}>
      <h2 className={cssStyles.title} style={{display: 'flex', alignItems: 'center'}}><img src="/images/icons/shield.svg" alt="" style={{width: '28px', height: '28px', marginRight: '10px'}} />JWT Token Configuration</h2>

      {success && (
        <div className={cssStyles.success}>
          {success}
        </div>
      )}

      {/* Information Section */}
      <div className={cssStyles.infoSection}>
        <h3 className={cssStyles.sectionTitle}>Information</h3>
        <div className={cssStyles.infoCard}>
          <h4 className={cssStyles.infoTitle}>
            JWT Token Configuration Status: {tokenConfig.jwtSettings.secret ? 
              <span className={cssStyles.statusConfigured}>Configured</span> : 
              <span className={cssStyles.statusNotConfigured}>Not Configured</span>
            }
          </h4>
          <p className={cssStyles.infoText}>
            JWT tokens are used for authentication and authorization in your application.
          </p>
          {tokenConfig.jwtSettings.secret && (
            <>
              <p className={cssStyles.infoText}>
                <strong>Current Issuer:</strong> {tokenConfig.jwtSettings.issuer || 'Not set'}
              </p>
              <p className={cssStyles.infoText}>
                <strong>Current Audience:</strong> {tokenConfig.jwtSettings.audience || 'Not set'}
              </p>
              <p className={cssStyles.infoText}>
                <strong>Token Expiry:</strong> {tokenConfig.jwtSettings.tokenExpiryMinutes ? 
                  `${tokenConfig.jwtSettings.tokenExpiryMinutes} minutes` : 
                  'Using system default'
                }
              </p>
            </>
          )}
          <div className={cssStyles.warningBox}>
            <p className={cssStyles.warningText}>
              <strong>⚠️ Security Notice:</strong> Changing the JWT secret, issuer, or audience will invalidate all existing JWT tokens. 
              Users will need to log in again after these changes are saved. Token expiry changes only affect new logins.
            </p>
          </div>
        </div>
      </div>

      {/* JWT Settings Section */}
      <div className={cssStyles.section}>
        <h3 className={cssStyles.sectionTitle}>JWT Settings</h3>
        
        {error && (
          <div className={cssStyles.error}>
            {error}
          </div>
        )}
        
        <div className={cssStyles.formGroup}>
          <label className={cssStyles.label}>JWT Secret</label>
          <div className={cssStyles.secretInputGroup}>
            <input
              type="password"
              value={tokenConfig.jwtSettings.secret}
              onChange={(e) => setTokenConfig(prev => ({
                ...prev,
                jwtSettings: {
                  ...prev.jwtSettings,
                  secret: e.target.value
                }
              }))}
              placeholder="Enter JWT signing secret"
              className={cssStyles.input}
            />
            <button
              onClick={generateSecret}
              className={cssStyles.generateButton}
              type="button"
              title="Generate a new secure secret"
            >
              Generate
            </button>
          </div>
          <small className={cssStyles.helpText}>
            Keep this secret safe and do not expose it. Used to sign JWT tokens. Must be at least 32 characters long. Click "Generate" to create a secure random secret.
          </small>
        </div>

        <div className={cssStyles.formGroup}>
          <label className={cssStyles.label}>Token Issuer</label>
          <input
            type="text"
            value={tokenConfig.jwtSettings.issuer}
            onChange={(e) => setTokenConfig(prev => ({
              ...prev,
              jwtSettings: {
                ...prev.jwtSettings,
                issuer: e.target.value
              }
            }))}
            placeholder="Enter token issuer (e.g., your-app-name)"
            className={cssStyles.input}
          />
          <small className={cssStyles.helpText}>
            The issuer identifies who created and signed the token.
          </small>
        </div>

        <div className={cssStyles.formGroup}>
          <label className={cssStyles.label}>Token Audience</label>
          <input
            type="text"
            value={tokenConfig.jwtSettings.audience}
            onChange={(e) => setTokenConfig(prev => ({
              ...prev,
              jwtSettings: {
                ...prev.jwtSettings,
                audience: e.target.value
              }
            }))}
            placeholder="Enter token audience (e.g., your-app-users)"
            className={cssStyles.input}
          />
          <small className={cssStyles.helpText}>
            The audience identifies who the token is intended for.
          </small>
        </div>

        <div className={cssStyles.formGroup}>
          <label className={cssStyles.label}>Token Expiry (Minutes)</label>
          <input
            type="number"
            value={tokenConfig.jwtSettings.tokenExpiryMinutes || ''}
            onChange={(e) => setTokenConfig(prev => ({
              ...prev,
              jwtSettings: {
                ...prev.jwtSettings,
                tokenExpiryMinutes: e.target.value ? parseInt(e.target.value) : undefined
              }
            }))}
            placeholder="Enter expiry in minutes (60-43200)"
            className={cssStyles.input}
            min="60"
            max="43200"
          />
          <small className={cssStyles.helpText}>
            How long tokens remain valid before expiring. Must be between 60 minutes (1 hour) and 43,200 minutes (30 days). Leave empty to use system default. This will apply to new logins only - existing tokens will remain untouched.
          </small>
        </div>

        <div className={cssStyles.buttonGroup}>
          <button
            onClick={handleSaveTokenOptions}
            disabled={loading || !hasUnsavedChanges()}
            className={`${cssStyles.button} ${cssStyles.saveButton}`}
          >
            {loading ? 'Saving...' : 'Save Token Configuration'}
          </button>
          
          {hasUnsavedChanges() && (
            <button
              onClick={handleReset}
              disabled={loading}
              className={`${cssStyles.button} ${cssStyles.resetButton}`}
            >
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
    </>
  );
};

export default TokenManagement;