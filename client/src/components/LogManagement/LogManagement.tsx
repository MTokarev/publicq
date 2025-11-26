import React, { useState, useEffect } from 'react';
import { LogService } from '../../services/logService';
import { configurationService } from '../../services/configurationService';
import { LogEntry } from '../../models/log-entry';
import { LogFilter, defaultLogFilter, LogLevels } from '../../models/log-filter';
import { LogConfiguration, LogLevel, getLogLevels, defaultLogConfiguration } from '../../models/log-configuration';
import { PaginatedResponse } from '../../models/paginatedResponse';
import { formatDateToLocal, parseUtcDate } from '../../utils/dateUtils';
import cssStyles from './LogManagement.module.css';

interface LogManagementProps {
  logConfig: LogConfiguration & { dataLoaded: boolean };
  setLogConfig: React.Dispatch<React.SetStateAction<LogConfiguration & { dataLoaded: boolean }>>;
}

const LogManagement: React.FC<LogManagementProps> = ({ logConfig, setLogConfig }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [csvLoading, setCsvLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<LogFilter>(defaultLogFilter);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(0);
  const [totalLogs, setTotalLogs] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  
  // Configuration management state
  const [originalConfig, setOriginalConfig] = useState<LogConfiguration>(defaultLogConfiguration);
  const [configLoading, setConfigLoading] = useState(false);
  const [configError, setConfigError] = useState('');
  const [configSuccess, setConfigSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<'logs' | 'configuration'>('logs');
  const [showPerformanceWarning, setShowPerformanceWarning] = useState(false);
  const [pendingLogLevel, setPendingLogLevel] = useState<LogLevel | null>(null);
  
  // Log detail modal state
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [showLogDetail, setShowLogDetail] = useState(false);

  useEffect(() => {
    loadLogs();
  }, [currentPage, pageSize, filter]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load configuration on component mount
  useEffect(() => {
    if (!logConfig.dataLoaded) {
      loadLogConfiguration();
    }
  }, []);

  // Keyboard event handler for modals
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (showLogDetail) {
          closeLogDetail();
        } else if (showPerformanceWarning) {
          cancelLogLevelChange();
        }
      } else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
        if (showPerformanceWarning) {
          event.preventDefault();
          confirmLogLevelChange();
        }
      }
    };

    if (showPerformanceWarning || showLogDetail) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showPerformanceWarning, showLogDetail]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        loadLogs();
      }, 30000); // Refresh every 30 seconds
      setRefreshInterval(interval);
    } else {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [autoRefresh]); // eslint-disable-line react-hooks/exhaustive-deps

  // Add mobile responsive styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      @media (max-width: 768px) {
        .log-management-table-container {
          overflow-x: auto !important;
          -webkit-overflow-scrolling: touch !important;
        }
        .log-management-pagination {
          flex-direction: column !important;
          gap: 16px !important;
          align-items: center !important;
        }
        .log-management-pagination-controls {
          gap: 12px !important;
          justify-content: center !important;
        }
        .log-management-pagination-button {
          min-height: 44px !important;
          height: 44px !important;
          min-width: 80px !important;
          font-size: 14px !important;
          padding: 10px 16px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          text-align: center !important;
        }
        .log-management-page-size {
          justify-content: center !important;
          gap: 8px !important;
        }
        .log-management-spacer {
          display: none !important;
        }
      }
      @media (max-width: 480px) {
        .log-management-pagination-controls {
          gap: 8px !important;
        }
        .log-management-pagination-button {
          min-width: 70px !important;
          height: 44px !important;
          font-size: 12px !important;
          padding: 8px 12px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          text-align: center !important;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await LogService.getLogs(currentPage, pageSize, filter);
      if (response.isSuccess) {
        const paginatedData = response.data as PaginatedResponse<LogEntry>;
        setLogs(paginatedData.data);
        setTotalPages(paginatedData.totalPages);
        setTotalLogs(paginatedData.totalCount);
      } else {
        setError('Failed to load logs');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  const loadLogConfiguration = async () => {
    setConfigLoading(true);
    setConfigError('');
    try {
      const response = await configurationService.getLogOptions();
      if (response.isSuccess) {
        const config = response.data;
        setLogConfig({ ...config, dataLoaded: true });
        setOriginalConfig(config);
      } else {
        setConfigError('Failed to load log configuration');
      }
    } catch (err: any) {
      setConfigError(err?.response?.data?.message || 'Failed to load log configuration');
    } finally {
      setConfigLoading(false);
    }
  };

  const saveLogConfiguration = async () => {
    setConfigLoading(true);
    setConfigError('');
    setConfigSuccess('');
    try {
      const configToSave = {
        enable: logConfig.enable,
        logLevel: logConfig.logLevel,
        retentionPeriodInDays: logConfig.retentionPeriodInDays
      };
      
      const response = await configurationService.setLogOptions(configToSave);
      if (response.isSuccess) {
        setConfigSuccess('Log configuration saved successfully!');
        setOriginalConfig(configToSave);
        setTimeout(() => setConfigSuccess(''), 3000);
      } else {
        setConfigError('Failed to save log configuration');
      }
    } catch (err: any) {
      setConfigError(err?.response?.data?.message || 'Failed to save log configuration');
    } finally {
      setConfigLoading(false);
    }
  };

  const resetLogConfiguration = () => {
    setLogConfig({ ...originalConfig, dataLoaded: true });
    setConfigError('');
    setConfigSuccess('');
  };

  const hasConfigChanges = () => {
    return (
      logConfig.enable !== originalConfig.enable ||
      logConfig.logLevel !== originalConfig.logLevel ||
      logConfig.retentionPeriodInDays !== originalConfig.retentionPeriodInDays
    );
  };

  const handleLogLevelChange = (newLogLevel: LogLevel) => {
    // Check if the new log level could cause performance issues
    if ((newLogLevel === LogLevel.Debug || newLogLevel === LogLevel.Information) && 
        newLogLevel !== originalConfig.logLevel) {
      setPendingLogLevel(newLogLevel);
      setShowPerformanceWarning(true);
    } else {
      setLogConfig({ ...logConfig, logLevel: newLogLevel });
    }
  };

  const confirmLogLevelChange = async () => {
    if (pendingLogLevel) {
      setLogConfig({ ...logConfig, logLevel: pendingLogLevel });
      
      // Auto-save the configuration
      setConfigLoading(true);
      setConfigError('');
      setConfigSuccess('');
      
      try {
        const configToSave = {
          enable: logConfig.enable,
          logLevel: pendingLogLevel,
          retentionPeriodInDays: logConfig.retentionPeriodInDays
        };
        
        const response = await configurationService.setLogOptions(configToSave);
        if (response.isSuccess) {
          setConfigSuccess('Log configuration saved successfully!');
          setOriginalConfig(configToSave);
          setTimeout(() => setConfigSuccess(''), 3000);
        } else {
          setConfigError('Failed to save log configuration');
        }
      } catch (err: any) {
        setConfigError(err?.response?.data?.message || 'Failed to save log configuration');
      } finally {
        setConfigLoading(false);
      }
    }
    
    setShowPerformanceWarning(false);
    setPendingLogLevel(null);
  };

  const cancelLogLevelChange = () => {
    setShowPerformanceWarning(false);
    setPendingLogLevel(null);
  };

  // Log detail modal handlers
  const openLogDetail = (log: LogEntry) => {
    setSelectedLog(log);
    setShowLogDetail(true);
  };

  const closeLogDetail = () => {
    setShowLogDetail(false);
    setSelectedLog(null);
  };

  const handleFilterChange = (field: keyof LogFilter, value: any) => {
    let processedValue = value;
    
    // Convert datetime-local values to UTC for date fields
    if ((field === 'fromDate' || field === 'toDate') && value) {
      // datetime-local input gives us a string in format: "2023-10-05T14:30"
      // We need to treat this as local time and convert to UTC
      processedValue = new Date(value).toISOString();
    }
    
    setFilter({
      ...filter,
      [field]: processedValue
    });
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const clearFilters = () => {
    setFilter(defaultLogFilter);
    setCurrentPage(1);
  };

  const formatTimestamp = (timestamp: Date | string) => {
    // Use the existing UTC conversion utility
    return formatDateToLocal(typeof timestamp === 'string' ? timestamp : timestamp.toISOString());
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Critical':
        return '#dc2626'; // Red
      case 'Error':
        return '#ea580c'; // Orange-red
      case 'Warning':
        return '#d97706'; // Orange
      case 'Information':
        return '#0ea5e9'; // Blue
      case 'Debug':
        return '#6b7280'; // Gray
      default:
        return '#374151'; // Default gray
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'Critical':
        return <img src="/images/icons/fail.svg" alt="Critical" style={{width: '16px', height: '16px', verticalAlign: 'middle'}} />;
      case 'Error':
        return <img src="/images/icons/fail.svg" alt="Error" style={{width: '16px', height: '16px', verticalAlign: 'middle'}} />;
      case 'Warning':
        return <img src="/images/icons/warning.svg" alt="Warning" style={{width: '16px', height: '16px', verticalAlign: 'middle'}} />;
      case 'Information':
        return <img src="/images/icons/information.svg" alt="Info" style={{width: '16px', height: '16px', verticalAlign: 'middle'}} />;
      case 'Debug':
        return <img src="/images/icons/magnifying-glass.svg" alt="Debug" style={{width: '16px', height: '16px', verticalAlign: 'middle'}} />;
      default:
        return <img src="/images/icons/notepad.svg" alt="Log" style={{width: '16px', height: '16px', verticalAlign: 'middle'}} />;
    }
  };

  const truncateMessage = (message: string, maxLength: number = 100) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  const handleDownloadCSV = async () => {
    try {
      setCsvLoading(true);
      setError('');

      // Call the exportLogs API to get all logs matching the current filter
      const response = await LogService.exportLogs(filter);
      
      if (response.isSuccess && response.data) {
        // Convert logs to CSV format
        const csvContent = convertLogsToCSV(response.data);
        
        // Create and download the file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `logs_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
      } else {
        setError('Failed to export logs: ' + (response.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error downloading CSV:', err);
      setError('Error downloading CSV: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setCsvLoading(false);
    }
  };

  const convertLogsToCSV = (logs: LogEntry[]): string => {
    // Define CSV headers
    const headers = [
      'Level',
      'Timestamp', 
      'Category',
      'Message',
      'User ID',
      'User Email',
      'Request ID',
      'Machine Name',
      'Exception'
    ];

    // Convert logs to CSV rows
    const rows = logs.map(log => [
      log.level || '',
      formatTimestamp(log.timestamp),
      log.category || '',
      (log.message || '').replace(/"/g, '""'), // Escape quotes in message
      log.userId || '',
      log.userEmail || '',
      log.requestId || '',
      log.machineName || '',
      (log.exception || '').replace(/"/g, '""') // Escape quotes in exception
    ]);

    // Combine headers and rows
    const allRows = [headers, ...rows];
    
    // Convert to CSV string
    return allRows.map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n');
  };

  return (
    <div style={styles.container}>
      <h2 className={cssStyles.title} style={{...styles.title, display: 'flex', alignItems: 'center'}}><img src="/images/icons/clipboard.svg" alt="" style={{width: '28px', height: '28px', marginRight: '10px'}} />Log Management</h2>
      
      {/* Tab Navigation */}
      <div style={styles.tabNavigation}>
        <button
          onClick={() => setActiveTab('logs')}
          style={{
            ...styles.tabButton,
            ...(activeTab === 'logs' ? styles.activeTabButton : {}),
          }}
        >
          <img src="/images/icons/clipboard.svg" alt="" style={{width: '16px', height: '16px', marginRight: '6px', verticalAlign: 'middle'}} />View Logs
        </button>
        <button
          onClick={() => setActiveTab('configuration')}
          style={{
            ...styles.tabButton,
            ...(activeTab === 'configuration' ? styles.activeTabButton : {}),
          }}
        >
          <img src="/images/icons/settings.svg" alt="" style={{width: '16px', height: '16px', marginRight: '6px', verticalAlign: 'middle'}} />Configuration
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'logs' && (
        <div>
          {error && (
            <div style={styles.error}>
              {error}
            </div>
          )}

          {/* Information Section */}
          <div style={styles.infoSection}>
            <h3 style={styles.sectionTitle}>Information</h3>
            {loading ? (
              <div style={styles.infoCard}>
                <div style={styles.loadingContainer}>
                  <div style={styles.spinner}></div>
                  <p style={styles.loadingText}>Loading log information...</p>
                </div>
              </div>
            ) : (
              <div style={styles.infoCard}>
                <h4 style={styles.infoTitle}>
                  Log Service Status: {logConfig.enable ? 
                    <span style={{color: '#059669'}}>Enabled</span> : 
                    <span style={{color: '#dc2626'}}>Disabled</span>
                  }
                </h4>
                <p style={styles.infoText}>
                  Log service is currently <strong>{logConfig.enable ? 'enabled' : 'disabled'}</strong>.
                  {logConfig.enable ? (
                    <> Application logs will be stored in the database and available for viewing and analysis.</>
                  ) : (
                    <> No logs will be stored in the database until the service is enabled.</>
                  )}
                </p>
                {logConfig.enable && (
                  <>
                    <p style={styles.infoText}>
                      <strong>Current Log Level:</strong> 
                      <span style={{
                        ...styles.logLevelValue,
                        ...(logConfig.logLevel === LogLevel.Debug || logConfig.logLevel === LogLevel.Information 
                            ? styles.highlightedLogLevel : {})
                      }}>
                        {logConfig.logLevel}
                      </span>
                      {(logConfig.logLevel === LogLevel.Debug || logConfig.logLevel === LogLevel.Information) && (
                        <span style={styles.performanceWarningText}> <img src="/images/icons/warning.svg" alt="" style={{width: '14px', height: '14px', marginRight: '4px', verticalAlign: 'middle'}} />May impact performance. Consider setting to Warning or higher for production.</span>
                      )}
                    </p>
                    <p style={styles.infoText}>
                      <strong>Retention Period:</strong> {logConfig.retentionPeriodInDays} days
                    </p>
                  </>
                )}
            <p style={styles.infoText}>
              <strong>Auto Refresh:</strong> {autoRefresh ? 
                <span style={{color: '#059669'}}>Enabled (30s interval)</span> : 
                <span style={{color: '#6b7280'}}>Disabled</span>
              }
            </p>
          </div>
            )}
      </div>

      {/* Filters & Settings */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Filters & Settings</h3>
        
        <div style={styles.filtersGrid}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Log Level</label>
            <select
              value={filter.level || ''}
              onChange={(e) => handleFilterChange('level', e.target.value || null)}
              style={styles.select}
            >
              <option value="">All Levels</option>
              {Object.values(LogLevels).map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>From Date</label>
            <input
              type="datetime-local"
              value={filter.fromDate ? 
                (filter.fromDate instanceof Date ? 
                  filter.fromDate.toISOString().slice(0, 16) :
                  parseUtcDate(filter.fromDate).toISOString().slice(0, 16)
                ) : ''
              }
              onChange={(e) => handleFilterChange('fromDate', e.target.value || null)}
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>To Date</label>
            <input
              type="datetime-local"
              value={filter.toDate ? 
                (filter.toDate instanceof Date ? 
                  filter.toDate.toISOString().slice(0, 16) :
                  parseUtcDate(filter.toDate).toISOString().slice(0, 16)
                ) : ''
              }
              onChange={(e) => handleFilterChange('toDate', e.target.value || null)}
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Category</label>
            <input
              type="text"
              value={filter.category || ''}
              onChange={(e) => handleFilterChange('category', e.target.value || null)}
              placeholder="e.g., PublicQ.API.Controllers"
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>User ID</label>
            <input
              type="text"
              value={filter.userId || ''}
              onChange={(e) => handleFilterChange('userId', e.target.value || null)}
              placeholder="Filter by user ID"
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>User Email</label>
            <input
              type="text"
              value={filter.userEmail || ''}
              onChange={(e) => handleFilterChange('userEmail', e.target.value || null)}
              placeholder="Filter by user email"
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Request ID</label>
            <input
              type="text"
              value={filter.requestId || ''}
              onChange={(e) => handleFilterChange('requestId', e.target.value || null)}
              placeholder="Filter by request ID"
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Message Contains</label>
            <input
              type="text"
              value={filter.messageContains || ''}
              onChange={(e) => handleFilterChange('messageContains', e.target.value || null)}
              placeholder="Filter by message content"
              style={styles.input}
            />
          </div>
        </div>

        <div style={styles.filterActions}>
          <button
            onClick={clearFilters}
            style={styles.clearButton}
          >
            Clear Filters
          </button>
          
          <button
            onClick={loadLogs}
            style={styles.refreshButton}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>

          <button
            onClick={handleDownloadCSV}
            style={styles.downloadButton}
            disabled={csvLoading || loading}
            title="Download logs as CSV file"
          >
            {csvLoading ? 'Downloading...' : 'Download CSV'}
          </button>

          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              style={styles.checkbox}
            />
            <span style={styles.checkboxText}>Auto Refresh</span>
          </label>
        </div>
      </div>

      {/* Logs Table */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Log Entries</h3>
        
        {loading && (
          <div style={styles.loadingContainer}>
            <div style={styles.loadingText}>Loading logs...</div>
          </div>
        )}

        {!loading && logs.length === 0 && (
          <div style={styles.noLogsContainer}>
            <p style={styles.noLogsText}>No logs found with the current filters.</p>
          </div>
        )}

        {!loading && logs.length > 0 && (
          <div style={styles.tableContainer} className="log-management-table-container">
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeaderRow}>
                  <th style={styles.tableHeader}>Level</th>
                  <th style={styles.tableHeader}>Timestamp</th>
                  <th style={styles.tableHeader}>Category</th>
                  <th style={styles.tableHeader}>Message</th>
                  <th style={styles.tableHeader}>User ID</th>
                  <th style={styles.tableHeader}>User Email</th>
                  <th style={styles.tableHeader}>Request</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, index) => (
                  <tr 
                    key={log.id} 
                    style={{
                      ...(index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd),
                      cursor: 'pointer',
                    }}
                    onClick={() => openLogDetail(log)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#e5e7eb';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#ffffff' : '#ffffff';
                    }}
                  >
                    <td style={styles.tableCell}>
                      <span style={{...styles.levelBadge, color: getLevelColor(log.level)}}>
                        {getLevelIcon(log.level)} {log.level}
                      </span>
                    </td>
                    <td style={styles.tableCell}>
                      <span style={styles.timestamp}>
                        {formatTimestamp(log.timestamp)}
                      </span>
                    </td>
                    <td style={styles.tableCell}>
                      <span style={styles.category}>
                        {log.category || 'N/A'}
                      </span>
                    </td>
                    <td style={styles.tableCell}>
                      <div style={styles.messageContainer}>
                        <span title={log.message}>
                          {truncateMessage(log.message)}
                        </span>
                        {log.exception && (
                          <div style={styles.exception}>
                            <strong>Exception:</strong> {truncateMessage(log.exception, 150)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={styles.tableCell}>
                      <span style={styles.userId}>
                        {log.userId || 'System'}
                      </span>
                    </td>
                    <td style={styles.tableCell}>
                      <span style={styles.userEmail}>
                        {log.userEmail || 'N/A'}
                      </span>
                    </td>
                    <td style={styles.tableCell}>
                      <span style={styles.requestId}>
                        {log.requestId ? log.requestId.substring(0, 8) + '...' : 'N/A'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        <div style={styles.paginationControls} className="log-management-pagination">
          <div style={styles.pageSizeContainer} className="log-management-page-size">
            <label style={styles.pageSizeLabel}>Logs per page:</label>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              style={styles.pageSizeSelect}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          
          <div style={styles.paginationNavigation} className="log-management-pagination-controls">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1 || loading}
              style={{
                ...styles.paginationButton,
                opacity: currentPage === 1 || loading ? 0.5 : 1,
                cursor: currentPage === 1 || loading ? 'not-allowed' : 'pointer',
              }}
              className="log-management-pagination-button"
            >
              ◀ Previous
            </button>
            
            <span style={styles.pageInfo}>
              Page {currentPage} of {Math.max(totalPages, 1)}
            </span>
            
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages || totalPages <= 1 || loading}
              style={{
                ...styles.paginationButton,
                opacity: (currentPage === totalPages || totalPages <= 1 || loading) ? 0.5 : 1,
                cursor: (currentPage === totalPages || totalPages <= 1 || loading) ? 'not-allowed' : 'pointer',
              }}
              className="log-management-pagination-button"
            >
              Next ▶
            </button>
          </div>

          {/* Spacer to balance the layout */}
          <div style={{ width: '120px', minWidth: '120px' }} className="log-management-spacer"></div>
        </div>
      </div>
        </div>
      )}

      {/* Configuration Tab */}
      {activeTab === 'configuration' && (
        <div>
          {configError && (
            <div style={styles.error}>
              {configError}
            </div>
          )}

          {configSuccess && (
            <div style={styles.success}>
              {configSuccess}
            </div>
          )}

          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Log Configuration</h3>
            
            <div style={styles.configGrid}>
              <div style={styles.formGroup}>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={logConfig.enable}
                    onChange={(e) => setLogConfig({ ...logConfig, enable: e.target.checked })}
                    style={styles.checkbox}
                  />
                  <span style={styles.checkboxText}>Enable Database Logging</span>
                </label>
                <p style={styles.helpText}>
                  When enabled, application logs will be stored in the database for viewing and analysis.
                </p>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Log Level Threshold</label>
                <select
                  value={logConfig.logLevel}
                  onChange={(e) => handleLogLevelChange(e.target.value as LogLevel)}
                  style={styles.select}
                  disabled={!logConfig.enable}
                >
                  {getLogLevels().map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
                <p style={styles.helpText}>
                  Only logs at or above this level will be stored in the database.
                </p>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Retention Period (Days)</label>
                <input
                  type="number"
                  value={logConfig.retentionPeriodInDays}
                  onChange={(e) => setLogConfig({ ...logConfig, retentionPeriodInDays: parseInt(e.target.value) || 30 })}
                  style={styles.input}
                  min="1"
                  disabled={!logConfig.enable}
                />
                <p style={styles.helpText}>
                  Logs older than this period will be automatically purged (minimum 1 day).
                </p>
              </div>
            </div>

            <div style={styles.configActions}>
              <button
                onClick={saveLogConfiguration}
                disabled={configLoading || !hasConfigChanges()}
                style={{
                  ...styles.saveButton,
                  ...(configLoading || !hasConfigChanges() ? styles.disabledButton : {}),
                }}
              >
                {configLoading ? 'Saving...' : 'Save Configuration'}
              </button>
              
              <button
                onClick={resetLogConfiguration}
                disabled={configLoading || !hasConfigChanges()}
                style={{
                  ...styles.resetButton,
                  ...(configLoading || !hasConfigChanges() ? styles.disabledButton : {}),
                }}
              >
                Reset Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Log Detail Modal */}
      {showLogDetail && selectedLog && (
        <div style={styles.modalOverlay}>
          <div style={styles.logDetailModal}>
            <div style={styles.logDetailHeader}>
              <div style={styles.logDetailTitle}>
                <span style={{
                  ...styles.levelBadge,
                  color: getLevelColor(selectedLog.level),
                  backgroundColor: `${getLevelColor(selectedLog.level)}15`,
                  border: `1px solid ${getLevelColor(selectedLog.level)}40`,
                  marginRight: '12px',
                }}>
                  {getLevelIcon(selectedLog.level)} {selectedLog.level}
                </span>
                <div>
                  <p style={styles.logDetailSubtitle}>{formatTimestamp(selectedLog.timestamp)}</p>
                </div>
              </div>
              <button 
                onClick={closeLogDetail}
                style={styles.logDetailCloseButton}
                title="Close (Esc)"
              >
                ×
              </button>
            </div>
            
            <div style={styles.logDetailContent}>
              {/* Quick Info Cards */}
              <div style={styles.logDetailQuickInfo}>
                <div style={styles.logDetailInfoCard}>
                  <div style={styles.logDetailCardLabel}>User</div>
                  <div style={styles.logDetailCardValue}>
                    {selectedLog.userEmail || selectedLog.userId || 'System'}
                  </div>
                </div>
                <div style={styles.logDetailInfoCard}>
                  <div style={styles.logDetailCardLabel}>Category</div>
                  <div style={styles.logDetailCardValue}>
                    {selectedLog.category || 'N/A'}
                  </div>
                </div>
                <div style={styles.logDetailInfoCard}>
                  <div style={styles.logDetailCardLabel}>Machine</div>
                  <div style={styles.logDetailCardValue}>
                    {selectedLog.machineName || 'N/A'}
                  </div>
                </div>
                {selectedLog.requestId && (
                  <div style={styles.logDetailInfoCard}>
                    <div style={styles.logDetailCardLabel}>Request ID</div>
                    <div style={styles.logDetailCardValue}>
                      {selectedLog.requestId}
                    </div>
                  </div>
                )}
              </div>

              {/* Message Section */}
              <div style={styles.logDetailMainContent}>
                <div style={styles.logDetailSectionHeader}>
                  <h4 style={styles.logDetailSectionTitle}><img src="/images/icons/notepad.svg" alt="" style={{width: '16px', height: '16px', marginRight: '6px', verticalAlign: 'middle'}} />Message</h4>
                </div>
                <div style={styles.logDetailMessageBox}>
                  <pre style={styles.logDetailMessageText}>{selectedLog.message}</pre>
                </div>
              </div>

              {/* Exception Section */}
              {selectedLog.exception && (
                <div style={styles.logDetailMainContent}>
                  <div style={styles.logDetailSectionHeader}>
                    <h4 style={styles.logDetailSectionTitle}><img src="/images/icons/warning.svg" alt="" style={{width: '16px', height: '16px', marginRight: '6px', verticalAlign: 'middle'}} />Exception Details</h4>
                  </div>
                  <div style={styles.logDetailExceptionBox}>
                    <pre style={styles.logDetailExceptionText}>{selectedLog.exception}</pre>
                  </div>
                </div>
              )}
            </div>
            
            <div style={styles.logDetailFooter}>
              <div style={styles.logDetailActions}>
                <p style={styles.keyboardShortcuts}>
                  Press <kbd style={styles.kbd}>Esc</kbd> to close
                </p>
                <button 
                  onClick={closeLogDetail}
                  style={styles.logDetailActionButton}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Performance Warning Modal */}
      {showPerformanceWarning && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}><img src="/images/icons/warning.svg" alt="" style={{width: '20px', height: '20px', marginRight: '8px', verticalAlign: 'middle'}} />Performance Warning</h3>
            </div>
            <div style={styles.modalBody}>
              <p style={styles.modalText}>
                Setting the log level to <strong>{pendingLogLevel}</strong> may cause performance degradation 
                in production environments due to increased logging volume.
              </p>
              <p style={styles.modalText}>
                <strong>Recommendations:</strong>
              </p>
              <ul style={styles.modalList}>
                <li>Enable this level only for debugging purposes</li>
                <li>Use for short periods of time</li>
                <li>Monitor system performance closely</li>
                <li>Consider using Warning, Error, or Critical levels for production</li>
              </ul>
              <p style={styles.modalText}>
                Do you want to proceed with this log level setting?
              </p>
              <p style={styles.keyboardShortcuts}>
                <kbd style={styles.kbd}>Ctrl</kbd> + <kbd style={styles.kbd}>Enter</kbd> to confirm, <kbd style={styles.kbd}>Esc</kbd> to cancel
              </p>
            </div>
            <div style={styles.modalActions}>
              <button
                onClick={cancelLogLevelChange}
                style={styles.modalCancelButton}
              >
                Cancel
              </button>
              <button
                onClick={confirmLogLevelChange}
                style={styles.modalConfirmButton}
              >
                Yes, I Understand
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '0',
    maxWidth: '1400px',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 700,
    marginBottom: '30px',
    color: '#111827',
    letterSpacing: '-0.025em',
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    border: '1px solid #e5e7eb',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: 600,
    marginBottom: '20px',
    color: '#374151',
  },
  infoSection: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    border: '1px solid #e5e7eb',
  },
  infoCard: {
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    padding: '20px',
    border: '1px solid #e5e7eb',
  },
  infoTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#374151',
    marginBottom: '12px',
    margin: '0 0 12px 0',
  },
  infoText: {
    fontSize: '14px',
    color: '#6b7280',
    lineHeight: '1.5',
    margin: '0 0 8px 0',
  },
  filtersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '24px',
    marginBottom: '24px',
  },
  formGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 500,
    color: '#374151',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '14px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    backgroundColor: '#ffffff',
    boxSizing: 'border-box',
    transition: 'all 0.2s ease-in-out',
    outline: 'none',
  },
  select: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '14px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    backgroundColor: '#ffffff',
    boxSizing: 'border-box',
    transition: 'all 0.2s ease-in-out',
    outline: 'none',
    cursor: 'pointer',
  },
  filterActions: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  clearButton: {
    padding: '10px 16px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#6b7280',
    backgroundColor: '#f9fafb',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.15s ease-in-out',
  },
  refreshButton: {
    padding: '10px 16px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#ffffff',
    backgroundColor: '#3b82f6',
    border: '1px solid #3b82f6',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.15s ease-in-out',
  },
  downloadButton: {
    padding: '10px 16px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#ffffff',
    backgroundColor: '#059669',
    border: '1px solid #059669',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.15s ease-in-out',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '14px',
    fontWeight: 500,
    color: '#374151',
    cursor: 'pointer',
  },
  helpText: {
    display: 'block',
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '4px',
  },
  checkbox: {
    marginRight: '8px',
    width: '16px',
    height: '16px',
  },
  checkboxText: {
    userSelect: 'none',
  },
  paginationControls: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: '32px',
    gap: '16px',
  },
  pageSizeContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    minWidth: '120px',
  },
  pageSizeLabel: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#6b7280',
  },
  pageSizeSelect: {
    padding: '6px 8px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    backgroundColor: '#ffffff',
    color: '#374151',
    cursor: 'pointer',
    outline: 'none',
    transition: 'border-color 0.2s ease-in-out',
    boxSizing: 'border-box',
    minWidth: '0',
  },
  paginationNavigation: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  pageInfo: {
    fontSize: '14px',
    color: '#6b7280',
    fontWeight: 500,
  },
  paginationButton: {
    padding: '10px 16px',
    fontSize: '14px',
    fontWeight: 500,
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    height: '44px',
    minHeight: '44px',
    minWidth: '100px',
    textAlign: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    whiteSpace: 'nowrap',
  },
  tableContainer: {
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    backgroundColor: '#ffffff',
    overflow: 'auto',
    minHeight: '200px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeaderRow: {
    position: 'sticky',
    top: 0,
    backgroundColor: '#f9fafb',
    zIndex: 1,
  },
  tableHeader: {
    textAlign: 'left',
    padding: '16px 20px',
    backgroundColor: '#f9fafb',
    borderBottom: '1px solid #e5e7eb',
    fontWeight: 600,
    fontSize: '14px',
    color: '#374151',
    letterSpacing: '0.025em',
  },
  tableRowEven: {
    backgroundColor: '#ffffff',
    transition: 'background-color 0.2s ease-in-out',
  },
  tableRowOdd: {
    backgroundColor: '#ffffff',
    transition: 'background-color 0.2s ease-in-out',
  },
  tableCell: {
    padding: '16px 20px',
    borderBottom: '1px solid #f3f4f6',
    fontSize: '14px',
    color: '#374151',
    verticalAlign: 'middle',
  },
  levelBadge: {
    fontSize: '12px',
    fontWeight: 600,
    padding: '4px 8px',
    borderRadius: '4px',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    whiteSpace: 'nowrap',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
  },
  timestamp: {
    fontSize: '12px',
    color: '#6b7280',
    whiteSpace: 'nowrap',
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
  },
  category: {
    fontSize: '12px',
    color: '#6b7280',
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
    wordBreak: 'break-all',
  },
  messageContainer: {
    maxWidth: '300px',
  },
  exception: {
    fontSize: '12px',
    color: '#dc2626',
    marginTop: '4px',
    fontFamily: 'monospace',
  },
  userId: {
    fontSize: '12px',
    color: '#6b7280',
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
  },
  userEmail: {
    fontSize: '12px',
    color: '#6b7280',
    wordBreak: 'break-all',
    maxWidth: '150px',
  },
  machineName: {
    fontSize: '12px',
    color: '#6b7280',
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
  },
  requestId: {
    fontSize: '12px',
    color: '#6b7280',
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '120px',
    padding: '20px',
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid #f3f4f6',
    borderTop: '3px solid #3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '12px',
  },
  loadingText: {
    color: '#6b7280',
    fontSize: '14px',
    textAlign: 'center',
    margin: '0',
  },
  noLogsContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100px',
  },
  noLogsText: {
    color: '#9ca3af',
    fontSize: '14px',
    fontStyle: 'italic',
  },
  performanceGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
  },
  performanceCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: '8px',
    padding: '20px',
    border: '1px solid #bae6fd',
  },
  performanceTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#0369a1',
    marginBottom: '12px',
    margin: '0 0 12px 0',
  },
  performanceList: {
    margin: '0',
    paddingLeft: '20px',
    color: '#0c4a6e',
  },
  error: {
    fontSize: '14px',
    color: '#dc2626',
    marginBottom: '16px',
    padding: '12px 16px',
    backgroundColor: '#fef2f2',
    borderRadius: '8px',
    border: '1px solid #fecaca',
  },
  success: {
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    color: '#15803d',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px',
  },
  tabNavigation: {
    display: 'flex',
    borderBottom: '1px solid #e5e7eb',
    marginBottom: '24px',
  },
  tabButton: {
    padding: '12px 24px',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#6b7280',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    borderBottom: '2px solid transparent',
    borderBottomColor: 'transparent',
    transition: 'all 0.2s ease-in-out',
  },
  activeTabButton: {
    color: '#3b82f6',
    borderBottomColor: '#3b82f6',
    backgroundColor: '#f8fafc',
  },
  configGrid: {
    marginBottom: '24px',
  },
  configActions: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  saveButton: {
    padding: '12px 20px',
    fontSize: '14px',
    fontWeight: 600,
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  },
  resetButton: {
    padding: '12px 20px',
    fontSize: '14px',
    fontWeight: 500,
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    backgroundColor: '#ffffff',
    color: '#374151',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
  },
  disabledButton: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '0',
    maxWidth: '500px',
    width: '90%',
    maxHeight: '80vh',
    overflowY: 'auto',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
  modalHeader: {
    padding: '24px 24px 0 24px',
    borderBottom: '1px solid #e5e7eb',
  },
  modalTitle: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '18px',
    fontWeight: 600,
    color: '#dc2626',
    margin: '0 0 16px 0',
  },
  modalBody: {
    padding: '24px',
  },
  modalText: {
    fontSize: '14px',
    color: '#374151',
    lineHeight: '1.5',
    margin: '0 0 12px 0',
  },
  modalList: {
    margin: '8px 0 16px 0',
    paddingLeft: '20px',
    fontSize: '14px',
    color: '#374151',
    lineHeight: '1.5',
  },
  modalActions: {
    padding: '16px 24px 24px 24px',
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    borderTop: '1px solid #e5e7eb',
  },
  modalCancelButton: {
    padding: '10px 16px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#6b7280',
    backgroundColor: '#f9fafb',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.15s ease-in-out',
  },
  modalConfirmButton: {
    padding: '10px 16px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#ffffff',
    backgroundColor: '#dc2626',
    border: '1px solid #dc2626',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.15s ease-in-out',
  },
  logLevelValue: {
    marginLeft: '8px',
    fontWeight: 600,
  },
  highlightedLogLevel: {
    color: '#dc2626',
    backgroundColor: '#fef2f2',
    padding: '2px 6px',
    borderRadius: '4px',
    border: '1px solid #fecaca',
  },
  performanceWarningText: {
    fontSize: '12px',
    color: '#dc2626',
    fontWeight: 500,
    marginLeft: '8px',
  },
  keyboardShortcuts: {
    fontSize: '11px',
    color: '#9ca3af',
    margin: '8px 0 0 0',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  kbd: {
    display: 'inline-block',
    padding: '2px 4px',
    fontSize: '10px',
    lineHeight: '1',
    color: '#495057',
    backgroundColor: '#f8f9fa',
    borderRadius: '3px',
    border: '1px solid #ced4da',
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
    fontWeight: 'bold',
  },
  logDetailModal: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '0',
    maxWidth: '900px',
    width: '95%',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    border: '1px solid #e5e7eb',
  },
  logDetailHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '24px 28px 20px 28px',
    borderBottom: '1px solid #e5e7eb',
    backgroundColor: '#fafbfc',
    borderTopLeftRadius: '16px',
    borderTopRightRadius: '16px',
  },
  logDetailTitle: {
    display: 'flex',
    alignItems: 'center',
  },
  logDetailModalTitle: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#111827',
    margin: '0 0 4px 0',
  },
  logDetailSubtitle: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0',
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
  },
  logDetailCloseButton: {
    background: '#f3f4f6',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '20px',
    color: '#6b7280',
    cursor: 'pointer',
    padding: '8px 12px',
    lineHeight: '1',
    transition: 'all 0.15s ease-in-out',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
  },
  logDetailContent: {
    padding: '24px 28px',
    overflowY: 'auto',
    flex: 1,
  },
  logDetailQuickInfo: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '28px',
  },
  logDetailInfoCard: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '16px',
  },
  logDetailCardLabel: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginBottom: '6px',
  },
  logDetailCardValue: {
    fontSize: '14px',
    color: '#1e293b',
    fontWeight: 500,
    wordBreak: 'break-word',
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
  },
  logDetailMainContent: {
    marginBottom: '28px',
  },
  logDetailSectionHeader: {
    marginBottom: '12px',
  },
  logDetailSectionTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#374151',
    margin: '0',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  logDetailMessageBox: {
    backgroundColor: '#ffffff',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    padding: '20px',
    minHeight: '120px',
    maxHeight: 'none',
  },
  logDetailMessageText: {
    fontSize: '14px',
    color: '#374151',
    lineHeight: '1.7',
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
    margin: '0',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  logDetailExceptionBox: {
    backgroundColor: '#fef7f7',
    border: '2px solid #fecaca',
    borderRadius: '12px',
    padding: '20px',
    minHeight: '120px',
    maxHeight: 'none',
  },
  logDetailExceptionText: {
    fontSize: '13px',
    color: '#b91c1c',
    lineHeight: '1.7',
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
    margin: '0',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  logDetailFooter: {
    padding: '20px 28px 24px 28px',
    borderTop: '1px solid #e5e7eb',
    backgroundColor: '#fafbfc',
    borderBottomLeftRadius: '16px',
    borderBottomRightRadius: '16px',
  },
  logDetailActions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
  },
  logDetailActionButton: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#374151',
    backgroundColor: '#ffffff',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.15s ease-in-out',
  },
};

export default LogManagement;