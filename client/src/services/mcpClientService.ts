import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { config } from '../config';
import { CONSTANTS } from '../constants/contstants';

/**
 * MCP Client Service for connecting to the backend MCP server
 * and executing tools
 */
class McpClientService {
  private client: Client | null = null;
  private transport: StreamableHTTPClientTransport | null = null;
  private isConnected: boolean = false;

  /**
   * Connect to the MCP server
   */
  async connect(): Promise<void> {
    if (this.isConnected && this.client) {
      return;
    }

    try {
      const token = localStorage.getItem(CONSTANTS.TOKEN_VARIABLE_NAME);
      
      // Create HTTP transport - MCP endpoint is at root /mcp, not under /api
      const baseUrl = config.apiBaseUrl.replace('/api/', '/');
      const mcpUrl = new URL(`${baseUrl}mcp`);
      
      // Create custom fetch with Authorization header
      const customFetch: typeof fetch = async (url: RequestInfo | URL, init?: RequestInit) => {
        const headers = new Headers(init?.headers);
        headers.set('Authorization', `Bearer ${token}`);
        
        return fetch(url, {
          ...init,
          headers
        });
      };
      
      // Use StreamableHTTPClientTransport for HTTP-based MCP server
      this.transport = new StreamableHTTPClientTransport(mcpUrl, { fetch: customFetch });

      // Create MCP client
      this.client = new Client(
        {
          name: 'publicq-web-client',
          version: '1.0.0'
        },
        {
          capabilities: {
            tools: {}
          }
        }
      );

      // Connect client with transport
      await this.client.connect(this.transport);
      this.isConnected = true;

    } catch (error) {
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * Disconnect from the MCP server
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.transport = null;
      this.isConnected = false;
    }
  }

  /**
   * List available tools from the MCP server
   */
  async listTools(): Promise<any[]> {
    if (!this.isConnected || !this.client) {
      await this.connect();
    }

    try {
      const response = await this.client!.listTools();
      return response.tools || [];
    } catch (error) {
      console.error('Failed to list MCP tools:', error);
      throw error;
    }
  }

  /**
   * Call a tool on the MCP server
   * @param toolName - Name of the tool to call
   * @param args - Arguments to pass to the tool
   */
  async callTool(toolName: string, args: Record<string, any>): Promise<any> {
    if (!this.isConnected || !this.client) {
      await this.connect();
    }

    try {
      const response = await this.client!.callTool({
        name: toolName,
        arguments: args
      });

      return response;
    } catch (error) {
      console.error(`Failed to call tool ${toolName}:`, error);
      throw error;
    }
  }

  /**
   * Check if the client is connected
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /**
   * Reconnect to the MCP server
   */
  async reconnect(): Promise<void> {
    await this.disconnect();
    await this.connect();
  }
}

// Export singleton instance
export const mcpClientService = new McpClientService();
export default mcpClientService;
