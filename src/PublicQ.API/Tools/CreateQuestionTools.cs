using System.ComponentModel;
using FluentValidation;
using ModelContextProtocol.Server;
using PublicQ.Application.Interfaces;
using PublicQ.Application.Models;
using PublicQ.Application.Models.Exam;
using PublicQ.Shared.Enums;

namespace PublicQ.API.Tools;

/// <summary>
/// MCP tools for creating assessment questions
/// Shared between MCP server and ChatGPT integration
/// </summary>
[McpServerToolType]
public class CreateQuestionTools(
    IQuestionService questionService,
    IMcpAuthService mcpAuthService,
    IValidator<QuestionCreateDto> validator,
    ILogger<CreateQuestionTools> logger)
{
    /// <summary>
    /// Creates a new question for an assessment module.
    /// </summary>
    /// <param name="moduleId">The module ID.</param>
    /// <param name="moduleVersionId">The module version ID.</param>
    /// <param name="questionText">The question text.</param>
    /// <param name="questionType">The question type.</param>
    /// <param name="order">The question order.</param>
    /// <param name="answerOptions">The answer options.</param>
    /// <param name="staticFileIds">The static file IDs.</param>
    /// <returns>Result object with success status and created question details.</returns>
    [McpServerTool]
    [Description(@"Create a new question for an assessment module.

This tool allows you to add questions to assessment modules. You can create:
- Single Choice questions (with multiple answer options, one correct)
- Multiple Choice questions (with multiple answer options, multiple correct)
- Free Text questions (open-ended, no predefined answers)

⚠️ CRITICAL WORKFLOW - ALWAYS REVIEW BEFORE CREATING:
1. **FIRST**: Display the question(s) you plan to create to the user in a clear, formatted way
2. **SECOND**: Ask the user to review and confirm: ""Please review the question(s) above. Should I create them?""
3. **THIRD**: Only after user confirms, call this tool to create the question(s)
4. **NEVER**: Create questions without showing them to the user first

Example:
User: ""Create a question about the capital of France""
AI: ""I'll create the following question:

**Question**: What is the capital of France?
**Type**: Single Choice
**Answers**:
  - Paris ✓ (Correct)
  - London ✗
  - Berlin ✗
  - Madrid ✗

Should I create this question?""
User: ""Yes""
AI: [Calls CreateQuestion tool]

⚠️ CRITICAL RESTRICTION - Published Modules:
- You CANNOT add questions to a PUBLISHED module version
- If the module version is published, this operation will FAIL
- Check the module's version status before attempting to create questions
- If IsPublished = true, inform the user they must create a new draft version first

🎯 WORKFLOW - When User References a Module:
If user says ""add a question to module [title]"" or ""create question for module with id [guid]"":
1. **FIRST** call GetModuleAsync tool to fetch module details:
   - By title: GetModuleAsync({ title: ""module title"" })
   - By ID: GetModuleAsync({ id: ""guid"" })
2. **CHECK** if the module version IsPublished = true
   - If published: Inform user ""This module version is published. You need to create a new draft version before adding questions.""
   - If not published: Proceed to step 3
3. Extract moduleId and moduleVersionId from the response
4. **THEN** call this CreateQuestion tool with those IDs

Example:
User: ""Add a math question to 'Algebra Quiz'""
Step 1: Call GetModuleAsync({ title: ""Algebra Quiz"" }) → returns { id: ""abc-123"", versions: [{ id: ""version-456"", isPublished: false }] }
Step 2: Check isPublished = false (OK to proceed)
Step 3: Call CreateQuestion(moduleId: ""abc-123"", moduleVersionId: ""version-456"", questionText: ""What is 2+2?"", ...)

📎 ATTACHING FILES (Images/Media):
If you need to add images or files to a question:
1. First call UploadFilesToModuleAsync tool with the image URL(s)
2. It will return file ID(s) (GUIDs)
3. Then use those IDs in the staticFileIds parameter of this tool

🔍 CRITICAL for Image-Based Questions:
IF you have vision capabilities (can analyze images):
1. Find/search for the appropriate image
2. Analyze the image content
3. Show the image URL to the user with your description
4. Ask user to confirm: 'I found an image showing [your description]. Is this correct?'
5. Only proceed with creating answers after user confirmation

IF you CANNOT see/analyze images:
1. Find the image URL
2. Ask user to describe what's in the image
3. Wait for user confirmation before creating answers

Example workflow:
User: 'Create a question about counting apples with an image'
AI (with vision): 'I found an image at [URL] showing 2 red apples on a table. Can you confirm this is correct before I create the question?'
AI (without vision): 'I found an image at [URL]. How many apples does it show?'
User: 'Yes, that's correct' or 'It shows 2 apples'
AI: Creates question with correct answer options

IMPORTANT: You must provide ALL answer options (both correct and incorrect).
For example, for 'What is 2+2?':
- Provide: [{Text: '3', IsCorrect: false}, {Text: '4', IsCorrect: true}, {Text: '5', IsCorrect: false}]
- NOT just: [{Text: '4', IsCorrect: true}]

📎 AFTER CREATING QUESTIONS:
After successfully creating question(s), ALWAYS provide a clickable link to the module builder so users can easily view and manage their questions:
- Format: [View/Edit Questions in Module Builder](/module/build?moduleId={moduleId})
- Example: ""✅ Question created successfully! [View in Module Builder](/module/build?moduleId=abc-123-def-456)""
- Make the link prominent and easy to click
- This allows users to immediately see their created questions and make any adjustments

Example usage:
- ""Create a single choice question 'What is 2+2?' with answers 3 (incorrect), 4 (correct), and 5 (incorrect)""
- ""Add a true/false question about Python being a programming language with both True and False options""
- ""Create a free text question asking students to explain polymorphism""
- ""Create a question about the Eiffel Tower with an image"" (requires UploadFilesToModuleAsync first + user verification)")]
    public async Task<Response<QuestionDto, GenericOperationStatuses>> CreateQuestion(
        [Description("The ID of the assessment module to add the question to. Required.")]
        Guid moduleId,
        
        [Description("The ID of the module version to add the question to. Required.")]
        Guid moduleVersionId,
        
        [Description("The question text to display to students. Required (max 5000 characters). Can be omitted if staticFileIds are provided.")]
        string questionText,
        
        [Description("Type of question: SingleChoice, MultipleChoice, or FreeText")]
        QuestionType questionType,
        
        [Description("Display order of the question within the module (default: 0)")]
        int order = 0,
        
        [Description(@"Array of ALL answer options (both correct and incorrect). Required (cannot be empty).
- You MUST provide multiple answer options, not just the correct one
- Each answer must have Text (max 2000 chars) or StaticFileIds (at least one required per answer)
- Each answer needs IsCorrect (bool) and Order (int) properties
- SingleChoice: Exactly 1 answer must have IsCorrect=true, others must be false
- MultipleChoice: At least 1 answer must have IsCorrect=true, can have multiple correct
- FreeText: At least 1 answer must have IsCorrect=true

Example: [{Text: 'Paris', IsCorrect: true, Order: 0}, {Text: 'London', IsCorrect: false, Order: 1}, {Text: 'Berlin', IsCorrect: false, Order: 2}]")]
        List<PossibleAnswerCreateDto>? answerOptions = null,
        
        [Description("Optional array of static file IDs (images, diagrams) for the question itself")]
        List<Guid>? staticFileIds = null)
    {
        logger.LogDebug("Tool CreateQuestion called with moduleId: {ModuleId}, versionId: {VersionId}, type: {Type}",
            moduleId, moduleVersionId, questionType);

        var authValidation = mcpAuthService.IsInContributorPolicy();
        if (authValidation.IsFailed)
        {
            return Response<QuestionDto, GenericOperationStatuses>.Failure(
                authValidation.Status,
                authValidation.Message);
        }
        
        // Create request using existing DTOs
        var request = new QuestionCreateDto
        {
            ModuleId = moduleId,
            ModuleVersionId = moduleVersionId,
            Text = questionText,
            Type = questionType,
            Order = order,
            StaticFileIds = staticFileIds?.ToHashSet() ?? new HashSet<Guid>(),
            Answers = answerOptions ?? new List<PossibleAnswerCreateDto>()
        };

        // Validate using FluentValidation
        var validationResult = await validator.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            logger.LogDebug("Question validation failed: {Errors}", 
                string.Join(", ", validationResult.Errors.Select(e => e.ErrorMessage)));
            
            return Response<QuestionDto, GenericOperationStatuses>.Failure(
                GenericOperationStatuses.BadRequest,
                "Validation failed.",
                validationResult.Errors.Select(e => e.ErrorMessage).ToList());
        }

        var result = await questionService.CreateQuestionAsync(request, CancellationToken.None);
        if (result.IsFailed)
        {
            logger.LogWarning("Failed to create question: {Message}", result.Message);
            return result;
        }

        logger.LogDebug("Question created successfully with ID: {QuestionId}", result.Data!.Id);

        return Response<QuestionDto, GenericOperationStatuses>.Success(
            result.Data,
            GenericOperationStatuses.Completed,
            $"Question created successfully in module {moduleId}");
    }
}