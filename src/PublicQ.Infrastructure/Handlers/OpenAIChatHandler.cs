using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using OpenAI;
using OpenAI.Chat;
using PublicQ.Application.Interfaces;
using PublicQ.Application.Models;
using PublicQ.Application.Models.Ai;
using PublicQ.Domain.Enums;
using PublicQ.Infrastructure.Extensions;
using PublicQ.Infrastructure.Options;
using ChatMessage = PublicQ.Application.Models.Ai.ChatMessage;
using OpenAiChatMessage = OpenAI.Chat.ChatMessage;

namespace PublicQ.Infrastructure.Handlers;

/// <inheritdoc cref="IAIChatHandler"/>
public class OpenAIChatHandler(IOptionsMonitor<OpenAIOptions> options, ILogger<OpenAIChatHandler> logger) : IAIChatHandler
{
    private readonly OpenAIClient _client = new(options.CurrentValue.ApiKey);

    public LlmProvider ChatProvider => LlmProvider.OpenAI;

    /// <inheritdoc cref="IAIChatHandler.SendMessageAsync"/>
    public async Task<Response<AIChatResponse, GenericOperationStatuses>> SendMessageAsync(
        string message,
        List<McpTool> availableTools,
        List<ChatMessage>? conversationHistory = null,
        CancellationToken cancellationToken = default)
    {
        /* TODO: Critical part where user set models without proper capabilities could break the flow.
         * Need to validate model capabilities before making the call and return proper error message
         * to the user in case of misconfiguration.
        */
        var chatClient = _client.GetChatClient(options.CurrentValue.Model);

        var messages = new List<OpenAiChatMessage>();
        
        // Filter conversation history to only include user and assistant text messages
        // Skip tool messages and assistant messages with tool calls
        // OpenAI requires a specific sequence: assistant with tool_calls followed by tool responses
        // Since we're reconstructing history, we can't maintain this sequence properly,
        // so we only include messages that don't require this sequence
        var convertedHistory = conversationHistory
            ?.Where(cm => cm.Role != ChatRole.Tool && cm.ToolCalls == null)
            ?.Select(cm => cm.ToOpenAiChatMessage())
            .ToList();

        // Add conversation history
        if (convertedHistory != null)
        {
            messages.AddRange(convertedHistory);
        }

        // Add new user message if provided
        if (!string.IsNullOrWhiteSpace(message))
        {
            messages.Add(OpenAiChatMessage.CreateUserMessage(message));
        }

        // Convert MCP tools to OpenAI function format
        var tools = availableTools.Select(tool =>
            ChatTool.CreateFunctionTool(
                functionName: tool.Name,
                functionDescription: tool.Description,
                functionParameters: BinaryData.FromObjectAsJson(tool.InputSchema)
            )).ToList();

        var chatOptions = new ChatCompletionOptions
        {
            Temperature = (float)options.CurrentValue.Temperature,
            MaxOutputTokenCount = options.CurrentValue.MaxTokens,
        };
        
        // Add tools to the read-only collection
        foreach (var tool in tools)
        {
            chatOptions.Tools.Add(tool);
        }

        try
        {
            var completion = await chatClient.CompleteChatAsync(
                messages,
                chatOptions,
                cancellationToken);

            var responseMessage = completion.Value.Content;
            var toolCalls = completion.Value.ToolCalls;

            if (toolCalls?.Count > 0)
            {
                // LLM wants to call tools
                var incompletedMessageToReturn = new AIChatResponse
                {
                    IsComplete = false,
                    ToolCalls = toolCalls.Select(tc => new ToolCall
                    {
                        Id = tc.Id,
                        Name = tc.FunctionName,
                        Arguments = JsonSerializer.Deserialize<Dictionary<string, object>>(
                            tc.FunctionArguments.ToString()) ?? new()
                    }).ToList()
                };
                
                return Response<AIChatResponse, GenericOperationStatuses>.Success(
                    incompletedMessageToReturn, 
                    GenericOperationStatuses.Completed);
            }
            
            // LLM responded with text
            var completedMessageToReturn = new AIChatResponse
            {
                IsComplete = true,
                TextResponse = string.Join("", responseMessage.Select(c => c.Text))
            };
            
            return Response<AIChatResponse, GenericOperationStatuses>.Success(
                completedMessageToReturn, 
                GenericOperationStatuses.Completed);
        
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error calling ChatGPT API");
            return Response<AIChatResponse, GenericOperationStatuses>.Failure(
                GenericOperationStatuses.Failed,
                $"Error calling ChatGPT API: {ex.Message}");
        }
    }
}