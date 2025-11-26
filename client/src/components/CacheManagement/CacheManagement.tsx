import React, { useState, useEffect } from 'react';
import { configurationService } from '../../services/configurationService';
import { CacheConfiguration } from '../../models/cache-configuration';
import { CacheService } from '../../services/cacheService';
import styles from './CacheManagement.module.css';

interface CacheManagementProps {
  cacheConfig: CacheConfiguration & { dataLoaded: boolean };
  setCacheConfig: React.Dispatch<React.SetStateAction<CacheConfiguration & { dataLoaded: boolean }>>;
}

const CacheManagement: React.FC<CacheManagementProps> = ({ cacheConfig, setCacheConfig }) => {
  const [originalOptions, setOriginalOptions] = useState<CacheConfiguration>({
    enable: false,
    connectionString: '',
    keyPrefix: '',
    reportCacheDurationInMinutes: 60
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [clearError, setClearError] = useState('');
  const [clearSuccess, setClearSuccess] = useState('');
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);
  const [healthStatus, setHealthStatus] = useState<{
    isHealthy: boolean;
    message: string;
    loading: boolean;
  }>({
    isHealthy: false,
    message: '',
    loading: false
  });

  useEffect(() => {
    if (cacheConfig.dataLoaded) {
      return;
    }
    loadCacheOptions();
  }, []);

  const loadCacheOptions = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await configurationService.getCacheOptions();
      const options = response.data;
      setCacheConfig({ ...options, dataLoaded: true });
      setOriginalOptions(options);
      
      // Check health if cache is enabled and connection string is available
      if (options.enable && options.connectionString) {
        await checkCacheHealth(options.connectionString);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load cache configuration');
    } finally {
      setLoading(false);
    }
  };

  const checkCacheHealth = async (connectionString: string) => {
    setHealthStatus(prev => ({ ...prev, loading: true }));
    try {
      const response = await CacheService.getCacheServiceHealth(connectionString);
      setHealthStatus({
        isHealthy: response.isSuccess,
        message: response.message || (response.isSuccess ? 'Redis connection is healthy' : 'Redis connection failed'),
        loading: false
      });
    } catch (err: any) {
      setHealthStatus({
        isHealthy: false,
        message: err?.response?.data?.message || 'Failed to check Redis health',
        loading: false
      });
    }
  };

  const validateForm = () => {
    if (cacheConfig.enable) {
      if (!cacheConfig.connectionString.trim()) {
        setError('Connection string is required when caching is enabled');
        return false;
      }
      if (!cacheConfig.keyPrefix.trim()) {
        setError('Key prefix is required when caching is enabled');
        return false;
      }
      if (cacheConfig.reportCacheDurationInMinutes < 1 || cacheConfig.reportCacheDurationInMinutes > 1440) {
        setError('Cache duration must be between 1 and 1440 minutes (1 day)');
        return false;
      }
    }
    return true;
  };

  const handleSaveCacheOptions = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const { dataLoaded, ...optionsToSave } = cacheConfig;
      
      // Check health before saving if cache is enabled and connection string is provided
      if (optionsToSave.enable && optionsToSave.connectionString) {
        const healthResponse = await CacheService.getCacheServiceHealth(optionsToSave.connectionString);
        
        if (!healthResponse.isSuccess) {
          setError(`Redis connection failed: ${healthResponse.message || 'Unable to connect to Redis server'}`);
          return;
        }
      }
      
      // Save configuration after health check passes (or if cache disabled)
      await configurationService.setCacheOptions(optionsToSave);
      setOriginalOptions(optionsToSave);
      
      // Update health status after successful save
      if (optionsToSave.enable && optionsToSave.connectionString) {
        setHealthStatus({
          isHealthy: true,
          message: 'Connection successful',
          loading: false
        });
      } else {
        // Reset health status if cache is disabled
        setHealthStatus({ isHealthy: false, message: '', loading: false });
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save cache configuration');
    } finally {
      setLoading(false);
    }
  };

  const hasUnsavedChanges = () => {
    return cacheConfig.enable !== originalOptions.enable ||
           cacheConfig.connectionString !== originalOptions.connectionString ||
           cacheConfig.keyPrefix !== originalOptions.keyPrefix ||
           cacheConfig.reportCacheDurationInMinutes !== originalOptions.reportCacheDurationInMinutes;
  };

  const handleReset = () => {
    setCacheConfig({ ...originalOptions, dataLoaded: true });
    setError('');
  };

  const handleClearAllCache = async () => {
    setClearLoading(true);
    setClearError('');
    setClearSuccess('');
    
    try {
      const response = await CacheService.clearAllCache();
      if (response.isSuccess) {
        // Use the actual message from the API response
        setClearSuccess(response.message || 'Cache operation completed successfully');
      } else {
        setClearError(response.message || 'Failed to clear cache entries');
      }
    } catch (err: any) {
      setClearError(err?.response?.data?.message || 'Failed to clear cache');
    } finally {
      setClearLoading(false);
      setShowClearModal(false);
    }
  };

  if (loading && !cacheConfig.keyPrefix) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingText}>Loading cache configuration...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title} style={{display: 'flex', alignItems: 'center'}}><img src="/images/icons/sparkles.svg" alt="" style={{width: '28px', height: '28px', marginRight: '10px'}} />Cache Configuration</h2>
      
      {/* Information Section */}
      <div className={styles.infoSection}>
        <h3 className={styles.sectionTitle}>Information</h3>
        <div className={styles.infoCard}>
          <h4 className={styles.infoTitle}>
            Cache Service Status: {originalOptions.enable ? 
              <span style={{color: 'var(--color-success)', fontWeight: 'var(--font-weight-medium)'}}>Enabled</span> : 
              <span style={{color: 'var(--color-error)', fontWeight: 'var(--font-weight-medium)'}}>Disabled</span>
            }
          </h4>
          <p className={styles.infoText}>
            Caching service is currently <strong>{originalOptions.enable ? 'enabled' : 'disabled'}</strong>.
            {originalOptions.enable ? (
              <> The system will cache database query results to improve performance, especially for reports and heavy operations.</>
            ) : (
              <> No caching will be performed and all requests will hit the database directly.</>
            )}
          </p>
          {originalOptions.enable && (
            <>
              <p className={styles.infoText}>
                <strong>Connection:</strong> {originalOptions.connectionString || 'Not configured'}
              </p>
              <p className={styles.infoText}>
                <strong>Key Prefix:</strong> {originalOptions.keyPrefix || 'Not configured'}
              </p>
              <p className={styles.infoText}>
                <strong>Report Cache Duration:</strong> {originalOptions.reportCacheDurationInMinutes} minutes
              </p>
              
              {/* Integrated Health Status */}
              {cacheConfig.connectionString && (
                <p className={styles.infoText}>
                  <strong>Redis Health:</strong> {healthStatus.loading ? (
                    <>
                      <img src="/images/icons/progress.svg" alt="Loading" style={{width: '16px', height: '16px', marginRight: '6px', verticalAlign: 'middle', display: 'inline-block'}} /> Checking...
                    </>
                  ) : healthStatus.message ? (
                    <>
                      <img src={healthStatus.isHealthy ? '/images/icons/check.svg' : '/images/icons/fail.svg'} alt={healthStatus.isHealthy ? 'Connected' : 'Failed'} style={{width: '16px', height: '16px', marginRight: '6px', verticalAlign: 'middle', display: 'inline-block'}} />
                      {healthStatus.isHealthy ? 'Connected' : 'Connection Failed'}
                    </>
                  ) : (
                    <>
                      <img src="/images/icons/information.svg" alt="Not checked" style={{width: '16px', height: '16px', marginRight: '6px', verticalAlign: 'middle', display: 'inline-block'}} /> Not checked yet
                    </>
                  )}
                </p>
              )}
              
              {!cacheConfig.connectionString && (
                <p className={styles.infoText}>
                  <strong>Redis Health:</strong> <span className={styles.healthIcon}>⚠️</span> Connection string required
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Cache Options Section */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Cache Options</h3>
        
        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}
        
        <div className={styles.formGroup}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={cacheConfig.enable}
              onChange={(e) => setCacheConfig({
                ...cacheConfig,
                enable: e.target.checked
              })}
              className={styles.checkbox}
            />
            <span className={styles.checkboxText}>Enable Cache Service</span>
          </label>
          <small className={styles.helpText}>
            When enabled, the system will cache database results using Redis to improve performance.
          </small>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Connection String</label>
          <input
            type="text"
            value={cacheConfig.connectionString}
            onChange={(e) => setCacheConfig({
              ...cacheConfig,
              connectionString: e.target.value
            })}
            placeholder="Enter Redis connection string (e.g., localhost:6379)"
            className={styles.input}
            style={{
              opacity: cacheConfig.enable ? 1 : 0.6,
              cursor: cacheConfig.enable ? 'text' : 'not-allowed'
            }}
            disabled={!cacheConfig.enable}
          />
          <small className={styles.helpText}>
            Redis server connection string. Format: hostname:port or full connection string.
          </small>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Key Prefix</label>
          <input
            type="text"
            value={cacheConfig.keyPrefix}
            onChange={(e) => setCacheConfig({
              ...cacheConfig,
              keyPrefix: e.target.value
            })}
            placeholder="Enter cache key prefix (e.g., PublicQ)"
            className={styles.input}
            style={{
              opacity: cacheConfig.enable ? 1 : 0.6,
              cursor: cacheConfig.enable ? 'text' : 'not-allowed'
            }}
            disabled={!cacheConfig.enable}
          />
          <small className={styles.helpText}>
            Prefix added to all cache keys to avoid conflicts with other applications using the same Redis instance.
          </small>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Report Cache Duration (Minutes)</label>
          <input
            type="number"
            min="1"
            max="1440"
            value={cacheConfig.reportCacheDurationInMinutes}
            onChange={(e) => setCacheConfig({
              ...cacheConfig,
              reportCacheDurationInMinutes: parseInt(e.target.value) || 1
            })}
            className={styles.input}
            style={{
              opacity: cacheConfig.enable ? 1 : 0.6,
              cursor: cacheConfig.enable ? 'text' : 'not-allowed'
            }}
            disabled={!cacheConfig.enable}
          />
          <small className={styles.helpText}>
            How long to cache report results in minutes. Range: 1-1440 (1 day max). Longer duration improves performance but may show stale data.
          </small>
        </div>

        <div className={styles.buttonGroup}>
          <button
            onClick={handleSaveCacheOptions}
            disabled={loading || !hasUnsavedChanges()}
            className={styles.saveButton}
            style={{
              opacity: loading || !hasUnsavedChanges() ? 0.6 : 1,
              cursor: loading || !hasUnsavedChanges() ? 'not-allowed' : 'pointer'
            }}
            onMouseEnter={(e) => {
              if (!loading && hasUnsavedChanges()) {
                e.currentTarget.style.backgroundColor = '#2563eb';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(59, 130, 246, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading && hasUnsavedChanges()) {
                e.currentTarget.style.backgroundColor = '#3b82f6';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
              }
            }}
          >
            {loading ? 'Saving...' : 'Save Cache Configuration'}
          </button>
          
          {hasUnsavedChanges() && (
            <button
              onClick={handleReset}
              disabled={loading}
              className={styles.resetButton}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                  e.currentTarget.style.borderColor = '#9ca3af';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = '#ffffff';
                  e.currentTarget.style.borderColor = '#d1d5db';
                }
              }}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Cache Performance Info */}
      {originalOptions.enable && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Performance Information</h3>
          <div className={styles.performanceGrid}>
            <div className={styles.performanceCard}>
              <h4 className={styles.performanceTitle}>🚀 Performance Benefits</h4>
              <ul className={styles.performanceList}>
                <li>Reports load 50-70x faster from cache</li>
                <li>Reduced database load and improved scalability</li>
                <li>Better user experience with faster page loads</li>
              </ul>
            </div>
            <div className={styles.performanceCard}>
              <h4 className={styles.performanceTitle}>⚡ Cache Behavior</h4>
              <ul className={styles.performanceList}>
                <li>First request hits database and caches result</li>
                <li>Subsequent requests served from cache</li>
                <li>Cache expires after configured duration</li>
                <li>Method-specific cache durations supported</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Cache Management Actions */}
      {originalOptions.enable && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Cache Management</h3>
          
          {clearError && (
            <div className={styles.error}>
              {clearError}
            </div>
          )}
          
          {clearSuccess && (
            <div className={styles.success}>
              {clearSuccess}
            </div>
          )}
          
          <div className={styles.actionCard}>
            <div className={styles.actionInfo}>
              <h4 className={styles.actionTitle}>🗑️ Clear All Cache</h4>
              <p className={styles.actionDescription}>
                Remove all cached data from Redis. This will clear all cache entries that start with the key prefix: <strong>"{cacheConfig.keyPrefix || 'Not configured'}"</strong>
              </p>
              <p className={styles.actionWarning}>
                ⚠️ This action will cause temporary performance impact as cache needs to be rebuilt.
              </p>
            </div>
            <button
              onClick={() => setShowClearModal(true)}
              disabled={clearLoading || !cacheConfig.keyPrefix}
              className={styles.dangerButton}
              style={{
                opacity: clearLoading || !cacheConfig.keyPrefix ? 0.6 : 1,
                cursor: clearLoading || !cacheConfig.keyPrefix ? 'not-allowed' : 'pointer'
              }}
              onMouseEnter={(e) => {
                if (!clearLoading && cacheConfig.keyPrefix) {
                  e.currentTarget.style.backgroundColor = '#dc2626';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(220, 38, 38, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (!clearLoading && cacheConfig.keyPrefix) {
                  e.currentTarget.style.backgroundColor = '#ef4444';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
                }
              }}
            >
              {clearLoading ? 'Clearing...' : 'Clear All Cache'}
            </button>
          </div>
        </div>
      )}

      {/* Clear Cache Confirmation Modal */}
      {showClearModal && (
        <div className={styles.modalOverlay} onClick={() => setShowClearModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Confirm Cache Clearing</h3>
              <button
                onClick={() => setShowClearModal(false)}
                className={styles.modalCloseButton}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.modalIcon}>🗑️</div>
              <p className={styles.modalText}>
                Are you sure you want to clear all cache entries?
              </p>
              <div className={styles.modalDetails}>
                <p><strong>This will remove:</strong></p>
                <ul className={styles.modalList}>
                  <li>All cached report data</li>
                  <li>All cached query results</li>
                  <li>All cache entries starting with prefix: <code className={styles.modalCode}>"{cacheConfig.keyPrefix}"</code></li>
                </ul>
                <p className={styles.modalWarning}>
                  ⚠️ This action cannot be undone and will cause temporary performance impact.
                </p>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                onClick={() => setShowClearModal(false)}
                disabled={clearLoading}
                className={styles.modalCancelButton}
                onMouseEnter={(e) => {
                  if (!clearLoading) {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!clearLoading) {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                  }
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleClearAllCache}
                disabled={clearLoading}
                className={styles.modalConfirmButton}
                style={{
                  opacity: clearLoading ? 0.6 : 1,
                  cursor: clearLoading ? 'not-allowed' : 'pointer'
                }}
                onMouseEnter={(e) => {
                  if (!clearLoading) {
                    e.currentTarget.style.backgroundColor = '#dc2626';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!clearLoading) {
                    e.currentTarget.style.backgroundColor = '#ef4444';
                  }
                }}
              >
                {clearLoading ? 'Clearing...' : 'Yes, Clear All Cache'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CacheManagement;