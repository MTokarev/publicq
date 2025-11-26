import React, { useState, useEffect } from 'react';
import { configurationService } from '../../services/configurationService';
import { EmailOption } from '../../models/email-option';
import { MessageProvider } from '../../models/MessageProvider';
import { SmtpOptions } from '../../models/smtp-options';
import styles from './EmailManagement.module.css';

// Utility function for conditional class names
const cn = (...classes: (string | undefined | false)[]): string => 
  classes.filter(Boolean).join(' ');

interface EmailManagementProps {
  emailConfig: {
    enabled: boolean;
    messageProvider: MessageProvider;
    sendFrom: string;
    dataLoaded: boolean;
  };
  setEmailConfig: React.Dispatch<React.SetStateAction<{
    enabled: boolean;
    messageProvider: MessageProvider;
    sendFrom: string;
    dataLoaded: boolean;
  }>>;
}

const EmailManagement: React.FC<EmailManagementProps> = ({ emailConfig: emailOptions, setEmailConfig: setEmailOptions }) => {
  const [originalOptions, setOriginalOptions] = useState<EmailOption>({
    enabled: false,
    messageProvider: MessageProvider.Sendgrid,
    sendFrom: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sendgridApiKey, setSendgridApiKey] = useState('');
  
  // SMTP configuration state
  const [smtpOptions, setSmtpOptions] = useState<SmtpOptions>({
    smtpHost: '',
    smtpPort: 587,
    userName: '',
    password: '',
    useStartTls: true,
    useSsl: false
  });
  const [smtpLoaded, setSmtpLoaded] = useState(false);

  useEffect(() => {
    if (emailOptions.dataLoaded) {
      return;
    }
    loadEmailOptions();
  }, []);

  // Load SMTP options when SMTP provider is selected
  useEffect(() => {
    if (emailOptions.messageProvider === MessageProvider.Smtp && emailOptions.enabled && !smtpLoaded) {
      loadSmtpOptions();
    }
  }, [emailOptions.messageProvider, emailOptions.enabled, smtpLoaded]);

  const loadEmailOptions = async () => {
    setLoading(true);
    setError('');
    try {
      const options = await configurationService.getEmailOptions();
      setEmailOptions({...options, dataLoaded: true});
      setOriginalOptions(options);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load email configuration');
    } finally {
      setLoading(false);
    }
  };

  const loadSmtpOptions = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await configurationService.getSmtpOptions();
      if (response.isSuccess && response.data) {
        setSmtpOptions(response.data);
      }
      setSmtpLoaded(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load SMTP configuration');
      setSmtpLoaded(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEmailOptions = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await configurationService.setEmailOptions(emailOptions);
      setOriginalOptions(emailOptions);
      setSuccess('Email configuration saved successfully');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save email configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSendgridOptions = async () => {
    if (!sendgridApiKey.trim()) {
      setError('SendGrid API Key is required');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await configurationService.setSendgridOptions(sendgridApiKey);
      setSuccess('SendGrid configuration saved successfully');
      setSendgridApiKey('');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save SendGrid configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSmtpOptions = async () => {
    // Validation
    if (!smtpOptions.smtpHost.trim()) {
      setError('SMTP Host is required');
      return;
    }
    if (smtpOptions.smtpPort < 1 || smtpOptions.smtpPort > 65535) {
      setError('SMTP Port must be between 1 and 65535');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await configurationService.setSmtpOptions(smtpOptions);
      if (response.isSuccess) {
        setSuccess('SMTP configuration saved successfully');
      } else {
        setError(response.message || 'Failed to save SMTP configuration');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save SMTP configuration');
    } finally {
      setLoading(false);
    }
  };

  const hasUnsavedChanges = () => {
    return emailOptions.enabled !== originalOptions.enabled ||
           emailOptions.messageProvider !== originalOptions.messageProvider || 
           emailOptions.sendFrom !== originalOptions.sendFrom;
  };

  const handleReset = () => {
    setEmailOptions({ ...originalOptions, dataLoaded: true });
    setError('');
    setSuccess('');
  };

  if (loading && !emailOptions.sendFrom) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingText}>Loading email configuration...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title} style={{display: 'flex', alignItems: 'center'}}><img src="/images/icons/email.svg" alt="" style={{width: '28px', height: '28px', marginRight: '10px'}} />Email Configuration</h2>
      
      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}
      
      {success && (
        <div className={styles.success}>
          {success}
        </div>
      )}

      {/* Information Section */}
      <div className={styles.infoSection}>
        <h3 className={styles.sectionTitle}>Information</h3>
        <div className={styles.infoCard}>
          <h4 className={styles.infoTitle}>
            Email Service Status: {originalOptions.enabled ? 
              <span className={styles.statusEnabled}>Enabled</span> : 
              <span className={styles.statusDisabled}>Disabled</span>
            }
          </h4>
          <p className={styles.infoText}>
            Email service is currently <strong>{originalOptions.enabled ? 'enabled' : 'disabled'}</strong>.
            {originalOptions.enabled ? (
              <> The system will send emails using the configured provider below.</>
            ) : (
              <> No emails will be sent until the service is enabled.</>
            )}
          </p>
          {originalOptions.enabled && (
            <>
              <p className={styles.infoText}>
                <strong>Current Provider:</strong> {originalOptions.messageProvider}
                {originalOptions.messageProvider === MessageProvider.Sendgrid && (
                  <> - SendGrid is a cloud-based email delivery service that helps ensure your emails reach the inbox.</>
                )}
              </p>
              <p className={styles.infoText}>
                <strong>From Address:</strong> {originalOptions.sendFrom || 'Not configured'}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Email Options Section */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Email Options</h3>
        
        <div className={styles.formGroup}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={emailOptions.enabled}
              onChange={(e) => setEmailOptions({
                ...emailOptions,
                enabled: e.target.checked
              })}
              className={styles.checkbox}
            />
            <span className={styles.checkboxText}>Enable Email Service</span>
          </label>
          <small className={styles.helpText}>
            When enabled, the system will send emails using the configured provider and settings below.
          </small>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Message Provider</label>
          <select
            value={emailOptions.messageProvider}
            onChange={(e) => setEmailOptions({
              ...emailOptions,
              messageProvider: e.target.value as MessageProvider
            })}
            className={cn(styles.select, !emailOptions.enabled && 'opacity-60')}
            disabled={!emailOptions.enabled}
          >
            {Object.values(MessageProvider).map((provider) => (
              <option key={provider} value={provider}>
                {provider}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>From Address</label>
          <input
            type="email"
            value={emailOptions.sendFrom}
            onChange={(e) => setEmailOptions({
              ...emailOptions,
              sendFrom: e.target.value
            })}
            placeholder="Enter sender email address"
            className={cn(styles.input, !emailOptions.enabled && 'opacity-60')}
            disabled={!emailOptions.enabled}
          />
          <small className={styles.helpText}>
            This email address will be used as the sender for all outgoing emails.
          </small>
        </div>

        <div className={styles.buttonGroup}>
          <button
            onClick={handleSaveEmailOptions}
            disabled={loading || !hasUnsavedChanges()}
            className={cn(styles.saveButton, (loading || !hasUnsavedChanges()) && 'opacity-60')}
          >
            {loading ? 'Saving...' : 'Save Email Options'}
          </button>
          
          {hasUnsavedChanges() && (
            <button
              onClick={handleReset}
              disabled={loading}
              className={styles.resetButton}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Provider-specific Configuration */}
      {emailOptions.messageProvider === MessageProvider.Sendgrid && emailOptions.enabled && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>SendGrid Configuration</h3>
          <div className={styles.formGroup}>
            <label className={styles.label}>API Key</label>
            <input
              type="password"
              value={sendgridApiKey}
              onChange={(e) => setSendgridApiKey(e.target.value)}
              placeholder="Enter SendGrid API Key"
              className={styles.input}
            />
            <small className={styles.helpText}>
              Enter your SendGrid API key to enable email sending through SendGrid.
            </small>
          </div>

          <button
            onClick={handleSaveSendgridOptions}
            disabled={loading || !sendgridApiKey.trim()}
            className={cn(styles.saveButton, (loading || !sendgridApiKey.trim()) && 'opacity-60')}
          >
            {loading ? 'Saving...' : 'Save SendGrid API Key'}
          </button>
        </div>
      )}

      {/* SMTP Configuration */}
      {emailOptions.messageProvider === MessageProvider.Smtp && emailOptions.enabled && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>SMTP Configuration</h3>
          
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>SMTP Host *</label>
              <input
                type="text"
                value={smtpOptions.smtpHost}
                onChange={(e) => setSmtpOptions({...smtpOptions, smtpHost: e.target.value})}
                placeholder="smtp.example.com"
                className={styles.input}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>SMTP Port *</label>
              <input
                type="number"
                value={smtpOptions.smtpPort}
                onChange={(e) => setSmtpOptions({...smtpOptions, smtpPort: parseInt(e.target.value) || 587})}
                placeholder="587"
                min="1"
                max="65535"
                className={styles.input}
                style={{width: '120px'}}
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Username</label>
              <input
                type="text"
                value={smtpOptions.userName || ''}
                onChange={(e) => setSmtpOptions({...smtpOptions, userName: e.target.value})}
                placeholder="Optional: SMTP username"
                className={styles.input}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Password</label>
              <input
                type="password"
                value={smtpOptions.password || ''}
                onChange={(e) => setSmtpOptions({...smtpOptions, password: e.target.value})}
                placeholder="Optional: SMTP password"
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={smtpOptions.useStartTls}
                  onChange={(e) => setSmtpOptions({...smtpOptions, useStartTls: e.target.checked})}
                  className={styles.checkbox}
                />
                Use STARTTLS
              </label>
              <small className={styles.helpText}>
                Enable STARTTLS encryption for secure email transmission.
              </small>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={smtpOptions.useSsl}
                  onChange={(e) => setSmtpOptions({...smtpOptions, useSsl: e.target.checked})}
                  className={styles.checkbox}
                />
                Use SSL/TLS
              </label>
              <small className={styles.helpText}>
                Enable SSL/TLS encryption for secure SMTP connection.
              </small>
            </div>
          </div>

          <button
            onClick={handleSaveSmtpOptions}
            disabled={loading || !smtpOptions.smtpHost.trim()}
            className={cn(styles.saveButton, (loading || !smtpOptions.smtpHost.trim()) && 'opacity-60')}
          >
            {loading ? 'Saving...' : 'Save SMTP Configuration'}
          </button>
        </div>
      )}
    </div>
  );
};

export default EmailManagement;
