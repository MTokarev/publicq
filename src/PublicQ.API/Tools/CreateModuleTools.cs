using System.ComponentModel;
using ModelContextProtocol.Server;
using PublicQ.Application.Interfaces;
using PublicQ.Application.Models;
using PublicQ.Application.Models.Exam;

namespace PublicQ.API.Tools;

/// <summary>
/// MCP tools for creating assessment modules
/// </summary>
[McpServerToolType]
public class CreateModuleTools(
    IAssessmentService assessmentService, 
    IMcpAuthService mcpAuthService, 
    ILogger<CreateModuleTools> logger)
{
    /// <summary>
    /// Creates a new assessment module with an initial draft version.
    /// </summary>
    /// <param name="moduleToCreate">Module creation data</param>
    /// <param name="description">Description of the module</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Created module details</returns>
    [McpServerTool]
    [Description(@"Creates a new assessment module with an initial draft version.

📋 OVERVIEW:
This tool creates a brand new assessment module in the system. An assessment module is a container for questions that can be used to create quizzes, tests, or exams. Each module starts with a draft version (version 1) that can be edited before publishing.

🎯 WHEN TO USE:
- User asks to ""create a new module/assessment/test/quiz""
- User wants to start building a new set of questions
- Setting up a new subject area or topic for assessment
- Before adding questions, a module must exist first

📥 REQUIRED PARAMETERS:
- moduleToCreate.Title: The name/title of the module (e.g., ""Math Quiz"", ""History Test"", ""Programming Assessment"")
- description: A description of what this module covers (e.g., ""Basic algebra questions"", ""World War II history"")

⚙️ OPTIONAL PARAMETERS (moduleToCreate object):
- PassingScorePercentage: Minimum score to pass (default: 70)
- DurationInMinutes: Time limit for taking the assessment (default: 60)

📤 RETURNS:
Returns the created module with:
- Module ID (use for adding questions later)
- Module Version ID (the draft version, needed for adding questions)
- Title, Description
- isPublished: false (draft version)
- Created date and user information

🔍 USAGE EXAMPLES:

Example 1 - Simple module:
User: ""Create a math quiz module""
Tool call:
{
  ""moduleToCreate"": {
    ""Title"": ""Math Quiz""
  },
  ""description"": ""Basic mathematics assessment covering algebra and geometry""
}

Example 2 - Module with custom settings:
User: ""Create a 30-minute Python programming test with 80% passing score""
Tool call:
{
  ""moduleToCreate"": {
    ""Title"": ""Python Programming Test"",
    ""DurationInMinutes"": 30,
    ""PassingScorePercentage"": 80
  },
  ""description"": ""Intermediate Python programming assessment covering functions, classes, and data structures""
}

🔄 TYPICAL WORKFLOW:
1. CreateModule → Get module ID and version ID from result
2. Use module ID with UploadFilesToModule (if questions need images/files)
3. Use module ID + version ID with CreateQuestion to add questions
4. Publish the module when ready (separate operation)

📎 AFTER CREATING MODULE:
After successfully creating a module, ALWAYS provide a clickable link to the module builder so users can easily view and manage their module:
- Format: [View/Edit Module in Module Builder](/module/build?moduleId={moduleId})
- Example: ""✅ Module created successfully! [View in Module Builder](/module/build?moduleId=abc-123-def-456)""
- Make the link prominent and easy to click
- This allows users to immediately see their created module and start adding questions

⚠️ IMPORTANT NOTES:
- Module starts in DRAFT mode (not published)
- Must be published before students can take it
- Module ID and Version ID are needed for adding questions
- Title should be descriptive and clear
- Description helps users understand the module's purpose
- Passing score is a percentage (0-100)
- Duration is in minutes

💡 TIPS:
- Use clear, descriptive titles (e.g., ""Chapter 5 Biology Quiz"" not just ""Quiz"")
- Include topic/subject in the description
- Set appropriate time limits based on question count
- Default 70% passing score works for most cases
- Always save the returned module ID and version ID for subsequent operations")]
    public async Task<Response<AssessmentModuleDto, GenericOperationStatuses>> CreateModuleAsync(
        [Description(@"Module creation data object. Required.
Properties:
- Title (string, required): The module title/name (e.g., 'Math Quiz', 'History Test')
- PassingScorePercentage (int, optional): Minimum score to pass, 0-100 (default: 70)
- DurationInMinutes (int, optional): Time limit in minutes (default: 60)

Example:
{
  ""Title"": ""Python Programming Test"",
  ""PassingScorePercentage"": 80,
  ""DurationInMinutes"": 30
}")]
        AssessmentModuleCreateDto moduleToCreate,
        
        [Description("Description of what this module covers (e.g., 'Basic algebra questions', 'World War II history'). Required.")]
        string description,
        CancellationToken cancellationToken)
    {
        var authResponse = mcpAuthService.IsInContributorPolicy();
        if (authResponse.IsFailed)
        {
            logger.LogWarning("Unauthorized attempt to create module.");
            return Response<AssessmentModuleDto, GenericOperationStatuses>.Failure(
                GenericOperationStatuses.Unauthorized,
                "User is not authorized to create modules.");
        }

        var createResponse = await assessmentService.CreateModuleAsync(moduleToCreate, cancellationToken);
        if (createResponse.IsFailed)
        {
            logger.LogError("Failed to create module: {@ErrorMessages}", createResponse.Errors);
            return Response<AssessmentModuleDto, GenericOperationStatuses>.Failure(
                createResponse.Status,
                createResponse.Message,
                createResponse.Errors);
        }

        logger.LogInformation("Module created successfully with ID: {ModuleId}", createResponse.Data);
        return Response<AssessmentModuleDto, GenericOperationStatuses>.Success(
            createResponse.Data!,
            GenericOperationStatuses.Completed,
            "Module created successfully.");
    }
}