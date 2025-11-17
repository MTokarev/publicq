using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PublicQ.API.Helpers;
using PublicQ.API.Models.Requests;
using PublicQ.Application.Interfaces;
using PublicQ.Application.Models;
using PublicQ.Application.Models.Ai;
using PublicQ.Shared;

namespace PublicQ.API.Controllers;

/// <summary>
/// AI chat controller.
/// </summary>
/// <param name="chatService"> Chat service <see cref="IAIChatService"/></param>
[ApiController]
[Authorize(Constants.ContributorsPolicy)]
[Route($"{Constants.ControllerRoutePrefix}/ai-chat")]
public class AIChatController(IAIChatService chatService) : ControllerBase
{
    /// <summary>
    /// Sends a message to the AI chat service and retrieves the response.
    /// </summary>
    /// <param name="request"><see cref="request"/></param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns <see cref="AIChatResponse"/> wrapped into <see cref="Response{TData, TStatus}"/></returns>
    [HttpPost("message")]
    public async Task<IActionResult> SendMessage(
        [FromBody] AiChatRequest request,
        CancellationToken cancellationToken)
    {
        var response = await chatService.SendMessageAsync(
            request.Message,
            request.AvailableTools,
            request.ConversationHistory,
            cancellationToken);

        return response.ToActionResult();
    }
}