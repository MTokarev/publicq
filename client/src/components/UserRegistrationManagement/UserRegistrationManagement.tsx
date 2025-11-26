import React, { useState, useEffect } from 'react';
import { configurationService } from '../../services/configurationService';

interface UserRegistrationManagementProps {
  userRegistrationConfig: { enabled: boolean; dataLoaded: boolean };
  setUserRegistrationConfig: React.Dispatch<React.SetStateAction<{ enabled: boolean; dataLoaded: boolean }>>;
}

const UserRegistrationManagement: React.FC<UserRegistrationManagementProps> = ({ 
  userRegistrationConfig, 
  setUserRegistrationConfig 
}) => {
  const [originalEnabled, setOriginalEnabled] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (userRegistrationConfig.dataLoaded) {
      return;
    }
    loadUserRegistrationOptions();
  }, []);

  const loadUserRegistrationOptions = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await configurationService.getSelfServiceRegistration();
      const enabled = response.data;
      setUserRegistrationConfig({ enabled, dataLoaded: true });
      setOriginalEnabled(enabled);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load user registration configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleChange = async (enabled: boolean) => {
    setUserRegistrationConfig({ ...userRegistrationConfig, enabled });
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await configurationService.setSelfServiceRegistration(enabled);
      setOriginalEnabled(enabled);
      setSuccess(`User registration ${enabled ? 'enabled' : 'disabled'} successfully`);
    } catch (err: any) {
      // Revert the toggle if the API call failed
      setUserRegistrationConfig({ ...userRegistrationConfig, enabled: originalEnabled });
      setError(err?.response?.data?.message || 'Failed to save user registration settings');
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: {
      padding: '0',
      maxWidth: '800px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    } as React.CSSProperties,
    title: {
      fontSize: '1.5rem',
      fontWeight: 700,
      marginBottom: '30px',
      color: '#111827',
      letterSpacing: '-0.025em',
    } as React.CSSProperties,
    card: {
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      padding: '32px',
      marginBottom: '32px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      border: '1px solid #e5e7eb',
    } as React.CSSProperties,
    sectionTitle: {
      fontSize: '20px',
      fontWeight: 600,
      marginBottom: '24px',
      color: '#374151',
    } as React.CSSProperties,
    settingRow: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '24px',
      padding: '16px',
      backgroundColor: '#f9fafb',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
    } as React.CSSProperties,
    settingInfo: {
      flex: 1,
      marginRight: '24px',
    } as React.CSSProperties,
    settingLabel: {
      fontSize: '16px',
      fontWeight: 500,
      color: '#374151',
      marginBottom: '4px',
    } as React.CSSProperties,
    settingDescription: {
      fontSize: '14px',
      color: '#6b7280',
      lineHeight: '1.5',
    } as React.CSSProperties,
    toggleContainer: {
      position: 'relative',
      display: 'inline-block',
      width: '60px',
      height: '34px',
    } as React.CSSProperties,
    toggleInput: {
      opacity: 0,
      width: 0,
      height: 0,
      position: 'absolute',
    } as React.CSSProperties,
    toggleSlider: {
      position: 'absolute',
      cursor: 'pointer',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#ccc',
      transition: 'background-color 0.4s',
      borderRadius: '34px',
      width: '60px',
      height: '34px',
    } as React.CSSProperties,
    toggleSliderChecked: {
      backgroundColor: '#2196F3',
    } as React.CSSProperties,
    toggleButton: {
      position: 'absolute',
      height: '26px',
      width: '26px',
      left: '4px',
      top: '4px',
      backgroundColor: 'white',
      transition: 'transform 0.4s',
      borderRadius: '50%',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
    } as React.CSSProperties,
    toggleButtonChecked: {
      transform: 'translateX(26px)',
    } as React.CSSProperties,
    errorMessage: {
      backgroundColor: '#fef2f2',
      border: '1px solid #fecaca',
      borderRadius: '8px',
      padding: '12px 16px',
      marginTop: '16px',
      color: '#dc2626',
      fontSize: '14px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    } as React.CSSProperties,
    successMessage: {
      backgroundColor: '#f0fdf4',
      border: '1px solid #bbf7d0',
      borderRadius: '8px',
      padding: '12px 16px',
      marginTop: '16px',
      color: '#059669',
      fontSize: '14px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    } as React.CSSProperties,
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '12px',
    } as React.CSSProperties,
  };

  return (
    <div style={styles.container}>
      <h2 style={{...styles.title, display: 'flex', alignItems: 'center'}}><img src="/images/icons/person.svg" alt="" style={{width: '28px', height: '28px', marginRight: '10px'}} />User Registration Settings</h2>
      
      <div style={{ position: 'relative' }}>
        <div style={styles.card}>
          <h3 style={styles.sectionTitle}>Self-Service Registration</h3>
          
          <div style={styles.settingRow}>
            <div style={styles.settingInfo}>
              <div style={styles.settingLabel}>Enable User Registration</div>
              <div style={styles.settingDescription}>
                Allow users to create new accounts independently without admin intervention. 
                When disabled, only administrators can create user accounts.
              </div>
            </div>
            
            <div style={styles.toggleContainer}>
              <input
                type="checkbox"
                checked={userRegistrationConfig.enabled}
                onChange={(e) => handleToggleChange(e.target.checked)}
                style={styles.toggleInput}
                disabled={loading}
              />
              <span
                style={{
                  ...styles.toggleSlider,
                  ...(userRegistrationConfig.enabled ? styles.toggleSliderChecked : {}),
                }}
                onClick={() => !loading && handleToggleChange(!userRegistrationConfig.enabled)}
              >
                <span
                  style={{
                    ...styles.toggleButton,
                    ...(userRegistrationConfig.enabled ? styles.toggleButtonChecked : {}),
                  }}
                />
              </span>
            </div>
          </div>

          {error && (
            <div style={styles.errorMessage}>
              <img src="/images/icons/fail.svg" alt="Error" style={{width: '16px', height: '16px', marginRight: '6px', verticalAlign: 'middle', display: 'inline-block'}} />
              {error}
            </div>
          )}

          {success && (
            <div style={styles.successMessage}>
              <img src="/images/icons/check.svg" alt="Success" style={{width: '16px', height: '16px', marginRight: '6px', verticalAlign: 'middle', display: 'inline-block'}} />
              {success}
            </div>
          )}
        </div>

        {loading && (
          <div style={styles.loadingOverlay}>
            <div>Loading...</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserRegistrationManagement;