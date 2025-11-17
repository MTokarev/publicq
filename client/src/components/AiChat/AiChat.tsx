import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../utils/cn';
import { Button } from '../Button/Button';
import Input from '../Shared/Input';
import { Card } from '../Shared/Card';
import styles from './AiChat.module.css';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  toolCallId?: string;
  toolName?: string;
  timestamp?: Date;
}

export interface AiChatProps {
  /** Available MCP tools for the AI */
  availableTools?: any[];
  /** Callback when a message is sent */
  onSendMessage?: (message: string, history: ChatMessage[]) => Promise<void>;
  /** Whether the chat is in loading state */
  loading?: boolean;
  /** Custom placeholder text */
  placeholder?: string;
  /** Chat header title */
  title?: string;
  /** Maximum height for the chat container */
  maxHeight?: string;
  /** Custom CSS classes */
  className?: string;
  /** Initial messages */
  initialMessages?: ChatMessage[];
  /** Whether to show timestamps */
  showTimestamps?: boolean;
}

/**
 * AI Chat component for interacting with ChatGPT through MCP tools
 * 
 * @example
 * <AiChat
 *   title="AI Monkey"
 *   availableTools={mcpTools}
 *   onSendMessage={handleSendMessage}
 * />
 */
const MONKEY_MESSAGES = [
  "🐵 Monkey is thinking...",
  "🍌 Monkey is working hard...",
  "🧠 Monkey is being smart...",
  "⚡ Monkey is processing at lightning speed...",
  "🎯 Monkey is focusing...",
  "💡 Monkey has an idea...",
  "🔧 Monkey is building something...",
  "📚 Monkey is reading the docs...",
  "🎨 Monkey is being creative...",
  "🚀 Monkey is launching solutions...",
  "🎭 Monkey is improvising...",
  "🏃 Monkey is on it...",
  "💪 Monkey is flexing those brain muscles...",
  "🎪 Monkey is performing magic...",
  "🎯 Monkey is calculating...",
];

export const AiChat: React.FC<AiChatProps> = ({
  availableTools = [],
  onSendMessage,
  loading = false,
  placeholder = 'Ask AI to create questions, upload files, or help with your tasks...',
  title = 'AI Monkey 🐵',
  maxHeight,
  className,
  initialMessages = [],
  showTimestamps = false,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [expandedTools, setExpandedTools] = useState<Set<number>>(new Set());
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [monkeyMessage, setMonkeyMessage] = useState(MONKEY_MESSAGES[0]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /**
   * Format tool name from snake_case or PascalCase to readable format
   * e.g., "create_question" -> "Create Question"
   */
  const formatToolName = (name: string | undefined): string => {
    if (!name) return '';
    
    // Handle snake_case
    if (name.includes('_')) {
      return name
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    }
    
    // Handle PascalCase/camelCase
    return name
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .replace(/\s+/g, ' ');
  };
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Sync messages with initialMessages when they change
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Rotate monkey messages while loading
  useEffect(() => {
    if (isSending || loading) {
      const interval = setInterval(() => {
        const randomIndex = Math.floor(Math.random() * MONKEY_MESSAGES.length);
        setMonkeyMessage(MONKEY_MESSAGES[randomIndex]);
      }, 2000); // Change message every 2 seconds

      return () => clearInterval(interval);
    }
  }, [isSending, loading]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [inputValue]);

  const toggleToolExpanded = (index: number) => {
    setExpandedTools((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const copyMessage = async (content: string, index: number) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
    }
  };

  const copyAllMessages = async () => {
    try {
      const allText = messages
        .map(msg => {
          const role = msg.role === 'user' ? 'You' : 
                      msg.role === 'assistant' ? 'AI Monkey 🐵' :
                      msg.role === 'tool' ? `Tool (${formatToolName(msg.toolName)})` :
                      'System';
          return `${role}: ${msg.content}`;
        })
        .join('\n\n');
      
      await navigator.clipboard.writeText(allText);
      setCopiedIndex(-1); // Use -1 to indicate "copy all" was clicked
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isSending) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    // Add user message to chat
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsSending(true);

    try {
      if (onSendMessage) {
        await onSendMessage(userMessage.content, [...messages, userMessage]);
      }
    } catch (error) {
      
      // Add error message to chat
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (timestamp?: Date) => {
    if (!timestamp || !showTimestamps) return null;
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(timestamp);
  };

  const renderMessage = (message: ChatMessage, index: number) => {
    const isUser = message.role === 'user';
    const isSystem = message.role === 'system';
    const isTool = message.role === 'tool';
    const isExpanded = expandedTools.has(index);
    const isCopied = copiedIndex === index;

    return (
      <div
        key={index}
        className={cn(
          styles.message,
          isUser && styles['message--user'],
          isSystem && styles['message--system'],
          isTool && styles['message--tool']
        )}
      >
        <div className={styles.message__avatar}>
          {isUser ? '👤' : isTool ? '🔧' : '🤖'}
        </div>
        <div className={styles.message__content}>
          <div className={styles.message__header}>
            <span className={styles.message__role}>
              {isUser ? 'You' : isTool ? `Tool: ${formatToolName(message.toolName || 'Unknown')}` : 'AI Monkey 🐵'}
            </span>
            {formatTimestamp(message.timestamp) && (
              <span className={styles.message__timestamp}>
                {formatTimestamp(message.timestamp)}
              </span>
            )}
            <button
              className={styles.message__copy}
              onClick={() => copyMessage(message.content, index)}
              title="Copy message"
            >
              {isCopied ? '✓' : '📋'}
            </button>
          </div>
          <div className={styles.message__text}>
            {isTool ? (
              <>
                <button
                  className={styles.tool__toggle}
                  onClick={() => toggleToolExpanded(index)}
                >
                  {isExpanded ? '▼' : '▶'} {isExpanded ? 'Hide details' : 'Show details'}
                </button>
                {isExpanded && (
                  <pre className={styles.message__code}>{message.content}</pre>
                )}
              </>
            ) : (
              <pre className={styles.message__text_content}>{message.content}</pre>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card
      className={cn(styles.aiChat, className)}
      header={
        <div className={styles.chatHeader}>
          <span className={styles.chatTitle}>{title}</span>
          {messages.length > 0 && (
            <button
              className={styles.copyAllButton}
              onClick={copyAllMessages}
              title="Copy entire conversation"
            >
              {copiedIndex === -1 ? '✓ Copied' : '📋 Copy All'}
            </button>
          )}
        </div>
      }
      noPadding
      variant="elevated"
    >
      <div className={styles.aiChat__container} style={{ maxHeight }}>
        <div className={styles.aiChat__messages}>
          {messages.length === 0 && (
            <div className={styles.aiChat__empty}>
              <div className={styles.emptyState__icon}>💬</div>
              <h3 className={styles.emptyState__title}>Start a conversation</h3>
              <p className={styles.emptyState__text}>
                Ask me to create questions, upload files, or help with your assessment tasks.
              </p>
            </div>
          )}
          
          {messages.map((message, index) => renderMessage(message, index))}
          
          {(isSending || loading) && (
            <div className={cn(styles.message, styles['message--loading'])}>
              <div className={styles.message__avatar}>🤖</div>
              <div className={styles.message__content}>
                <div className={styles.message__text}>
                  <span className={styles.monkeyMessage}>{monkeyMessage}</span>
                </div>
                <div className={styles.loadingDots}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <div className={styles.aiChat__input}>
          <div className={styles.textareaContainer}>
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={isSending || loading}
              className={styles.textarea}
              rows={1}
            />
            <Button
              variant="primary"
              size="sm"
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isSending || loading}
              loading={isSending || loading}
              className={styles.sendButton}
            >
              Send
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default AiChat;
