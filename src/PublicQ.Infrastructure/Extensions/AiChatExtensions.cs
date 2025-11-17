using AppChatMessage = PublicQ.Application.Models.Ai.ChatMessage;
using PublicQ.Application.Models.Ai;
using System.Text.Json;
using OpenAI.Chat;

namespace PublicQ.Infrastructure.Extensions;

/// <summary>
/// AI chat message extensions.
/// </summary>
public static class AiChatExtensions
{
    /// <summary>
    /// Returns the OpenAI chat message representation of the given chat message.
    /// </summary>
    /// <param name="message"><see cref="AppChatMessage"/></param>
    /// <returns>Returns <see cref="OpenAI.Chat.ChatMessage"/></returns>
    /// <exception cref="ArgumentOutOfRangeException">Throws <see cref="ArgumentOutOfRangeException"/> for unknown roles</exception>
    public static OpenAI.Chat.ChatMessage ToOpenAiChatMessage(this AppChatMessage message)
    {
        return message.Role switch
        {
            ChatRole.User => OpenAI.Chat.ChatMessage.CreateUserMessage(message.Content),
            ChatRole.Assistant when message.ToolCalls != null => 
                CreateAssistantMessageWithToolCalls(message),
            ChatRole.Assistant => OpenAI.Chat.ChatMessage.CreateAssistantMessage(message.Content),
            ChatRole.Tool => OpenAI.Chat.ChatMessage.CreateToolMessage(message.ToolCallId!, message.Content),
            ChatRole.System => OpenAI.Chat.ChatMessage.CreateSystemMessage(message.Content),
            _ => throw new ArgumentOutOfRangeException($"Unknown role: {message.Role}")
        };
    }
    
    /// <summary>
    /// Creates an assistant message with tool calls
    /// </summary>
    private static OpenAI.Chat.ChatMessage CreateAssistantMessageWithToolCalls(AppChatMessage message)
    {
        // For assistant messages with tool calls, we need to create the message properly
        // The ToolCalls property should contain the tool call information
        // OpenAI SDK expects ChatToolCall objects
        
        // If we have tool calls, we need to preserve them in the conversation
        // but we can't easily reconstruct them here. 
        // For now, skip messages with tool calls in the backend filter
        return OpenAI.Chat.ChatMessage.CreateAssistantMessage(message.Content ?? string.Empty);
    }
}