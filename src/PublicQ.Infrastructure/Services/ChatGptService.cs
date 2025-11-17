using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using OpenAI;
using OpenAI.Chat;
using PublicQ.Application.Interfaces;
using PublicQ.Application.Models;
using PublicQ.Application.Models.Ai;
using PublicQ.Infrastructure.Extensions;
using PublicQ.Infrastructure.Options;
using ChatMessage = PublicQ.Application.Models.Ai.ChatMessage;
using OpenAiChatMessage = OpenAI.Chat.ChatMessage;

namespace PublicQ.Infrastructure.Services;

/// <inheritdoc cref="IAiChatService"/>
public class ChatGptService(IOptionsMonitor<OpenAIOptions> options, ILogger<ChatGptService> logger) : IAIChatService
{
    private readonly OpenAIClient _client = new(options.CurrentValue.ApiKey);

    /// <inheritdoc cref="IAiChatService.SendMessageAsync"/>
    public async Task<Response<AIChatResponse, GenericOperationStatuses>> SendMessageAsync(
        string message,
        List<McpTool> availableTools,
        List<ChatMessage>? conversationHistory = null,
        CancellationToken cancellationToken = default)
    {
        var chatClient = _client.GetChatClient(options.CurrentValue.Model);

        var messages = new List<OpenAiChatMessage>();
        
        // Add system prompt to guide the AI behavior
        messages.Add(OpenAiChatMessage.CreateSystemMessage(@"You are an AI Monkey that helps with assessment module management.

CRITICAL INSTRUCTIONS FOR TOOL RESULTS:
- When you receive tool results, ALWAYS analyze the data thoroughly
- Tool results contain JSON data - parse and examine it completely before responding
- Never claim you need more information if the data is already in the tool result
- If a tool returns questions/answers data, analyze all questions and answers for:
  * Factual accuracy
  * Correct answer markings (isCorrect flags)
  * Clear and unambiguous wording
  * Proper formatting

When reviewing assessment modules:
- Check each question's correctness
- Verify the correct answers are marked with isCorrect: true
- Point out any obvious errors (e.g., ""2+2=5"" marked as correct)
- Be direct and specific about what you find

Proceed with actions instead of asking for permission unless truly ambiguous."));
        
        // Filter conversation history to only include user and assistant text messages
        // Skip tool messages and assistant messages with tool calls to avoid OpenAI validation errors
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