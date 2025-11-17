using System.ComponentModel;
using Microsoft.Extensions.Options;
using ModelContextProtocol.Server;
using PublicQ.Application.Interfaces;
using PublicQ.Application.Models;
using PublicQ.Application.Models.Exam;
using PublicQ.Infrastructure.Options;

namespace PublicQ.API.Tools;

/// <summary>
/// MCP Server Tool type for file uploads.
/// </summary>
[McpServerToolType]
public class FileUploadTools(
    IHttpClientFactory clientFactory,
    IAssessmentService assessmentService,
    IMcpAuthService mcpAuthService,
    IOptionsMonitor<FileStorageOptions> fileStorageOptions,
    ILogger<FileUploadTools> logger)
{
    /// <summary>
    /// Uploads files to a specified assessment module.
    /// </summary>
    /// <param name="moduleId">Module Id</param>
    /// <param name="fileUrls">File URLs to import</param>
    /// <returns>Returns <see cref="Response{TData, TStatus}"/></returns>
    [McpServerTool]
    [Description(@"Upload files to an assessment module by downloading them from public URLs.

Use this tool to attach images or documents to questions and answers. Files are downloaded from the provided URLs 
and saved to the module's storage. The returned file IDs can then be used when creating questions.

⚠️ CRITICAL WARNINGS:
- This tool CANNOT generate or create images
- This tool CANNOT view or analyze image content
- You MUST ask the user to provide the image URL or verify image content before creating questions
- DO NOT make assumptions about image content based on URL or search results
- If user requests 'two apples' but you cannot verify the image shows two apples, ASK THE USER to confirm

Parameters:
- moduleId: The GUID of the assessment module to upload files to (required)
- fileUrls: Array of public HTTP/HTTPS URLs pointing to files (required, at least one URL)

Supported file formats:
- Images: .jpg, .jpeg, .png, .mp3, .mp4
- Documents: .pdf

File size limit: Check module settings (typically 5MB per file)

Returns: Set of file IDs (GUIDs) that can be used in the CreateQuestion tool

Typical workflow:
1. User provides image URL OR you ask user for URL
2. Call UploadFilesToModuleAsync(moduleId, [url1, url2, ...])
3. Receive file IDs back (e.g., ['abc-123', 'def-456'])
4. If creating questions about image content, ASK USER to describe what's in the image
5. Use those IDs in CreateQuestion's staticFileIds parameter

Example:
User: 'Create a question about the Eiffel Tower with an image'
AI: 'Please provide the image URL, or I can search for one. Can you verify the image content before I create the question?'
User: 'Use https://example.com/eiffel.jpg - it shows the Eiffel Tower'
AI: Uploads file → Creates question with verified content
")]
    public async Task<Response<HashSet<Guid>, GenericOperationStatuses>> UploadFilesToModuleAsync(
        [Description("Module ID. Required to identify the assessment module.")]
        Guid moduleId,
        [Description("Set of file URLs to upload. It is required to provide at least one URL.")]
        HashSet<string> fileUrls)
    {
        logger.LogInformation("Uploading {Count} files to module {ModuleId}", fileUrls.Count, moduleId);
        
        if (moduleId == Guid.Empty || fileUrls.Count == 0)
        {
            return Response<HashSet<Guid>, GenericOperationStatuses>.Failure(
                GenericOperationStatuses.BadRequest,
                "Module ID and at least one file URL are required.");
        }
        
        var authValidation = mcpAuthService.IsInContributorPolicy();
        if (authValidation.IsFailed)
        {
            return Response<HashSet<Guid>, GenericOperationStatuses>.Failure(
                authValidation.Status,
                authValidation.Message);
        }

        var uploadedFileIds = new HashSet<Guid>();
        var httpClient = clientFactory.CreateClient();
        
        // Add headers to avoid 403 errors from sites like Wikimedia
        httpClient.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36");
        httpClient.DefaultRequestHeaders.Add("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8");
        httpClient.DefaultRequestHeaders.Add("Accept-Language", "en-US,en;q=0.9");

        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".mp3", ".mp4" };
        foreach (var fileUrl in fileUrls)
        {
            // Download the file
            var response = await httpClient.GetAsync(fileUrl);
            response.EnsureSuccessStatusCode();

            // Read content as byte array
            var fileBytes = await response.Content.ReadAsByteArrayAsync();
            var fileName = GetFileNameFromUrl(fileUrl, response);
            
            var extension = Path.GetExtension(fileName).ToLower();
            if (!allowedExtensions.Contains(extension))
            {
                logger.LogWarning("File {FileUrl} has extension that is not allowed.", fileUrl);
                return Response<HashSet<Guid>, GenericOperationStatuses>.Failure(
                    GenericOperationStatuses.BadRequest,
                    $"File {fileUrl} has an unsupported file type.");
            }
            
            // Check file size (use existing UploadSizeLimitFilter config)
            var maxSizeBytes = fileStorageOptions.CurrentValue.MaxUploadFileSizeInKilobytes * 1024;
            if (fileBytes.Length > maxSizeBytes)
            {
                return Response<HashSet<Guid>, GenericOperationStatuses>.Failure(
                    GenericOperationStatuses.BadRequest,
                    $"File {fileUrl} exceeds the maximum allowed size of {fileStorageOptions.CurrentValue.MaxUploadFileSizeInKilobytes} KB.");
            }
            
            var fileUploadDto = new FileUploadDto
            {
                Content = fileBytes,
                Name = fileName
            };

            var fileUploadResult = await assessmentService.SaveAssociatedWithModuleStaticFileAsync(
                moduleId,
                fileUploadDto,
                isModuleLevelFile: false,
                cancellationToken: CancellationToken.None);

            if (fileUploadResult.IsFailed)
            {
                return Response<HashSet<Guid>, GenericOperationStatuses>.Failure(
                    GenericOperationStatuses.Failed,
                    $"Failed to upload file from {fileUrl}: {fileUploadResult.Message}",
                    fileUploadResult.Errors);
            }
            
            logger.LogDebug("File from {FileUrl} uploaded successfully with ID {FileId}",
                fileUrl, fileUploadResult.Data!.Id);
            uploadedFileIds.Add(fileUploadResult.Data.Id);
        }
        
        return Response<HashSet<Guid>, GenericOperationStatuses>.Success(
            uploadedFileIds,
            GenericOperationStatuses.Completed,
            $"Successfully uploaded {uploadedFileIds.Count} files to module {moduleId}");
    }
    
    /// <summary>
    /// Gets the file name from the URL or response headers.
    /// </summary>
    /// <param name="url">File URL</param>
    /// <param name="response"><see cref="HttpResponseMessage"/></param>
    /// <returns>Returns file name</returns>
    private string GetFileNameFromUrl(string url, HttpResponseMessage response)
    {
        // Try Content-Disposition header first
        if (response.Content.Headers.ContentDisposition?.FileName != null)
        {
            return response.Content.Headers.ContentDisposition.FileName.Trim('"');
        }
    
        // Fall back to URL path
        var uri = new Uri(url);
        var fileName = Path.GetFileName(uri.LocalPath);
    
        // If no extension, try to add from Content-Type
        if (string.IsNullOrEmpty(Path.GetExtension(fileName)))
        {
            var contentType = response.Content.Headers.ContentType?.MediaType;
            var extension = GetExtensionFromContentType(contentType);
            fileName = $"{fileName}{extension}";
        }
    
        return fileName;
    }

    /// <summary>
    /// Gets file extension from content type.
    /// </summary>
    /// <param name="contentType">Content type</param>
    /// <returns>File extension</returns>
    private string GetExtensionFromContentType(string? contentType)
    {
        return contentType switch
        {
            "image/png" => ".png",
            "image/jpeg" => ".jpeg",
            "audio/mpeg" => ".mp3",
            "video/mp4" => ".mp4",
            "application/pdf" => ".pdf",
            _ => ".jpg"
        };
    }
}