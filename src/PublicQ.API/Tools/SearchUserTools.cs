using System.ComponentModel;
using ModelContextProtocol.Server;
using PublicQ.API.Models.Requests;
using PublicQ.Application.Interfaces;
using PublicQ.Application.Models;
using PublicQ.Shared;

namespace PublicQ.API.Tools;

/// <summary>
/// MCP tools for searching and finding users in the system
/// </summary>
[McpServerToolType]
public class SearchUserTools(
    IUserService userService, 
    IMcpAuthService mcpAuthService, 
    ILogger<SearchUserTools> logger)
{
    /// <summary>
    /// Searches for users by email or ID with pagination support.
    /// </summary>
    /// <param name="request">Search request parameters</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Paginated list of users matching the search criteria</returns>
    [McpServerTool]
    [Description(@"Search for users in the system by email or user ID with pagination support.

**OVERVIEW:**
This tool searches for users across the entire system based on partial email or ID matches. It returns paginated results and supports both regular users and exam takers. This is a **read-only** tool that only retrieves user information - it does not perform any actions on users.

**WHEN TO USE:**
- Finding users by partial email address (e.g., ""john@"" matches ""john@example.com"")
- Finding users by partial ID (e.g., ""ABC"" matches ""ABC-123-DEF"")
- Listing users with pagination
- Verifying if a user exists in the system
- Getting user details to display to the user
- Searching for exam takers by their student ID

**⚠️ IMPORTANT - THIS TOOL ONLY SEARCHES:**
- This tool ONLY retrieves and displays user information
- It does NOT perform actions like reset password, assign roles, delete users, etc.
- After finding users, simply present the results to the user
- If the user is an exam taker who has taken assignments, you CAN offer to get their comprehensive performance report using the GetExamTakerReport tool
- For other actions (reset password, assign roles, etc.), inform the user to use the web interface

**REQUIRED PERMISSION:**
- Contributor role or higher required
- Cannot access if not authorized

**⚠️ CRITICAL - SEARCH BEHAVIOR:**
This tool performs **server-side search** across the entire user database:
- Searches are **case-insensitive** and match **partial strings**
- EmailPart searches in the user's email field
- IdPart searches in the user's ID field
- You can search by email OR ID OR both simultaneously
- Results are **paginated** - only returns one page at a time
- Empty search parameters return all users (paginated)

**PARAMETERS:**

1. **request.EmailPart** (string, optional):
   - Partial email to search for
   - Case-insensitive
   - Example: ""john"" matches ""john@example.com"", ""johnny@test.com""
   - Leave empty to skip email filtering

2. **request.IdPart** (string, optional):
   - Partial user ID to search for
   - Case-insensitive
   - Example: ""ABC"" matches ""ABC-123"", ""XABC99""
   - Leave empty to skip ID filtering

3. **request.PageNumber** (int, default: 0):
   - Zero-based page number
   - 0 = first page, 1 = second page, etc.
   - Use for pagination when results exceed PageSize

4. **request.PageSize** (int, default: 10):
   - Number of results per page
   - Typical values: 10, 25, 50, 100
   - Maximum value may be enforced by backend

**RETURNED DATA:**
Returns a PaginatedResponse<User> containing:
- **Data** (array of User objects):
  * Id - Unique user identifier
  * Email - User's email address
  * FullName - User's full name
  * IsExamTaker - Boolean indicating if user is an exam taker (no password)
  * DateOfBirth - Optional date of birth
  * CreatedAt - When the user was created
  * And other user properties...

- **TotalPages** (int) - Total number of pages available
- **CurrentPage** (int) - Current page number (0-based)
- **TotalCount** (int) - Total number of users matching the search

**USAGE EXAMPLES:**

1. Search for users by email:
   Input: { ""EmailPart"": ""john"", ""IdPart"": """", ""PageNumber"": 0, ""PageSize"": 10 }
   Use case: Find all users with ""john"" in their email

2. Search for user by ID:
   Input: { ""EmailPart"": """", ""IdPart"": ""ABC-123"", ""PageNumber"": 0, ""PageSize"": 10 }
   Use case: Find user with specific ID or partial ID match

3. Get all users (first page):
   Input: { ""EmailPart"": """", ""IdPart"": """", ""PageNumber"": 0, ""PageSize"": 25 }
   Use case: List all users in the system

4. Combined search:
   Input: { ""EmailPart"": ""test"", ""IdPart"": ""STU"", ""PageNumber"": 0, ""PageSize"": 10 }
   Use case: Find users with ""test"" in email AND ""STU"" in ID

5. Pagination:
   Input: { ""EmailPart"": ""example.com"", ""IdPart"": """", ""PageNumber"": 2, ""PageSize"": 10 }
   Use case: Get third page (page 2, zero-based) of users from example.com domain

**WORKFLOW - Finding Users:**
When asked to find a user:
1. Call this tool with appropriate search parameters (email or ID)
2. Review the returned users list and extract the user's ID
3. Present the results to the user clearly, including the user's ID
4. If multiple matches, show all matching users
5. **IMPORTANT**: If user asks for a report for a previously found user, you can use the user ID from the previous search result - you DO NOT need to search again if you already have the ID in the conversation context
6. If the found user is an exam taker or regular user, you MAY offer to get their comprehensive performance report using GetExamTakerReport tool with their user ID
7. For other actions (password reset, role management), inform user to use the web interface

**TYPICAL USER REQUESTS:**
- ""Find user with email john@example.com""
- ""Search for users from gmail.com domain""
- ""Find exam taker with ID ABC-123""
- ""List all users in the system""
- ""Find user John Doe""
- ""Show me page 2 of users""
- ""Does user X exist?""
- ""How many users do we have?""

**IMPORTANT NOTES:**
- Search is performed on the **server side** across all users in the database
- Results are **NOT** limited to a pre-loaded page - searches the entire database
- Empty search returns all users (useful for listing/browsing)
- Pagination is **zero-based** (first page = 0)
- Both regular users and exam takers are included in results
- Use IsExamTaker property to distinguish user types
- For exact email match, provide the full email address
- **Remember user IDs from search results**: If you just searched for a user and have their ID in the conversation, you can use it directly for GetExamTakerReport without searching again
- When presenting user information, ALWAYS show the user ID so it's available for subsequent operations

**ERROR HANDLING:**
- Returns empty data array if no users match the search criteria
- Returns failure if user lacks Contributor permissions
- Invalid page numbers default to showing available results
- Negative page numbers or sizes may be rejected by backend

**PERFORMANCE TIPS:**
- Use specific search terms to reduce result set
- Adjust PageSize based on expected number of results
- For large user bases, prefer specific email/ID searches over empty searches")]
    public async Task<Response<PaginatedResponse<User>, GenericOperationStatuses>> SearchUsersAsync(
        [Description(@"Search request containing filter criteria and pagination settings. Required properties:
- EmailPart (string, optional): Partial email to search for (case-insensitive, e.g., 'john')
- IdPart (string, optional): Partial user ID to search for (case-insensitive, e.g., 'ABC-123')
- PageNumber (int, default 0): Zero-based page number for pagination
- PageSize (int, default 10): Number of results per page

Example: { ""EmailPart"": ""john"", ""IdPart"": """", ""PageNumber"": 0, ""PageSize"": 10 }")]
        SearchUserRequest request, 
        CancellationToken cancellationToken)
    {
        logger.LogDebug("SearchUsersAsync called.");
        Guard.AgainstNull(request, nameof(request));
        
        var authResponse = mcpAuthService.IsInContributorPolicy();
        if (!authResponse.IsSuccess || !authResponse.Data)
        {
            logger.LogWarning("Unauthorized access attempt to SearchUsersAsync.");
            throw new UnauthorizedAccessException("User is not authorized to perform this action.");
        }

        var result = await userService.GetUsersByFilter(
            request.EmailPart,
            request.IdPart,
            request.PageNumber,
            request.PageSize,
            cancellationToken);
        
        return result;
    }
}