import React, { useState, useEffect } from 'react';
import { configurationService } from '../../services/configurationService';
import { IpRateLimitOptions } from '../../models/ip-rate-limit-options';
import { IpRateLimitUpdateRequest } from '../../models/ip-rate-limit-update-request';
import { GenericOperationStatuses } from '../../models/GenericOperationStatuses';
import styles from './IpRateLimiting.module.css';

interface IpRateLimitingProps {
  onStatusChange?: (message: string, isError: boolean) => void;
}

const IpRateLimiting: React.FC<IpRateLimitingProps> = ({ onStatusChange }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmRestart, setConfirmRestart] = useState(false);
  const [rateLimitOptions, setRateLimitOptions] = useState<IpRateLimitOptions | null>(null);
  const [updateRequest, setUpdateRequest] = useState<IpRateLimitUpdateRequest>({
    enabled: true,
    ipWhitelist: [],
    realIpHeader: 'X-Forwarded-For',
    limit: 100,
    periodInSeconds: 60
  });
  const [originalRequest, setOriginalRequest] = useState<IpRateLimitUpdateRequest>({
    enabled: true,
    ipWhitelist: [],
    realIpHeader: 'X-Forwarded-For',
    limit: 100,
    periodInSeconds: 60
  });
  const [newWhitelistIp, setNewWhitelistIp] = useState('');

  useEffect(() => {
    loadRateLimitOptions();
  }, []);

  const loadRateLimitOptions = async () => {
    try {
      setLoading(true);
      const response = await configurationService.getIpRateLimitOptions();
      
      if (response.status === GenericOperationStatuses.Completed && response.data) {
        setRateLimitOptions(response.data);
        
        // Initialize update request with current values
        const generalRule = response.data.generalRules?.[0];
        if (generalRule) {
          const periodInSeconds = parsePeriodToSeconds(generalRule.period);
          const isEnabled = generalRule.endpoint === "*";
          const currentConfig = {
            enabled: isEnabled,
            ipWhitelist: [...(response.data.ipWhitelist || [])],
            realIpHeader: response.data.realIpHeader || 'X-Forwarded-For',
            limit: generalRule.limit,
            periodInSeconds: periodInSeconds
          };
          setUpdateRequest(currentConfig);
          setOriginalRequest(currentConfig); // Store original for comparison
        } else {
          // No rules exist, default to disabled
          const currentConfig = {
            enabled: false,
            ipWhitelist: [...(response.data.ipWhitelist || [])],
            realIpHeader: response.data.realIpHeader || 'X-Forwarded-For',
            limit: 100,
            periodInSeconds: 60
          };
          setUpdateRequest(currentConfig);
          setOriginalRequest(currentConfig); // Store original for comparison
        }
      }
    } catch (error) {
      onStatusChange?.('Failed to load rate limiting configuration', true);
    } finally {
      setLoading(false);
    }
  };

  const parsePeriodToSeconds = (period: string): number => {
    const match = period.match(/^(\d+)([smhd])$/);
    if (!match) return 60;
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 3600;
      case 'd': return value * 86400;
      default: return 60;
    }
  };

  // Check if current settings differ from original loaded settings
  const hasChanges = (): boolean => {
    if (!originalRequest) return false;
    
    return (
      updateRequest.enabled !== originalRequest.enabled ||
      updateRequest.limit !== originalRequest.limit ||
      updateRequest.periodInSeconds !== originalRequest.periodInSeconds ||
      updateRequest.realIpHeader !== originalRequest.realIpHeader ||
      updateRequest.ipWhitelist.length !== originalRequest.ipWhitelist.length ||
      updateRequest.ipWhitelist.some((ip, index) => ip !== originalRequest.ipWhitelist[index])
    );
  };

  const handleUpdateRateLimit = async () => {
    setShowConfirmModal(true);
  };

  const handleConfirmUpdate = async () => {
    if (!confirmRestart) {
      return; // User must confirm they will restart the app
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      setShowConfirmModal(false);
      
      const response = await configurationService.updateIpRateLimitSettings(updateRequest);
      
      if (response.status === GenericOperationStatuses.Completed) {
        setSuccess('Rate limiting configuration updated successfully');
        onStatusChange?.('Rate limiting configuration updated successfully', false);
        await loadRateLimitOptions(); // Reload to get updated values
      } else {
        // Handle validation errors from server response
        let errorMessage = 'Failed to update rate limiting configuration';
        
        if (response.errors && response.errors.length > 0) {
          // Use server validation messages
          errorMessage = response.errors.join('\n');
        } else if (response.message) {
          // Use server message if no specific errors
          errorMessage = response.message;
        }
        
        setError(errorMessage);
        onStatusChange?.(errorMessage, true);
      }
    } catch (error: any) {
      
      // Handle axios errors that might contain server response
      let errorMessage = 'Failed to update rate limiting configuration';
      
      if (error.response?.data) {
        const serverResponse = error.response.data;
        
        if (serverResponse.errors && serverResponse.errors.length > 0) {
          errorMessage = serverResponse.errors.join('\n');
        } else if (serverResponse.message) {
          errorMessage = serverResponse.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      onStatusChange?.(errorMessage, true);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelUpdate = () => {
    setShowConfirmModal(false);
    setConfirmRestart(false);
  };

  const addToWhitelist = () => {
    if (newWhitelistIp.trim() && !updateRequest.ipWhitelist.includes(newWhitelistIp.trim())) {
      setUpdateRequest(prev => ({
        ...prev,
        ipWhitelist: [...prev.ipWhitelist, newWhitelistIp.trim()]
      }));
      setNewWhitelistIp('');
    }
  };

  const removeFromWhitelist = (ip: string) => {
    setUpdateRequest(prev => ({
      ...prev,
      ipWhitelist: prev.ipWhitelist.filter(whitelistIp => whitelistIp !== ip)
    }));
  };

  const handleInputChange = (field: keyof IpRateLimitUpdateRequest, value: any) => {
    setUpdateRequest(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading && !rateLimitOptions) {
    return (
      <div className={styles.container}>
        <h2 className={styles.title} style={{display: 'flex', alignItems: 'center'}}><img src="/images/icons/shield.svg" alt="" style={{width: '28px', height: '28px', marginRight: '10px'}} />IP Rate Limiting</h2>
        <div>Loading configuration...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title} style={{display: 'flex', alignItems: 'center'}}><img src="/images/icons/shield.svg" alt="" style={{width: '28px', height: '28px', marginRight: '10px'}} />IP Rate Limiting</h2>
      
      {success && (
        <div className={styles.successMessage}>
          {success}
        </div>
      )}

      {error && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}

      {rateLimitOptions && (
        <div className={styles.infoSection}>
          <div className={styles.sectionTitle}>Current Status</div>
          <div className={styles.infoCard}>
            <h4 className={styles.infoTitle}>
              Status: {rateLimitOptions.generalRules && rateLimitOptions.generalRules.length > 0 && rateLimitOptions.generalRules[0].endpoint === "*" ? 
                <span className={styles.statusConfigured}>Enabled</span> : 
                <span className={styles.statusNotConfigured}>Disabled</span>
              }
            </h4>
            <p className={styles.infoText}>
              IP rate limiting helps protect your application from abuse by limiting the number of requests from individual IP addresses.
            </p>
            {rateLimitOptions.generalRules && rateLimitOptions.generalRules.length > 0 && (
              <p className={styles.infoText}>
                <strong>Current Rule:</strong> {rateLimitOptions.generalRules[0].limit} requests per {rateLimitOptions.generalRules[0].period}
              </p>
            )}
            <p className={styles.infoText}>
              <strong>Real IP Header:</strong> {rateLimitOptions.realIpHeader}
            </p>
          </div>
        </div>
      )}

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Enable Rate Limiting</div>
        <div className={styles.formGroup}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={updateRequest.enabled}
              onChange={(e) => setUpdateRequest(prev => ({ ...prev, enabled: e.target.checked }))}
              className={styles.checkbox}
            />
            Enable IP rate limiting for all endpoints
          </label>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Rate Limiting Rules</div>
        <div className={styles.row}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Request Limit</label>
            <input
              type="number"
              className={styles.input}
              value={updateRequest.limit}
              onChange={(e) => handleInputChange('limit', parseInt(e.target.value) || 0)}
              min="1"
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Period (seconds)</label>
            <input
              type="number"
              className={styles.input}
              value={updateRequest.periodInSeconds}
              onChange={(e) => handleInputChange('periodInSeconds', parseInt(e.target.value) || 60)}
              min="1"
            />
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Real IP Header</div>
        <label className={styles.label}>
          Header name used to determine real client IP (when behind proxy)
          <br />
          <small style={{ color: '#6c757d', fontSize: '0.8em', fontStyle: 'italic' }}>
            ⚠️ If not configured properly and the app is behind a proxy, rate limiting might block requests from different IPs 
            because the application will see the proxy address instead. Ensure your proxy is configured to pass the real IP in this header.
          </small>
        </label>
        <input
          type="text"
          className={styles.input}
          value={updateRequest.realIpHeader}
          onChange={(e) => handleInputChange('realIpHeader', e.target.value)}
          placeholder="X-Forwarded-For"
        />
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>IP Whitelist</div>
        <label className={styles.label}>
          IP addresses exempt from rate limiting
        </label>
        <div className={styles.row}>
          <div style={{ flex: 1 }}>
            <input
              type="text"
              className={styles.input}
              value={newWhitelistIp}
              onChange={(e) => setNewWhitelistIp(e.target.value)}
              placeholder="Enter IP address (e.g., 192.168.1.1 or ::1)"
              onKeyPress={(e) => e.key === 'Enter' && addToWhitelist()}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button className={styles.button} onClick={addToWhitelist}>
              Add IP
            </button>
          </div>
        </div>
        
        <div className={styles.whitelistContainer}>
          {updateRequest.ipWhitelist.length === 0 ? (
            <div style={{ color: '#6c757d', fontStyle: 'italic' }}>
              No IP addresses whitelisted
            </div>
          ) : (
            updateRequest.ipWhitelist.map((ip, index) => (
              <span key={index} className={styles.whitelistItem}>
                {ip}
                <button
                  className={styles.buttonSecondary}
                  style={{ marginLeft: '8px' }}
                  onClick={() => removeFromWhitelist(ip)}
                >
                  ×
                </button>
              </span>
            ))
          )}
        </div>
      </div>

      <div style={{ marginTop: '16px' }}>
        <button
          className={styles.button}
          style={{
            backgroundColor: loading ? '#6c757d' : (hasChanges() ? '#28a745' : '#6c757d'),
            cursor: loading || !hasChanges() ? 'not-allowed' : 'pointer'
          }}
          onClick={handleUpdateRateLimit}
          disabled={loading || !hasChanges()}
        >
          {loading ? 'Updating...' : 'Update Rate Limiting'}
        </button>
        {!hasChanges() && !loading && (
          <p style={{ 
            marginTop: '8px', 
            fontSize: '0.9em', 
            color: '#6c757d',
            fontStyle: 'italic' 
          }}>
            No changes to save
          </p>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className={styles.modalOverlay} onClick={handleCancelUpdate}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>⚠️ Confirm Rate Limiting Update</h3>
            
            <p className={styles.modalText}>
              You are about to update the IP rate limiting configuration. This change will take effect immediately, 
              but for full functionality, you must manually restart the application.
            </p>
            
            <div className={styles.checkboxContainer}>
              <input
                type="checkbox"
                id="confirmRestart"
                checked={confirmRestart}
                onChange={(e) => setConfirmRestart(e.target.checked)}
                style={{ marginTop: '2px' }}
              />
              <label htmlFor="confirmRestart" className={styles.checkboxText}>
                I understand that I need to manually restart the application for the changes to take full effect.
              </label>
            </div>
            
            <div className={styles.modalButtons}>
              <button
                className={styles.modalButtonSecondary}
                onClick={handleCancelUpdate}
              >
                Cancel
              </button>
              <button
                className={styles.modalButtonPrimary}
                style={{
                  opacity: confirmRestart ? 1 : 0.5,
                  cursor: confirmRestart ? 'pointer' : 'not-allowed'
                }}
                onClick={handleConfirmUpdate}
                disabled={!confirmRestart}
              >
                Update Configuration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IpRateLimiting;