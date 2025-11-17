using System.Net.Mail;
using PublicQ.Application.Models;
using PublicQ.Domain.Enums;

namespace PublicQ.Application.Interfaces;

/// <summary>
/// Represents user service interface for managing user-related operations.
/// </summary>
/// TODO: Add method to check if a user exists by email/id.
public interface IUserService
{
    /// <summary>
    /// Login user with email and password.
    /// </summary>
    /// <param name="userId">User email</param>
    /// <param name="password">User password</param>
    /// <returns>Returns a token wrapped in <see cref="Response{TData, TStatus}"/></returns>
    Task<Response<string, GenericOperationStatuses>> LoginUserAsync(
        string userId, 
        string password);

    /// <summary>
    /// Register a new user.
    /// </summary>
    /// <remarks>
    /// Caller must ensure that the password meets the security requirements.
    /// </remarks>
    /// <param name="email">User email address.</param>
    /// <param name="fullName">Full Name</param>
    /// <param name="password">Password.</param>
    /// <param name="dateOfBirth">Date of birthF</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns a response with the token and the status <seealso cref="Response{TStatus}"/></returns>
    Task<Response<Token, GenericOperationStatuses>> SelfServiceUserRegistartionReturnTokenAsync(
        MailAddress email,
        string fullName,
        string password,
        DateTime? dateOfBirth,
        CancellationToken cancellationToken);

    /// <summary>
    /// Register a new user.
    /// </summary>
    /// <remarks>
    /// Caller must ensure that the password meets the security requirements.
    /// </remarks>
    /// <param name="email">User email address.</param>
    /// <param name="fullName">Full Name</param>
    /// <param name="password">
    /// Optional: Password. If not set the only way to gain
    /// access is to open the link and set the new password
    /// </param>
    /// <param name="dateOfBirth">Optional: Date of birth</param>
    /// <param name="baseUrl">Create password URL</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns a response with the status <seealso cref="Response{TStatus}"/></returns>
    Task<Response<GenericOperationStatuses>> SelfServiceUserRegistrationAsync(
        MailAddress email,
        string fullName,
        string? password,
        DateTime? dateOfBirth,
        string? baseUrl,
        CancellationToken cancellationToken);

    /// <summary>
    /// Register a new user by an admin.
    /// </summary>
    /// <param name="email">Email</param>
    /// <param name="fullName">Full name</param>
    /// <param name="password">Optional: Password</param>
    /// <param name="dateOfBirth">Optional: Date of birth</param>
    /// <param name="baseUrl">Optional: Base URL</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns a response with the status <seealso cref="Response{TStatus}"/></returns>
    Task<Response<GenericOperationStatuses>> RegisterIdentityUserByAdminAsync(
        MailAddress email,
        string fullName,
        string? password,
        DateTime? dateOfBirth,
        string? baseUrl,
        CancellationToken cancellationToken);

    /// <summary>
    /// Register a new exam taker (user without credentials).
    /// </summary>
    /// <param name="email">Optional: Exam taker email address</param>
    /// <param name="id">Optional: Exam taker Identifier</param>
    /// <param name="dateOfBirth">Date of birth</param>
    /// <param name="fullName">Full Name</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns <see cref="User"/> wrapped in <see cref="Response{TData, TStatus}"/></returns>
    Task<Response<User, GenericOperationStatuses>> RegisterExamTakerAsync(
        MailAddress? email,
        string? id,
        DateTime? dateOfBirth,
        string fullName,
        CancellationToken cancellationToken);
    
    /// <summary>
    /// Reset user password by an admin.
    /// </summary>
    /// <remarks>
    /// This does not require the old password.
    /// Caller must ensure that the password meets the security requirements.
    /// </remarks>
    /// <param name="email">User email address.</param>
    /// <param name="password">New user's password.</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns a response with the status <seealso cref="Response{TStatus}"/></returns>
    Task<Response<GenericOperationStatuses>> ResetIdentityUserPasswordByAdminAsync(
        MailAddress email, 
        string password,
        CancellationToken cancellationToken);
    
    /// <summary>
    /// Delete user account
    /// </summary>
    /// <param name="userId">User Id</param>
    /// <param name="cancellation">Cancellation token</param>
    /// <returns><seealso cref="Response{TStatus}"/></returns>
    Task<Response<GenericOperationStatuses>> DeleteUserAsync(string userId, CancellationToken cancellation);
    
    /// <summary>
    /// Assign a role to a user.
    /// </summary>
    /// <param name="userId">User unique identifier</param>    /// <param name="roleName">Role name to assign</param>
    /// <returns>Returns <see cref="Response{TStatus}"/></returns>
    Task<Response<GenericOperationStatuses>> AssignIdentityRoleAsync(
        string userId,
        UserRole roleName);
    
    /// <summary>
    /// Delete a role from a user.
    /// </summary>
    /// <param name="userId">User unique identifier</param>
    /// <param name="roleName">Role name to delete</param>
    /// <returns>Returns <see cref="Response{TStatus}"/></returns>
    Task<Response<GenericOperationStatuses>> UnassignIdentityRoleAsync(
        string userId, 
        UserRole roleName);
    
    /// <summary>
    /// Get users with pagination support. That includes IdentityUsers and ExamTakers.
    /// </summary>
    /// <param name="pageNumber">Page number</param>
    /// <param name="pageSize">Page size</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns <see cref="PaginatedResponse{T}"/> wrapped into <see cref="Response{TData, TStatus}"/></returns>
    Task<Response<PaginatedResponse<User>, GenericOperationStatuses>> GetUsersAsync(
        int pageNumber = 1, 
        int pageSize = 10, 
        CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Get exam taker by its unique identifier.
    /// </summary>
    /// <param name="id">Exam takers` unique ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns <see cref="User"/> wrapped into <see cref="Response{TData, TStatus}"/></returns>
    Task<Response<User, GenericOperationStatuses>> GetExamTakerByIdAsync(
        string id, 
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get users with pagination support.
    /// </summary>
    /// <param name="email">Email address part.</param>
    /// <param name="id">User ID part</param>
    /// <param name="pageNumber">Page number</param>
    /// <param name="pageSize">Page size</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns <see cref="PaginatedResponse{T}"/> wrapped into <see cref="Response{TData, TStatus}"/></returns>
    Task<Response<PaginatedResponse<User>, GenericOperationStatuses>> GetUsersByFilter(
        string email,
        string id,
        int pageNumber = 1, 
        int pageSize = 10,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get user by its unique identifier.
    /// </summary>
    /// <param name="userIds">Array of User ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns <see cref="User"/> wrapped in <see cref="Response{TData, TStatus}"/></returns>
    Task<Response<IList<User>, GenericOperationStatuses>> GetUsersByIdAsync(
        HashSet<string> userIds, 
        CancellationToken cancellationToken);
    
    /// <summary>
    /// Return the total number of users in the system.
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns the total number of the users wrapped into <see cref="Response{TData, TStatus}"/></returns>
    Task<Response<long, GenericOperationStatuses>> GetUserCountAsync(
        CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Get roles assigned to a user.
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="cancellationToken">Cancellation Token</param>
    /// <returns>Returns a list of <see cref="UserRole"/> wrapped into <see cref="Response{TData, TStatus}"/></returns>
    Task<Response<IList<UserRole>, GenericOperationStatuses>> GetUserRolesAsync(
        string userId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Import exam takers in bulk and assign them an assignment.
    /// </summary>
    /// <param name="examTakers">A list of <see cref="ExamTakerImportDto"/></param>
    /// <param name="importedByUser">Imported by username</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Return a list of <see cref="User"/> wrapped into <see cref="Response{TStatus}"/></returns>
    Task<Response<IList<User>, GenericOperationStatuses>> ImportExamTakers(
        IList<ExamTakerImportDto> examTakers,
        string importedByUser,
        CancellationToken cancellationToken);

    /// <summary>
    /// Forget password process initiation.
    /// </summary>
    /// <param name="email">User's email address</param>
    /// <param name="url">Base URL</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns <see cref="GenericOperationStatuses"/> wrapped into <see cref="Response{TStatus}"/></returns>
    Task<Response<GenericOperationStatuses>> ForgetPasswordAsync(
        MailAddress email,
        string url,
        CancellationToken cancellationToken);
    
    /// <summary>
    /// Validate password reset token.
    /// </summary>
    /// <param name="email">User's email address</param>
    /// <param name="token">Security token</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns <see cref="GenericOperationStatuses"/> wrapped into <see cref="Response{TStatus}"/></returns>
    Task<Response<GenericOperationStatuses>> ValidateResetPasswordToken(
        MailAddress email,
        string token, 
        CancellationToken cancellationToken);
    
    /// <summary>
    /// Reset user password using the token sent to the user's email.
    /// </summary>
    /// <param name="email">User's email address</param>
    /// <param name="token">Security token</param>
    /// <param name="newPassword">New password</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns JWT token wrapped into <see cref="Response{TData, TStatus}"/></returns>
    Task<Response<string, GenericOperationStatuses>> ResetPasswordAsync(
        MailAddress email, 
        string token, 
        string newPassword, 
        CancellationToken cancellationToken);
}