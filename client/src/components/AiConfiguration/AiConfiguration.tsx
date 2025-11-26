import React, { useState, useEffect } from 'react';
import { configurationService } from '../../services/configurationService';
import { LlmIntegrationOptions, OpenAIOptions, LlmProvider } from '../../models/llm-integration-options';
import { McpApiKeyOptions, ApiKey } from '../../models/mcp-api-key-options';
import { GenericOperationStatuses } from '../../models/GenericOperationStatuses';
import { localDateTimeStringToUtc, formatDateToLocal } from '../../utils/dateUtils';
import styles from './AiConfiguration.module.css';

// Utility function for conditional class names
const cn = (...classes: (string | undefined | false)[]): string => 
  classes.filter(Boolean).join(' ');

const AiConfiguration: React.FC = () => {
  const [llmOptions, setLlmOptions] = useState<LlmIntegrationOptions>({
    enabled: false,
    provider: LlmProvider.OpenAI
  });
  const [originalLlmOptions, setOriginalLlmOptions] = useState<LlmIntegrationOptions>({
    enabled: false,
    provider: LlmProvider.OpenAI
  });
  
  const [openAiOptions, setOpenAiOptions] = useState<OpenAIOptions>({
    apiKey: '',
    model: 'gpt-4o',
    maxTokens: 4096,
    temperature: 0.7
  });
  const [originalOpenAiOptions, setOriginalOpenAiOptions] = useState<OpenAIOptions>({
    apiKey: '',
    model: 'gpt-4o',
    maxTokens: 4096,
    temperature: 0.7
  });

  const [mcpApiKeyOptions, setMcpApiKeyOptions] = useState<McpApiKeyOptions>({
    enabled: false,
    keys: []
  });
  const [originalMcpApiKeyOptions, setOriginalMcpApiKeyOptions] = useState<McpApiKeyOptions>({
    enabled: false,
    keys: []
  });
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyValue, setNewKeyValue] = useState('');
  const [newKeyExpiration, setNewKeyExpiration] = useState('');
  const [showNewKeyForm, setShowNewKeyForm] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadConfiguration();
    loadMcpApiKeys();
  }, []);

  // Load OpenAI options when OpenAI provider is selected
  useEffect(() => {
    if (llmOptions.provider === LlmProvider.OpenAI && llmOptions.enabled && !dataLoaded) {
      loadOpenAiOptions();
    }
  }, [llmOptions.provider, llmOptions.enabled]);

  const loadConfiguration = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await configurationService.getLlmIntegrationOptions();
      if (response.isSuccess && response.data) {
        setLlmOptions(response.data);
        setOriginalLlmOptions(response.data);
        
        // Load provider-specific options
        if (response.data.enabled && response.data.provider === LlmProvider.OpenAI) {
          await loadOpenAiOptions();
        }
      }
      setDataLoaded(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load AI configuration');
      setDataLoaded(true);
    } finally {
      setLoading(false);
    }
  };

  const loadOpenAiOptions = async () => {
    try {
      const response = await configurationService.getOpenAIOptions();
      if (response.isSuccess && response.data) {
        setOpenAiOptions(response.data);
        setOriginalOpenAiOptions(response.data);
      }
    } catch (err: any) {
      console.error('Failed to load OpenAI configuration:', err);
    }
  };

  const loadMcpApiKeys = async () => {
    try {
      const response = await configurationService.getMcpApiOptions();
      if (response.isSuccess && response.data) {
        setMcpApiKeyOptions(response.data);
        setOriginalMcpApiKeyOptions(response.data);
      }
    } catch (err: any) {
      console.error('Failed to load MCP API keys:', err);
    }
  };

  const handleSaveLlmOptions = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await configurationService.setLlmIntegrationOptions(llmOptions);
      if (response.isSuccess) {
        setOriginalLlmOptions(llmOptions);
        setSuccess('AI integration settings saved successfully');
      } else {
        setError(response.message || 'Failed to save AI configuration');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save AI configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveOpenAiOptions = async () => {
    // Validation
    if (!openAiOptions.apiKey.trim()) {
      setError('OpenAI API Key is required');
      return;
    }
    if (!openAiOptions.model.trim()) {
      setError('Model name is required');
      return;
    }
    if (openAiOptions.maxTokens < 1) {
      setError('Max tokens must be greater than 0');
      return;
    }
    if (openAiOptions.temperature < 0 || openAiOptions.temperature > 2) {
      setError('Temperature must be between 0 and 2');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await configurationService.setOpenAIOptions(openAiOptions);
      if (response.isSuccess) {
        setOriginalOpenAiOptions(openAiOptions);
        setSuccess('OpenAI configuration saved successfully');
      } else {
        setError(response.message || 'Failed to save OpenAI configuration');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save OpenAI configuration');
    } finally {
      setLoading(false);
    }
  };

  const hasUnsavedLlmChanges = () => {
    return llmOptions.enabled !== originalLlmOptions.enabled ||
           llmOptions.provider !== originalLlmOptions.provider;
  };

  const hasUnsavedOpenAiChanges = () => {
    return openAiOptions.apiKey !== originalOpenAiOptions.apiKey ||
           openAiOptions.model !== originalOpenAiOptions.model ||
           openAiOptions.maxTokens !== originalOpenAiOptions.maxTokens ||
           openAiOptions.temperature !== originalOpenAiOptions.temperature;
  };

  const handleResetLlm = () => {
    setLlmOptions(originalLlmOptions);
    setError('');
    setSuccess('');
  };

  const handleResetOpenAi = () => {
    setOpenAiOptions(originalOpenAiOptions);
    setError('');
    setSuccess('');
  };

  const handleAddApiKey = () => {
    if (!newKeyName.trim()) {
      setError('Key name is required');
      return;
    }

    // Use custom key if provided, otherwise generate UUID
    const keyValue = newKeyValue.trim() || crypto.randomUUID();
    
    // Check for duplicate keys
    if (mcpApiKeyOptions.keys.some(k => k.key === keyValue)) {
      setError('Duplicate API keys are not allowed. Each key must be unique.');
      return;
    }
    
    // Convert local datetime to UTC if provided
    const expirationDate = newKeyExpiration ? localDateTimeStringToUtc(newKeyExpiration) : null;

    const newKey: ApiKey = {
      name: newKeyName.trim(),
      key: keyValue,
      createdBy: 'current-user', // This should come from auth context
      validUntilUtc: expirationDate,
      createdOnUtc: new Date().toISOString()
    };

    setMcpApiKeyOptions({
      ...mcpApiKeyOptions,
      keys: [...mcpApiKeyOptions.keys, newKey]
    });
    setNewKeyName('');
    setNewKeyValue('');
    setNewKeyExpiration('');
    setShowNewKeyForm(false);
    setError('');
  };

  const handleDeleteApiKey = (keyToDelete: string) => {
    setMcpApiKeyOptions({
      ...mcpApiKeyOptions,
      keys: mcpApiKeyOptions.keys.filter(k => k.key !== keyToDelete)
    });
  };

  const handleSaveMcpApiKeys = async () => {
    // Client-side validation for duplicate keys
    const keys = mcpApiKeyOptions.keys.map(k => k.key);
    const uniqueKeys = new Set(keys);
    if (keys.length !== uniqueKeys.size) {
      setError('Duplicate API keys are not allowed. Each key must be unique.');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await configurationService.setMcpApiOptions(mcpApiKeyOptions);
      if (response.isSuccess) {
        setOriginalMcpApiKeyOptions(mcpApiKeyOptions);
        setSuccess('MCP API keys saved successfully');
      } else {
        // Handle validation errors from backend
        if (response.errors && response.errors.length > 0) {
          setError(response.errors.join(' '));
        } else {
          setError(response.message || 'Failed to save MCP API keys');
        }
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save MCP API keys');
    } finally {
      setLoading(false);
    }
  };

  const handleResetMcpApiKeys = () => {
    setMcpApiKeyOptions(originalMcpApiKeyOptions);
    setShowNewKeyForm(false);
    setNewKeyName('');
    setError('');
    setSuccess('');
  };

  const hasUnsavedMcpChanges = () => {
    return JSON.stringify(mcpApiKeyOptions) !== JSON.stringify(originalMcpApiKeyOptions);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('API key copied to clipboard');
    setTimeout(() => setSuccess(''), 2000);
  };

  const getProviderName = (provider: LlmProvider): string => {
    switch (provider) {
      case LlmProvider.OpenAI:
        return 'OpenAI (ChatGPT)';
      case LlmProvider.DeepSeek:
        return 'DeepSeek';
      default:
        return 'Unknown';
    }
  };

  if (loading && !dataLoaded) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingText}>Loading AI configuration...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title} style={{display: 'flex', alignItems: 'center'}}><img src="/images/icons/robot.svg" alt="" style={{width: '28px', height: '28px', marginRight: '10px'}} />AI Configuration</h2>
      
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
          <h4 className={styles.infoTitle}>LLM Integration (AI Service)</h4>
          <p className={styles.infoText}>
            <strong>Status:</strong> {originalLlmOptions.enabled ? 
              <span className={styles.statusEnabled}>Enabled</span> : 
              <span className={styles.statusDisabled}>Disabled</span>
            }
            {originalLlmOptions.enabled && (
              <> using <strong>{getProviderName(originalLlmOptions.provider)}</strong></>
            )}
          </p>
          <p className={styles.infoText}>
            Enables the AI chat feature in the application, allowing users to interact with the platform through 
            natural language. Users can run tools and perform actions based on their assigned roles and permissions. 
            Uses providers like OpenAI or DeepSeek.
          </p>
        </div>

        <div className={styles.infoCard}>
          <h4 className={styles.infoTitle}>MCP API Keys (External Access)</h4>
          <p className={styles.infoText}>
            <strong>Status:</strong> {originalMcpApiKeyOptions.enabled ? 
              <span className={styles.statusEnabled}>Enabled</span> : 
              <span className={styles.statusDisabled}>Disabled</span>
            }
            {originalMcpApiKeyOptions.enabled && originalMcpApiKeyOptions.keys.length > 0 && (
              <> with {originalMcpApiKeyOptions.keys.length} active key{originalMcpApiKeyOptions.keys.length !== 1 ? 's' : ''}</>
            )}
          </p>
          <p className={styles.infoText}>
            Authenticates external AI agents (Claude Desktop, VS Code extensions, custom tools) 
            to connect via Model Context Protocol. External agents get the same tool access and permissions 
            as the built-in AI chat, allowing them to interact with your assessment data remotely.
          </p>
        </div>
      </div>

      {/* AI Integration Options Section */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>AI Integration Options</h3>
        
        <div className={styles.formGroup}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={llmOptions.enabled}
              onChange={(e) => setLlmOptions({
                ...llmOptions,
                enabled: e.target.checked
              })}
              className={styles.checkbox}
            />
            <span className={styles.checkboxText}>Enable AI Service</span>
          </label>
          <small className={styles.helpText}>
            When enabled, AI features will be available throughout the application including the AI chat assistant.
          </small>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>AI Provider</label>
          <select
            value={llmOptions.provider}
            onChange={(e) => setLlmOptions({
              ...llmOptions,
              provider: e.target.value as LlmProvider
            })}
            className={cn(styles.select, !llmOptions.enabled && 'opacity-60')}
            disabled={!llmOptions.enabled}
          >
            <option value={LlmProvider.OpenAI}>OpenAI (ChatGPT)</option>
            <option value={LlmProvider.DeepSeek}>DeepSeek (Cost-effective)</option>
          </select>
          <small className={styles.helpText}>
            Select the AI provider to use for language model operations. Each provider has different models and pricing.
          </small>
        </div>

        <div className={styles.buttonGroup}>
          <button
            onClick={handleSaveLlmOptions}
            disabled={loading || !hasUnsavedLlmChanges()}
            className={cn(styles.saveButton, (loading || !hasUnsavedLlmChanges()) && 'opacity-60')}
          >
            {loading ? 'Saving...' : 'Save AI Settings'}
          </button>
          
          {hasUnsavedLlmChanges() && (
            <button
              onClick={handleResetLlm}
              disabled={loading}
              className={styles.resetButton}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* OpenAI Configuration */}
      {llmOptions.provider === LlmProvider.OpenAI && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>OpenAI Configuration</h3>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>API Key *</label>
            <input
              type="password"
              value={openAiOptions.apiKey}
              onChange={(e) => setOpenAiOptions({...openAiOptions, apiKey: e.target.value})}
              placeholder="sk-..."
              className={styles.input}
            />
            <small className={styles.helpText}>
              Enter your OpenAI API key. Get one from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">OpenAI Platform</a>.
            </small>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Model *</label>
              <input
                type="text"
                list="model-options"
                value={openAiOptions.model}
                onChange={(e) => setOpenAiOptions({...openAiOptions, model: e.target.value})}
                placeholder="Enter model name (e.g., gpt-4o)"
                className={styles.input}
              />
              <datalist id="model-options">
                <option value="gpt-4o">GPT-4o (Recommended)</option>
                <option value="gpt-4o-mini">GPT-4o Mini (Faster, Cheaper)</option>
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Legacy)</option>
                <option value="o1-preview">O1 Preview</option>
                <option value="o1-mini">O1 Mini</option>
              </datalist>
              <small className={styles.helpText}>
                Choose a model or enter a custom model name. The model must be valid and available in your OpenAI account. GPT-4o offers the best balance of quality and speed.
              </small>
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Max Tokens *</label>
              <input
                type="number"
                value={openAiOptions.maxTokens}
                onChange={(e) => setOpenAiOptions({...openAiOptions, maxTokens: parseInt(e.target.value) || 4096})}
                placeholder="4096"
                min="1"
                max="128000"
                className={styles.input}
                style={{width: '150px'}}
              />
              <small className={styles.helpText}>
                Maximum tokens for model responses (1-128000).
              </small>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Temperature</label>
            <div className={styles.temperatureControl}>
              <input
                type="range"
                value={openAiOptions.temperature}
                onChange={(e) => setOpenAiOptions({...openAiOptions, temperature: parseFloat(e.target.value)})}
                min="0"
                max="2"
                step="0.1"
                className={styles.slider}
              />
              <span className={styles.temperatureValue}>{openAiOptions.temperature.toFixed(1)}</span>
            </div>
            <small className={styles.helpText}>
              Controls randomness: 0 = focused and deterministic, 2 = creative and diverse. Recommended: 0.7
            </small>
          </div>

          <div className={styles.buttonGroup}>
            <button
              onClick={handleSaveOpenAiOptions}
              disabled={loading || !hasUnsavedOpenAiChanges()}
              className={cn(styles.saveButton, (loading || !hasUnsavedOpenAiChanges()) && 'opacity-60')}
            >
              {loading ? 'Saving...' : 'Save OpenAI Configuration'}
            </button>
            
            {hasUnsavedOpenAiChanges() && (
              <button
                onClick={handleResetOpenAi}
                disabled={loading}
                className={styles.resetButton}
              >
                Reset
              </button>
            )}
          </div>
        </div>
      )}

      {/* DeepSeek Configuration (Future) */}
      {llmOptions.provider === LlmProvider.DeepSeek && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>DeepSeek Configuration</h3>
          <p className={styles.infoText}>
            DeepSeek configuration will be available in a future update. The provider uses OpenAI-compatible API.
          </p>
        </div>
      )}

      {/* MCP API Key Management */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>MCP API Key Management</h3>
        <p className={styles.infoText}>
          Manage API keys for Model Context Protocol (MCP) server access. These keys are used to authenticate external MCP clients.
        </p>

        <div className={styles.formGroup}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={mcpApiKeyOptions.enabled}
              onChange={(e) => setMcpApiKeyOptions({...mcpApiKeyOptions, enabled: e.target.checked})}
              className={styles.checkbox}
            />
            <span className={styles.checkboxText}>
              Enable MCP API Key Authentication
            </span>
          </label>
          <small className={styles.helpText}>
            When enabled, MCP clients must provide a valid API key to access the server.
          </small>
        </div>

        <div className={styles.apiKeysContainer}>
          {mcpApiKeyOptions.keys.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No API keys configured. Add a key to enable MCP server access.</p>
            </div>
          ) : (
            <div className={styles.apiKeysList}>
              {mcpApiKeyOptions.keys.map((apiKey) => (
                <div key={apiKey.key} className={styles.apiKeyCard}>
                  <div className={styles.apiKeyHeader}>
                    <div>
                      <h4 className={styles.apiKeyName}>{apiKey.name}</h4>
                      <small className={styles.apiKeyMeta}>
                        Created: {formatDateToLocal(apiKey.createdOnUtc)} by {apiKey.createdBy}
                        {apiKey.validUntilUtc && apiKey.validUntilUtc.trim() !== '' && (
                          <> • Expires: {formatDateToLocal(apiKey.validUntilUtc)}</>
                        )}
                      </small>
                    </div>
                    <button
                      onClick={() => handleDeleteApiKey(apiKey.key)}
                      className={styles.deleteKeyButton}
                      title="Delete API key"
                    >
                      🗑️
                    </button>
                  </div>
                  <div className={styles.apiKeyValue}>
                    <code className={styles.apiKeyCode}>{apiKey.key}</code>
                    <button
                      onClick={() => copyToClipboard(apiKey.key)}
                      className={styles.copyButton}
                      title="Copy to clipboard"
                    >
                      📋 Copy
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!showNewKeyForm ? (
            <button
              onClick={() => setShowNewKeyForm(true)}
              className={styles.addKeyButton}
            >
              + Add New API Key
            </button>
          ) : (
            <div className={styles.newKeyForm}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Key Name *</label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g., Production Key, Development Key"
                  className={styles.input}
                  maxLength={256}
                />
                <small className={styles.helpText}>
                  Enter a descriptive name to identify this API key.
                </small>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Custom Key Value (Optional)</label>
                <input
                  type="text"
                  value={newKeyValue}
                  onChange={(e) => setNewKeyValue(e.target.value)}
                  placeholder="Leave empty to auto-generate a UUID"
                  className={styles.input}
                />
                <small className={styles.helpText}>
                  If not provided, a secure UUID will be automatically generated.
                </small>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Expiration Date & Time (Optional)</label>
                <input
                  type="datetime-local"
                  value={newKeyExpiration}
                  onChange={(e) => setNewKeyExpiration(e.target.value)}
                  className={styles.input}
                  min={(() => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                  })()}
                />
                <small className={styles.helpText}>
                  Leave empty for keys that never expire. Set a date and time for temporary access.
                </small>
              </div>

              <div className={styles.buttonGroup}>
                <button
                  onClick={handleAddApiKey}
                  className={styles.saveButton}
                >
                  Add Key
                </button>
                <button
                  onClick={() => {
                    setShowNewKeyForm(false);
                    setNewKeyName('');
                    setNewKeyValue('');
                    setNewKeyExpiration('');
                  }}
                  className={styles.resetButton}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div className={styles.buttonGroup} style={{ marginTop: '20px' }}>
          <button
            onClick={handleSaveMcpApiKeys}
            disabled={loading || !hasUnsavedMcpChanges()}
            className={cn(styles.saveButton, (loading || !hasUnsavedMcpChanges()) && 'opacity-60')}
          >
            {loading ? 'Saving...' : 'Save API Keys'}
          </button>
          
          {hasUnsavedMcpChanges() && (
            <button
              onClick={handleResetMcpApiKeys}
              disabled={loading}
              className={styles.resetButton}
            >
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiConfiguration;
