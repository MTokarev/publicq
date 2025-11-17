using PublicQ.Application.Models.Exam;
using PublicQ.Application.Models.Session;
using PublicQ.Shared;

namespace PublicQ.API.Helpers;

/// <summary>
/// Helpers for validating and converting URLs in assessment module versions.
/// </summary>
public static class ValidateUrls
{
    /// <summary>
    /// Extension method to convert relative static file URLs in an AssessmentModuleVersionDto to absolute URLs using the provided base URL.
    /// </summary>
    /// <param name="moduleVersion">Module version <seealso cref="AssessmentModuleVersionDto"/></param>
    /// <param name="baseUrl">Base url to append</param>
    /// <returns>Return the modified <see cref="AssessmentModuleVersionDto"/></returns>
    public static AssessmentModuleVersionDto? ToAbsoluteUrls(this AssessmentModuleVersionDto? moduleVersion, string baseUrl)
    {
        Guard.AgainstNull(baseUrl, nameof(baseUrl));
        
        if (moduleVersion == null) return null!;

        moduleVersion.StaticFileUrls = moduleVersion.StaticFileUrls?
            .Select(u => $"{baseUrl}/{u}")
            .ToHashSet();
        
        moduleVersion.Questions?.ForEach(q =>
        {
            q.ToAbsoluteUrls(baseUrl);
        });

        return moduleVersion;
    }
    
    /// <summary>
    /// Converts relative static file URLs in an AssessmentModuleDto to absolute URLs using the provided base URL.
    /// </summary>
    /// <param name="module">Module to replace <seealso cref="AssessmentModuleDto"/></param>
    /// <param name="baseUrl">Base Url</param>
    /// <returns>Returns modified module <seealso cref="AssessmentModuleDto"/></returns>
    public static AssessmentModuleDto? ToAbsoluteUrls(this AssessmentModuleDto? module, string baseUrl)
    {
        if (module == null) return null!;
        
        module.LatestVersion = module.LatestVersion.ToAbsoluteUrls(baseUrl)!;
        
        return module;
    }

    /// <summary>
    /// Converts relative static file URLs in a GroupStateDto to absolute URLs using the provided base URL.
    /// </summary>
    /// <param name="groupState"><see cref="GroupStateDto"/></param>
    /// <param name="baseUrl">Base URL</param>
    /// <returns>Returns <see cref="GroupStateDto"/> with converted Static File URLs</returns>
    public static GroupStateDto? ToAbsoluteUrls(this GroupStateDto? groupState, string baseUrl)
    {
        if (groupState == null) return null;
        
        foreach (var groupStateGroupMember in groupState.GroupMembers)
        {
            groupStateGroupMember.StaticFileUrls = groupStateGroupMember.StaticFileUrls?
                .Select(urlPart => $"{baseUrl}/{urlPart}")
                .ToHashSet();
        }

        return groupState;
    }
    
    /// <summary>
    /// Converts relative static file URLs in a QuestionDto to absolute URLs using the provided base URL.
    /// </summary>
    /// <param name="question">Question to update</param>
    /// <param name="baseUrl">Base url</param>
    /// <returns>Returns updated <see cref="QuestionDto"/></returns>
    public static QuestionDto? ToAbsoluteUrls(this QuestionDto? question, string baseUrl)
    {
        if (question == null) return null;
        question.StaticFileUrls = question.StaticFileUrls?
            .Select(urlPart => $"{baseUrl}/{urlPart}")
            .ToHashSet();
        
        question.Answers?.ForEach(a =>
        {
            a.StaticFileUrls = a.StaticFileUrls?
                .Select(urlPart => $"{baseUrl}/{urlPart}")
                .ToHashSet();
        });
        
        return question;
    }
}