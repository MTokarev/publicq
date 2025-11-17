import axios from '../api/axios';
import { ResponseWithData } from '../models/responseWithData';
import { GenericOperationStatuses } from '../models/GenericOperationStatuses';
import { mcpClientService } from './mcpClientService';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  toolCallId?: string;
  toolName?: string;
}

export interface McpTool {
  name: string;
  description: string;
  inputSchema: any;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
}

export interface AiChatResponse {
  textResponse?: string;
  toolCalls?: ToolCall[];
  isComplete: boolean;
}

export interface AiChatRequest {
  message: string;
  availableTools: McpTool[];
  conversationHistory?: ChatMessage[];
}

/**
 * AI Chat Service for interacting with ChatGPT through the backend proxy
 * and executing MCP tools
 */
export const aiChatService = {
  /**
   * Send a message to the AI chat service
   * @param message - The user message to send
   * @param availableTools - List of MCP tools available for the AI
   * @param conversationHistory - Optional conversation history for context
   * @returns AI response with text or tool calls
   */
  sendMessage: async (
    message: string,
    availableTools: McpTool[] = [],
    conversationHistory: ChatMessage[] = []
  ): Promise<ResponseWithData<AiChatResponse, GenericOperationStatuses>> => {
    const request: AiChatRequest = {
      message,
      availableTools,
      conversationHistory
    };

    const response = await axios.post<ResponseWithData<AiChatResponse, GenericOperationStatuses>>(
      '/ai-chat/message',
      request
    );

    return response.data;
  },

  /**
   * Execute a tool call via MCP
   * @param toolCall - The tool call to execute
   * @returns Tool execution result
   */
  async executeToolCall(toolCall: ToolCall): Promise<any> {
    try {
      const result = await mcpClientService.callTool(toolCall.name, toolCall.arguments);
      return result;
    } catch (error: any) {
      console.error(`Failed to execute tool ${toolCall.name}:`, error);
      throw error;
    }
  },

  /**
   * Execute multiple tool calls in sequence
   * @param toolCalls - Array of tool calls to execute
   * @returns Array of tool results
   */
  async executeToolCalls(toolCalls: ToolCall[]): Promise<any[]> {
    const results = [];
    
    for (const toolCall of toolCalls) {
      try {
        const result = await this.executeToolCall(toolCall);
        results.push({
          toolCallId: toolCall.id,
          toolName: toolCall.name,
          result,
          success: true
        });
      } catch (error: any) {
        results.push({
          toolCallId: toolCall.id,
          toolName: toolCall.name,
          error: error.message || 'Unknown error',
          success: false
        });
      }
    }
    
    return results;
  },

  /**
   * Get available MCP tools from the MCP server
   */
  getAvailableTools: async (): Promise<McpTool[]> => {
    try {
      // Connect to MCP server if not already connected
      if (!mcpClientService.getConnectionStatus()) {
        await mcpClientService.connect();
      }

      // Get tools from MCP server
      const tools = await mcpClientService.listTools();
      
      return tools.map((tool: any) => ({
        name: tool.name,
        description: tool.description || '',
        inputSchema: tool.inputSchema || {}
      }));
    } catch (error) {
      console.error('Failed to get MCP tools:', error);
      
      // Fallback to mock tools if MCP server is unavailable
      return [
        {
          name: 'CreateQuestion',
          description: 'Create a new question in an assessment module',
          inputSchema: {
            type: 'object',
            properties: {
              moduleId: { type: 'string', format: 'uuid' },
              moduleVersionId: { type: 'string', format: 'uuid' },
              questionText: { type: 'string' },
              questionType: { 
                type: 'string', 
                enum: ['SingleChoice', 'MultipleChoice', 'FreeText'] 
              },
              answerOptions: { type: 'array' }
            },
            required: ['moduleId', 'moduleVersionId', 'questionText', 'questionType']
          }
        },
        {
          name: 'UploadFilesToModuleAsync',
          description: 'Upload files to an assessment module from URLs',
          inputSchema: {
            type: 'object',
            properties: {
              moduleId: { type: 'string', format: 'uuid' },
              fileUrls: { type: 'array', items: { type: 'string' } }
            },
            required: ['moduleId', 'fileUrls']
          }
        }
      ];
    }
  },

  /**
   * Initialize MCP client connection
   */
  async initializeMcpClient(): Promise<void> {
    try {
      await mcpClientService.connect();
    } catch (error) {
      console.error('Failed to initialize MCP client:', error);
      throw error;
    }
  },

  /**
   * Disconnect MCP client
   */
  async disconnectMcpClient(): Promise<void> {
    await mcpClientService.disconnect();
  }
};

export default aiChatService;
