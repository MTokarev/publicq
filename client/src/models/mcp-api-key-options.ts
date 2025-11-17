/**
 * Represents an API Key
 */
export interface ApiKey {
  /**
   * Key Name
   */
  name: string;
  
  /**
   * Key Value
   */
  key: string;
  
  /**
   * Created By
   */
  createdBy: string;
  
  /**
   * Valid Until UTC
   */
  validUntilUtc: string | null;
  
  /**
   * Creation Date UTC
   */
  createdOnUtc: string;
}

/**
 * MCP API Key Options
 */
export interface McpApiKeyOptions {
  /**
   * Enables or disables API Key authentication
   */
  enabled: boolean;
  
  /**
   * A list of API Keys
   */
  keys: ApiKey[];
}
