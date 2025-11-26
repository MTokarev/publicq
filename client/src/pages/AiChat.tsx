import React, { useState, useEffect } from 'react';
import { AiChat } from '../components/AiChat/AiChat';
import { Modal } from '../components/Shared/Modal';
import { McpTool, ChatMessage, aiChatService } from '../services/aiChatService';
import { configurationService } from '../services/configurationService';
import { cn } from '../utils/cn';
import styles from './AiChat.module.css';

// Extended ChatMessage with timestamp for UI purposes
interface UIChatMessage extends ChatMessage {
  timestamp?: Date;
}

interface ToolModalProps {
  tool: McpTool | null;
  onClose: () => void;
}

const ToolModal: React.FC<ToolModalProps> = ({ tool, onClose }) => {
  if (!tool) return null;

  const formatToolName = (name: string): string => {
    if (name.includes('_')) {
      return name
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    }
    return name
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .replace(/\s+/g, ' ');
  };

  return (
    <Modal
      isOpen={!!tool}
      onClose={onClose}
      title={formatToolName(tool.name)}
      size="md"
      showCloseButton={true}
      closeOnEscape={true}
      closeOnOverlayClick={true}
    >
      <pre style={{
        fontFamily: 'Monaco, Menlo, Courier New, monospace',
        fontSize: '0.9rem',
        lineHeight: '1.6',
        whiteSpace: 'pre-wrap',
        margin: 0,
        padding: 'var(--spacing-md)',
        backgroundColor: 'var(--color-gray-50)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--color-gray-200)',
      }}>
        {tool.description}
      </pre>
      <p style={{
        fontSize: '11px',
        color: '#9ca3af',
        margin: '12px 0 0 0',
        textAlign: 'center',
        fontStyle: 'italic',
      }}>
        <kbd style={{
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
        }}>Esc</kbd> to close
      </p>
    </Modal>
  );
};

/**
 * Demo page for the AI Chat component
 * Shows how to integrate with the AI Chat service and MCP tools
 */
const AiChatDemo: React.FC<{ onNavigateToSettings?: () => void }> = ({ onNavigateToSettings }) => {
  const [availableTools, setAvailableTools] = useState<McpTool[]>([]);
  const [conversationHistory, setConversationHistory] = useState<UIChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mcpConnected, setMcpConnected] = useState(false);
  const [executingTools, setExecutingTools] = useState(false);
  const [selectedTool, setSelectedTool] = useState<McpTool | null>(null);
  const [toolsExpanded, setToolsExpanded] = useState(false);
  
  // AI enabled check
  const [aiEnabled, setAiEnabled] = useState<boolean | null>(null);
  const [aiCheckLoading, setAiCheckLoading] = useState(true);

  /**
   * Format tool name from snake_case or PascalCase to readable format
   * e.g., "create_question" -> "Create Question"
   * e.g., "CreateQuestion" -> "Create Question"
   */
  const formatToolName = (name: string): string => {
    // Handle snake_case
    if (name.includes('_')) {
      return name
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    }
    
    // Handle PascalCase/camelCase
    return name
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .trim() // Remove leading space
      .replace(/\s+/g, ' '); // Replace multiple spaces with single space
  };
  
  // Check if AI is enabled
  useEffect(() => {
    const checkAiEnabled = async () => {
      setAiCheckLoading(true);
      try {
        const response = await configurationService.getLlmIntegrationOptions();
        if (response.isSuccess && response.data) {
          setAiEnabled(response.data.enabled);
        } else {
          setAiEnabled(false);
        }
      } catch (err) {
        setAiEnabled(false);
      } finally {
        setAiCheckLoading(false);
      }
    };
    
    checkAiEnabled();
  }, []);
  
  // Load available MCP tools on mount
  useEffect(() => {
    const loadTools = async () => {
      try {
        // Try to initialize MCP client connection
        try {
          await aiChatService.initializeMcpClient();
          setMcpConnected(true);
        } catch (mcpError) {
          setMcpConnected(false);
        }
        
        // Get available tools (will use fallback if MCP is unavailable)
        const tools = await aiChatService.getAvailableTools();
        setAvailableTools(tools);
        
        // Only set error if we have no tools at all
        if (tools.length === 0) {
          setError('Failed to load available tools. Some features may not work.');
        }
      } catch (err) {
        setError('Failed to load available tools. Some features may not work.');
        setMcpConnected(false);
      }
    };

    loadTools();

    // Cleanup: disconnect MCP client on unmount
    return () => {
      aiChatService.disconnectMcpClient();
      setMcpConnected(false);
    };
  }, []);

  /**
   * Handle sending a message to the AI
   * This implements the full conversation loop with tool execution
   */
  const handleSendMessage = async (message: string, history: UIChatMessage[]) => {
    setIsLoading(true);
    setError(null);

    // Update conversation history with the new user message (it's already in the history parameter)
    setConversationHistory(history);

    try {
      let currentHistory = history;
      let currentMessage = message;
      let maxIterations = 5; // Prevent infinite loops
      let iteration = 0;
      const originalUserRequest = message; // Store original request
      const allToolResults: any[] = []; // Accumulate all tool results across iterations

      // Multi-turn tool execution loop
      while (iteration < maxIterations) {
        iteration++;
                
        // Step 1: Send message to AI
        const response = await aiChatService.sendMessage(
          currentMessage,
          availableTools,
          currentHistory
        );

        if (!response.isSuccess || !response.data) {
          throw new Error(response.message || 'Failed to get AI response');
        }

        const aiResponse = response.data;

        // Step 2: Check if AI wants to execute tools
        if (!aiResponse.isComplete && aiResponse.toolCalls && aiResponse.toolCalls.length > 0) {
          // AI wants to call tools - execute them via MCP
          setExecutingTools(true);
          
          try {
            // Execute the tools
            const toolResults = await aiChatService.executeToolCalls(aiResponse.toolCalls);
                        
            // Add to accumulated results
            allToolResults.push(...toolResults);
            
            // Check if any tool execution resulted in an error
            const hasError = toolResults.some(result => 
              !result.success || (result.result && result.result.isError)
            );
            
            // Show tool execution in UI (for user feedback)
            const toolMessages: UIChatMessage[] = toolResults.map((result, i) => ({
              role: 'tool',
              content: result.success 
                ? JSON.stringify(result.result, null, 2)
                : `Error: ${result.error}`,
              toolCallId: aiResponse.toolCalls![i].id,
              toolName: aiResponse.toolCalls![i].name,
              timestamp: new Date()
            }));
            
            // Update UI with tool execution messages (for display only, not sent to AI)
            setConversationHistory(prev => [...prev, ...toolMessages]);
            
            // Keep currentHistory in sync (though it won't be sent to AI due to backend filtering)
            currentHistory = [...currentHistory, ...toolMessages];
            
            // If there was an error, stop execution and inform the user
            if (hasError) {
              const errorResult = toolResults.find(r => !r.success || (r.result && r.result.isError));
              const errorMessage = errorResult?.result?.isError 
                ? (errorResult.result.content?.[0]?.text || 'Unknown error occurred')
                : (errorResult?.error || 'Tool execution failed');
              
              const assistantErrorMessage: UIChatMessage = {
                role: 'assistant',
                content: `I encountered an error while executing a tool: ${errorMessage}. Please check the tool parameters and try again.`,
                timestamp: new Date()
              };
              
              setConversationHistory(prev => [...prev, assistantErrorMessage]);
              break; // Stop execution
            }
            
            // Create a detailed summary message about ALL tool executions (not just current)
            const allToolSummary = allToolResults.map((result, i) => {
              let resultSummary = '';
              
              // Special formatting for get_module tool - extract and format questions
              if (result.success && result.toolName?.toLowerCase().includes('module') && result.toolName?.toLowerCase().includes('get')) {
                try {
                  const moduleData = result.result?.data || result.result;
                  const parsedData = typeof moduleData === 'string' ? JSON.parse(moduleData) : moduleData;
                  
                  if (parsedData?.latestVersion?.questions) {
                    const questions = parsedData.latestVersion.questions;
                    resultSummary = `Module: ${parsedData.latestVersion.title}\nQuestions (${questions.length}):\n` +
                      questions.map((q: any, qIdx: number) => {
                        const answers = q.answers?.map((a: any, aIdx: number) => 
                          `   ${aIdx + 1}. "${a.text}" [isCorrect: ${a.isCorrect}]`
                        ).join('\n') || '   No answers';
                        return `\nQ${qIdx + 1}: "${q.text}"\nType: ${q.type}\nAnswers:\n${answers}`;
                      }).join('\n');
                  } else {
                    resultSummary = JSON.stringify(result.result).substring(0, 2000);
                  }
                } catch (e) {
                  resultSummary = JSON.stringify(result.result).substring(0, 2000);
                }
              } else {
                // For other tools, use larger substring (2000 chars instead of 500)
                resultSummary = result.success ? JSON.stringify(result.result).substring(0, 2000) : result.error || 'Unknown error';
              }
              
              return `${i + 1}. Tool "${result.toolName}" - ${result.success ? 'SUCCESS' : 'FAILED'}
   Result: ${resultSummary}`;
            }).join('\n\n');
            
            // Check if create_question was just executed successfully
            const questionCreated = allToolResults.some(r => 
              r.success && r.toolName?.toLowerCase().includes('question') && r.toolName?.toLowerCase().includes('create')
            );
            
            // Check if upload was executed successfully (in any iteration)
            const fileUploaded = allToolResults.some(r => 
              r.success && r.toolName?.toLowerCase().includes('upload')
            );
            
            // Check if module was already fetched
            const moduleFetched = allToolResults.some(r => 
              r.success && r.toolName?.toLowerCase().includes('module') && r.toolName?.toLowerCase().includes('get')
            );
            
            // If question was created or if we just uploaded a file and question already exists in module, we're done
            if (questionCreated) {
              // Find the create_question result to extract question details
              const questionResult = allToolResults.find(r => 
                r.success && r.toolName?.toLowerCase().includes('question') && r.toolName?.toLowerCase().includes('create')
              );
              
              let questionDetails = '';
              if (questionResult?.result?.data) {
                try {
                  const qData = typeof questionResult.result.data === 'string' 
                    ? JSON.parse(questionResult.result.data) 
                    : questionResult.result.data;
                  
                  questionDetails = `\n\n📝 Question Created:\n${qData.text || 'Question created'}\n\nType: ${qData.type || 'Unknown'}\n\nAnswers:\n${qData.answers?.map((a: any, i: number) => `${i + 1}. ${a.text} ${a.isCorrect ? '✓ (Correct)' : ''}`).join('\n') || 'No answers'}`;
                } catch (e) {
                }
              }
              
              const successMessage: UIChatMessage = {
                role: 'assistant',
                content: `✅ Successfully completed your request! The question has been created in the module.${questionDetails}`,
                timestamp: new Date()
              };
              setConversationHistory(prev => [...prev, successMessage]);
              break; // Exit the loop - task complete
            }
            
            // Prepare next message with tool results
            currentMessage = `[SYSTEM NOTE: Tools have been executed. Do NOT call these tools again!]

ALL TOOLS EXECUTED SO FAR IN THIS CONVERSATION:
${allToolSummary}

User's ORIGINAL request (from the beginning): "${originalUserRequest}"

${moduleFetched && fileUploaded && !questionCreated ?
`✓ Module information HAS BEEN FETCHED - Do NOT call get_module again
✓ File HAS BEEN UPLOADED - Do NOT call upload_files again

IMMEDIATELY CREATE THE QUESTION NOW using create_question tool with:
- Module ID and version ID from the get_module result above
- File ID from the upload result above
- Create sample question text and answer options automatically

DO NOT ask for confirmation - CREATE THE QUESTION NOW.`
: 
fileUploaded && !moduleFetched ?
`✓ File uploaded successfully
Next: Get module information if not already done, then create the question`
:
`Proceed with the next step needed to complete: "${originalUserRequest}"
Do NOT repeat any tools that show SUCCESS status above.`}`;
                        
            // Continue the loop to check if AI wants to call more tools
            continue;
          } finally {
            setExecutingTools(false);
          }
        } else if (aiResponse.textResponse) {
          // AI responded with text - add to conversation and exit loop
          const assistantMessage: UIChatMessage = {
            role: 'assistant',
            content: aiResponse.textResponse,
            timestamp: new Date()
          };

          setConversationHistory(prev => [...prev, assistantMessage]);
          break; // Exit the loop
        } else {
          // No tool calls and no text response - something went wrong
          break;
        }
      }
    } catch (err: any) {      
      const errorMessage: UIChatMessage = {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${err.message || 'Unknown error'}. Please try again.`,
        timestamp: new Date()
      };

      setConversationHistory(prev => [...prev, errorMessage]);
      setError(err.message || 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while checking AI status
  if (aiCheckLoading) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
        <p style={{ color: '#666' }}>Checking AI status...</p>
      </div>
    );
  }

  // Show disabled message if AI is not enabled
  if (!aiEnabled) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center' }}><img src="/images/icons/robot.svg" alt="AI" style={{width: '48px', height: '48px'}} /></div>
        <h2 style={{ color: '#333', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          AI Monkey <img src="/images/icons/monkey.svg" alt="" style={{width: '20px', height: '20px'}} /> is Sleeping
        </h2>
        <p style={{ color: '#666' }}>
          The AI chat feature is currently disabled. Please contact your administrator to enable AI.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.demoPage}>
      <ToolModal tool={selectedTool} onClose={() => setSelectedTool(null)} />
      <div className={styles.demoHeader}>
        <h1>AI Monkey 🐵</h1>
        <p>
          Chat with AI Monkey to create questions, upload files, and manage your assessment modules.
        </p>
        
        <div className={styles.statusBar}>
          <div className={cn(
            styles.statusIndicator,
            mcpConnected ? styles['statusIndicator--connected'] : styles['statusIndicator--disconnected']
          )}>
            <span className={styles.statusDot}></span>
            MCP Server: {mcpConnected ? 'Connected' : 'Disconnected'}
          </div>
          
          {executingTools && (
            <div className={styles.statusIndicator}>
              <span className={styles.statusSpinner}></span>
              Executing tools...
            </div>
          )}
        </div>

        {/* Available Tools - Expandable */}
        <div className={styles.toolsSection}>
          <button 
            className={styles.toolsToggle}
            onClick={() => setToolsExpanded(!toolsExpanded)}
          >
            <span className={styles.toolsToggleIcon}>{toolsExpanded ? '▼' : '▶'}</span>
            <span>🔧 Available Tools ({availableTools.length})</span>
          </button>
          
          {toolsExpanded && availableTools.length > 0 && (
            <div className={styles.toolsContent}>
              <div className={styles.toolBadges}>
                {availableTools.map((tool, idx) => (
                  <span 
                    key={idx} 
                    className={styles.toolBadge}
                    data-description={tool.description || ''}
                    onClick={() => setSelectedTool(tool)}
                  >
                    {formatToolName(tool.name)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {error && (
          <div className={styles.errorBanner}>
            ⚠️ {error}
          </div>
        )}
      </div>

      <div className={styles.demoContent}>
        <div className={styles.chatContainer}>
          <AiChat
            title="AI Monkey 🐵"
            availableTools={availableTools}
            onSendMessage={handleSendMessage}
            loading={isLoading}
            placeholder="Ask AI Monkey to create questions, upload files, or help with your tasks..."
            maxHeight="calc(100vh - 300px)"
            showTimestamps={true}
            initialMessages={conversationHistory}
          />
        </div>
      </div>
    </div>
  );
};

export default AiChatDemo;
