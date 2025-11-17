# AI Chat Component

A React component for integrating ChatGPT/AI chat capabilities with MCP (Model Context Protocol) tools.

## 📁 Files Created

```
client/src/
├── components/AiChat/
│   ├── AiChat.tsx              # Main chat component
│   ├── AiChat.module.css       # Component styles
│   └── index.ts                # Barrel export
├── services/
│   └── aiChatService.ts        # AI chat API service
└── pages/
    ├── AiChatDemo.tsx          # Demo page
    └── AiChatDemo.module.css   # Demo page styles
```

## 🎨 Component Features

### AiChat Component

- **Message Display**: Shows conversation between user and AI
- **Empty State**: Friendly onboarding with available tools
- **Loading States**: Animated typing indicator
- **Message Types**: User, Assistant, System, and Tool messages
- **Auto-scroll**: Automatically scrolls to latest message
- **Timestamps**: Optional timestamp display
- **Responsive**: Mobile-friendly design
- **Keyboard Support**: Enter to send messages

### Props

```typescript
interface AiChatProps {
  availableTools?: any[];           // MCP tools the AI can use
  onSendMessage?: (message: string, history: ChatMessage[]) => Promise<void>;
  loading?: boolean;                // External loading state
  placeholder?: string;             // Input placeholder text
  title?: string;                   // Chat header title
  maxHeight?: string;               // Maximum chat height
  className?: string;               // Custom CSS classes
  initialMessages?: ChatMessage[];  // Pre-populate messages
  showTimestamps?: boolean;         // Show message timestamps
}
```

## 📋 Usage Examples

### Basic Usage

```tsx
import { AiChat } from '../components/AiChat';

function MyPage() {
  const handleSendMessage = async (message: string, history: ChatMessage[]) => {
    // Send message to backend AI service
    const response = await aiChatService.sendMessage(message, tools, history);
    
    // Handle response...
  };

  return (
    <AiChat
      title="AI Monkey"
      onSendMessage={handleSendMessage}
      placeholder="Ask me anything..."
    />
  );
}
```

### With MCP Tools

```tsx
import { AiChat } from '../components/AiChat';
import { aiChatService } from '../services/aiChatService';

function AiAssistantPage() {
  const [tools, setTools] = useState([]);

  useEffect(() => {
    // Load available MCP tools
    aiChatService.getAvailableTools().then(setTools);
  }, []);

  const handleSendMessage = async (message: string, history: ChatMessage[]) => {
    const response = await aiChatService.sendMessage(message, tools, history);
    
    if (!response.isSuccess) {
      throw new Error(response.message);
    }

    const aiResponse = response.data;

    // Check if AI wants to execute tools
    if (!aiResponse.isComplete && aiResponse.toolCalls) {
      // Execute tool calls via MCP
      for (const toolCall of aiResponse.toolCalls) {
        const result = await executeMcpTool(toolCall);
        // Add result to history...
      }
      
      // Send tool results back to AI for final response
      const finalResponse = await aiChatService.sendMessage('', tools, updatedHistory);
      // Handle final response...
    } else if (aiResponse.textResponse) {
      // AI responded with text - display it
    }
  };

  return (
    <AiChat
      title="AI Monkey"
      availableTools={tools}
      onSendMessage={handleSendMessage}
      maxHeight="600px"
      showTimestamps={true}
    />
  );
}
```

### Custom Styling

```tsx
<AiChat
  className="my-custom-chat"
  title="Custom Assistant"
  maxHeight="calc(100vh - 200px)"
/>
```

## 🔧 AI Chat Service

The `aiChatService` handles communication with the backend AI proxy.

### Methods

#### `sendMessage(message, availableTools, conversationHistory)`

Sends a message to the AI chat service.

```typescript
const response = await aiChatService.sendMessage(
  'Create a question about math',
  availableTools,
  conversationHistory
);

if (response.isSuccess && response.data) {
  const { textResponse, toolCalls, isComplete } = response.data;
  
  if (isComplete && textResponse) {
    // AI provided a text response
  } else if (toolCalls && toolCalls.length > 0) {
    // AI wants to execute tools
  }
}
```

#### `getAvailableTools()`

Gets the list of available MCP tools.

```typescript
const tools = await aiChatService.getAvailableTools();
```

## 🎭 Demo Page

The `AiChatDemo` page shows a complete implementation:

- Loads MCP tools on mount
- Handles full conversation loop
- Displays error states
- Shows available tools in sidebar
- Provides example prompts

### Running the Demo

1. Make sure backend is running with AI chat endpoint configured
2. Navigate to the AiChatDemo page
3. Try example prompts like:
   - "Create a math question for 2nd grade"
   - "Create 5 English grammar questions"
   - "Upload an image from URL"

## 🔗 Backend Integration

The component expects these backend endpoints:

### POST `/api/ai-chat/message`

Request:
```json
{
  "message": "Create a question about the Eiffel Tower",
  "availableTools": [...],
  "conversationHistory": [...]
}
```

Response:
```json
{
  "isSuccess": true,
  "data": {
    "textResponse": "I'll create that question for you...",
    "toolCalls": [
      {
        "id": "call_123",
        "name": "CreateQuestion",
        "arguments": { ... }
      }
    ],
    "isComplete": false
  }
}
```

## 🎨 Styling

The component uses CSS Modules with CSS custom properties (variables) for theming:

```css
--color-primary: #3b82f6
--color-background: #f9fafb
--color-border: #e5e7eb
--color-text-primary: #111827
--color-text-secondary: #6b7280
```

Override these in your global CSS or pass custom styles via `className`.

## 📱 Responsive Design

- Desktop: Full-width chat with sidebar
- Tablet: Stacked layout
- Mobile: Compact messages, smaller padding

## ♿ Accessibility

- Semantic HTML structure
- Keyboard navigation support
- ARIA labels for interactive elements
- Focus management
- Screen reader friendly

## 🔒 Security

- All API calls go through authenticated axios instance
- JWT token automatically attached to requests
- No direct OpenAI API calls from frontend
- All LLM interactions proxied through backend

## 🚀 Next Steps

1. **Add MCP Client**: Install `@modelcontextprotocol/sdk` package
2. **Tool Execution**: Implement actual MCP tool execution
3. **Streaming**: Add support for streaming responses
4. **File Upload**: Add file attachment support
5. **Message Actions**: Add copy, edit, delete message actions
6. **Export Chat**: Add export conversation feature
7. **Voice Input**: Add speech-to-text support

## 📚 Related Files

- Backend: `/src/PublicQ.API/Controllers/AiChatController.cs`
- Backend Service: `/src/PublicQ.Infrastructure/Services/ChatGptService.cs`
- Guide: `/CHAT_AI_INTEGRATION_GUIDE.md`

## 🐛 Known Issues

- Tool execution not yet implemented (shows placeholder message)
- MCP client SDK not yet installed
- Tool results not sent back to AI for final response

## 💡 Tips

- Use `showTimestamps={true}` for debugging
- Set `maxHeight` based on your layout needs
- Provide helpful placeholder text for your use case
- Pre-populate with `initialMessages` to guide users
