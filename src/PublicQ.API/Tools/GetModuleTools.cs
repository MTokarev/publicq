using System.ComponentModel;
using ModelContextProtocol.Server;
using PublicQ.Application;
using PublicQ.Application.Interfaces;
using PublicQ.Application.Models;
using PublicQ.Application.Models.Exam;
using PublicQ.Shared;

namespace PublicQ.API.Tools;

/// <summary>
/// MCP tools for retrieving assessment modules
/// </summary>
[McpServerToolType]
public class GetModuleTools(
    IMcpAuthService mcpAuthService,
    IAssessmentService assessmentService,
    ILogger<GetModuleTools> logger)
{
    /// <summary>
    /// Retrieves an assessment module by ID or Title.
    /// </summary>
    /// <param name="filter">Filter criteria (Id or Title)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Assessment module details</returns>
    [McpServerTool]
    [Description(@"Retrieve an assessment module by its ID or Title.

This tool allows you to fetch module information by providing either:
- Module ID (GUID) - for exact module lookup
- Module Title (string) - for searching by title
- Both - if you want to match both criteria

**IMPORTANT - At least one parameter is required:**
- You MUST provide either 'id' OR 'title' (or both)
- Providing neither will result in a validation error

**⚠️ CRITICAL - COMPLETE DATA RETURNED:**
This tool returns the COMPLETE module data including:
- ALL questions in the module with their full text
- ALL answer options for each question with their text
- The isCorrect flag for each answer (true = correct answer, false = incorrect)
- Question types (SingleChoice, MultipleChoice, FreeText)
- Static files (images, documents) if any

**When user asks to review/check/audit a module:**
1. Call this tool to get the module
2. The response contains EVERYTHING you need - all questions and answers are in the JSON
3. Parse the 'questions' array from the result
4. Each question has an 'answers' array with 'text' and 'isCorrect' fields
5. ANALYZE the data immediately - don't ask for more information
6. Check for errors like wrong answers marked as correct

Example of returned data structure:
{
  ""questions"": [
    {
      ""text"": ""What is 2+2?"",
      ""answers"": [
        {""text"": ""3"", ""isCorrect"": false},
        {""text"": ""4"", ""isCorrect"": true},
        {""text"": ""5"", ""isCorrect"": false}
      ]
    }
  ]
}

**WORKFLOW - Creating Questions:**
When a user asks to create a question for a module:
1. First call this tool to get the module details (especially moduleId and moduleVersionId)
2. Use the returned moduleId and moduleVersionId when calling CreateQuestion tool
3. This ensures you're creating questions in the correct module version

Example:
User: ""Add a question to Math Quiz about algebra""
1. Call GetModuleAsync({ title: ""Math Quiz"" }) → Get moduleId and latest moduleVersionId
2. Call CreateQuestion with the moduleId and moduleVersionId from step 1

**Usage Examples:**
- Get module by ID: { ""id"": ""bcc5c149-2746-46d1-ad19-f9baee920c51"" }
- Get module by title: { ""title"": ""Math Quiz"" }
- Get module by both: { ""id"": ""bcc5c149-2746-46d1-ad19-f9baee920c51"", ""title"": ""Math Quiz"" }")]
    public async Task<Response<AssessmentModuleDto, GenericOperationStatuses>> GetModuleAsync(
        [Description(@"Filter criteria for finding the module. Required.
- id: Module GUID (optional)
- title: Module title (optional)
- At least one must be provided")]
        AssessmentModuleFilter filter,
        CancellationToken cancellationToken = default)
    {
        logger.LogDebug("GetModuleAsync called.");
        Guard.AgainstNull(filter, nameof(filter));
        
        var authResponse = mcpAuthService.IsInContributorPolicy();
        if (authResponse.IsFailed)
        {
            logger.LogWarning("Authorization failed: {Message}", authResponse.Message);
            return Response<AssessmentModuleDto, GenericOperationStatuses>.Failure(
                authResponse.Status,
                authResponse.Message);
        }

        return await assessmentService.GetModuleAsync(filter, cancellationToken);
    }
}