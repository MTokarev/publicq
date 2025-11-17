using System.Net.Mail;
using System.Reflection.Metadata;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PublicQ.API.Helpers;
using PublicQ.API.Models.Requests;
using PublicQ.API.Models.Validators;
using PublicQ.Application.Interfaces;
using PublicQ.Application.Models;
using PublicQ.Domain.Enums;
using PublicQ.Shared;

namespace PublicQ.API.Controllers;

/// <summary>
/// Provides endpoints to authenticate users, manage user accounts, roles, and search/list users.
/// </summary>
/// <remarks>
/// Base route: <c>api/user</c>.
/// All endpoints return a standardized <see cref="Response{TData, TStatus}"/> converted to an <see cref="IActionResult"/>.
/// </remarks>
[ApiController]
[Route($"{Constants.ControllerRoutePrefix}/[controller]")]
public class UsersController(IUserService userService) : ControllerBase
{
    /// <summary>
    /// Authenticates a user and issues an access token.
    /// </summary>
    /// <param name="userToLogin">The login request containing the user's email and password.</param>
    [HttpPost("login")]
    public async Task<IActionResult> LoginAsync(
        [FromBody] UserOperationRequest userToLogin)
    {
        if (string.IsNullOrWhiteSpace(userToLogin.Email)
            || string.IsNullOrWhiteSpace(userToLogin.Password))
        {
            return Response<string, GenericOperationStatuses>
                .Failure(GenericOperationStatuses.BadRequest,
                    "Invalid login request. Please provide email and password.")
                .ToActionResult();
        }

        var loginUserResponse = await userService.LoginUserAsync(
            userToLogin.Email,
            userToLogin.Password);

        return loginUserResponse.ToActionResult();
    }

    /// <summary>
    /// Gets the roles assigned to a specific user.
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns array of <see cref="UserRole"/> wrapped into <see cref="Response{TData, TStatus}"/></returns>
    [Authorize(Constants.ManagersPolicy)]
    [HttpGet("{userId}/roles")]
    public async Task<IActionResult> GetUserRolesAsync(
        [FromRoute] string userId,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Response<string, GenericOperationStatuses>
                .Failure(GenericOperationStatuses.BadRequest, "UserId is required.")
                .ToActionResult();
        }

        var result = await userService.GetUserRolesAsync(userId, cancellationToken);

        return result.ToActionResult();
    }

    /// <summary>
    /// Assigns a role to the specified user.
    /// </summary>
    /// <param name="request">The role assignment request containing the user identifier (email) and role.</param>
    /// <param name="userRolesValidator">Validator for <see cref="UserAssignRoleRequest"/>.</param>
    /// <param name="cancellationToken">A token to cancel the operation.</param>
    [Authorize(Constants.ManagersPolicy)]
    [HttpPost("roles")]
    public async Task<IActionResult> AssignRoleAsync(
        [FromBody] UserAssignRoleRequest request,
        [FromServices] IValidator<UserAssignRoleRequest> userRolesValidator,
        CancellationToken cancellationToken)
    {
        var validationResult = await userRolesValidator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return Response<string, GenericOperationStatuses>.Failure(GenericOperationStatuses.BadRequest,
                    "Validation failed",
                    validationResult.Errors.Select(e => e.ErrorMessage).ToList())
                .ToActionResult();
        }

        if (request.Role == UserRole.Administrator && !User.IsInRole(nameof(UserRole.Administrator)))
        {
            return Response<string, GenericOperationStatuses>.Failure(
                    GenericOperationStatuses.Forbidden,
                    "You do not have permission to assign the Administrator role.")
                .ToActionResult();
        }

        var result = await userService.AssignIdentityRoleAsync(
            request.UserId,
            request.Role);

        return result.ToActionResult();
    }

    /// <summary>
    /// Removes a role from the specified user.
    /// </summary>
    /// <param name="request">The role unassignment request containing the user identifier (email) and role.</param>
    /// <param name="userRolesValidator">Validator for <see cref="UserAssignRoleRequest"/>.</param>
    [Authorize(Constants.ManagersPolicy)]
    [HttpDelete("roles")]
    public async Task<IActionResult> UnassignRoleAsync(
        [FromBody] UserAssignRoleRequest request,
        [FromServices] IValidator<UserAssignRoleRequest> userRolesValidator)
    {
        var validationResult = await userRolesValidator.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            return Response<string, GenericOperationStatuses>.Failure(GenericOperationStatuses.BadRequest,
                    "Validation failed",
                    validationResult.Errors.Select(e => e.ErrorMessage).ToList())
                .ToActionResult();
        }

        if (request.Role == UserRole.Administrator && !User.IsInRole(nameof(UserRole.Administrator)))
        {
            return Response<string, GenericOperationStatuses>.Failure(
                    GenericOperationStatuses.Forbidden,
                    "You do not have permission to unassign the Administrator role.")
                .ToActionResult();
        }

        var result = await userService.UnassignIdentityRoleAsync(
            request.UserId,
            request.Role);

        return result.ToActionResult();
    }

    /// <summary>
    /// Registers a new user account and returns an access token.
    /// </summary>
    /// <param name="dto">The registration request containing email and password.</param>
    /// <param name="validator">Validator for <see cref="UserOperationRequest"/>.</param>
    /// <param name="cancellationToken">A token to cancel the operation.</param>
    [HttpPost("register")]
    public async Task<IActionResult> RegisterIdentityUserAsync(
        [FromBody] UserRegisterRequest dto,
        [FromServices] IValidator<UserRegisterRequest> validator,
        CancellationToken cancellationToken)
    {
        var validationResult = await validator.ValidateAsync(dto, cancellationToken);
        if (!validationResult.IsValid)
        {
            return Response<string, GenericOperationStatuses>.Failure(GenericOperationStatuses.BadRequest,
                    "Validation failed",
                    validationResult.Errors.Select(e => e.ErrorMessage).ToList())
                .ToActionResult();
        }

        var result = await userService.SelfServiceUserRegistartionReturnTokenAsync(
            new MailAddress(dto.Email),
            dto.FullName,
            dto.Password,
            dto.DateOfBirth,
            cancellationToken);

        return result.ToActionResult();
    }

    /// <summary>
    /// Registers a new user account by admin.
    /// </summary>
    /// <param name="dto">The registration request containing email and password.</param>
    /// <param name="validator">Validator for <see cref="UserOperationRequest"/>.</param>
    /// <param name="cancellationToken">A token to cancel the operation.</param>
    [Authorize(Constants.ManagersPolicy)]
    [HttpPost("register-by-admin")]
    public async Task<IActionResult> RegisterIdentityUserByAdminAsync(
        [FromBody] UserRegisterByAdminRequest dto,
        [FromServices] IValidator<UserRegisterByAdminRequest> validator,
        CancellationToken cancellationToken)
    {
        var validationResult = await validator.ValidateAsync(dto, cancellationToken);
        if (!validationResult.IsValid)
        {
            return Response<string, GenericOperationStatuses>.Failure(GenericOperationStatuses.BadRequest,
                    "Validation failed",
                    validationResult.Errors.Select(e => e.ErrorMessage).ToList())
                .ToActionResult();
        }
        
        var url = $"{Request.Scheme}://{Request.Host}";
        var result = await userService.RegisterIdentityUserByAdminAsync(
            new MailAddress(dto.Email),
            dto.FullName,
            dto.Password,
            dto.DateOfBirth,
            url,
            cancellationToken);

        return result.ToActionResult();
    }

    /// <summary>
    /// Registers a new exam taker (user without credentials).
    /// </summary>
    /// <param name="dto"><see cref="ExamTakerRegisterRequest"/></param>
    /// <param name="validator">Validator <see cref="ExamTakerRegisterRequestValidator"/></param>
    /// <param name="cancellationToken">Cancellation token</param>
    [Authorize(Constants.ManagersPolicy)]
    [HttpPost("exam-taker/register-by-admin")]
    public async Task<IActionResult> RegisterExamTakerAsync(
        [FromBody] ExamTakerRegisterRequest dto,
        [FromServices] IValidator<ExamTakerRegisterRequest> validator,
        CancellationToken cancellationToken)
    {
        var validationResult = await validator.ValidateAsync(dto, cancellationToken);
        if (!validationResult.IsValid)
        {
            return Response<string, GenericOperationStatuses>.Failure(GenericOperationStatuses.BadRequest,
                    "Validation failed",
                    validationResult.Errors.Select(e => e.ErrorMessage).ToList())
                .ToActionResult();
        }

        // Email is optional for exam takers
        var mailAddress = string.IsNullOrEmpty(dto.Email) ? null : new MailAddress(dto.Email);

        var result = await userService.RegisterExamTakerAsync(
            mailAddress,
            dto.Id,
            dto.DateOfBirth,
            dto.FullName,
            cancellationToken);

        return result.ToActionResult();
    }

    /// <summary>
    /// Imports multiple exam takers from a list.
    /// </summary>
    /// <param name="request">Array of <see cref="ExamTakerImportDto"/></param>
    /// <param name="validator">Validator <see cref="ExamTakerImportValidator"/></param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns array of created <see cref="User"/> wrapped into <see cref="Response{TData, TStatus}"/></returns>
    [Authorize(Constants.ManagersPolicy)]
    [HttpPost("exam-taker/import")]
    public async Task<IActionResult> ImportExamTakersAsync(
        [FromBody] IList<ExamTakerImportDto> request,
        [FromServices] IValidator<IList<ExamTakerImportDto>> validator,
        CancellationToken cancellationToken)
    {
        var validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return Response<string, GenericOperationStatuses>.Failure(
                    GenericOperationStatuses.BadRequest,
                    "Validation failed",
                    validationResult.Errors.Select(e => e.ErrorMessage).ToList())
                .ToActionResult();
        }

        var fullName = UserClaimParser.GetUserDisplayName(User.Claims);
        var result = await userService.ImportExamTakers(
            request,
            fullName,
            cancellationToken);

        return result.ToActionResult();
    }

    /// <summary>
    /// Deletes an existing user account.
    /// </summary>
    /// <param name="userId">User unique ID</param>
    /// <param name="cancellationToken">A token to cancel the operation.</param>
    [Authorize(Constants.ManagersPolicy)]
    [HttpDelete("{userId}")]
    public async Task<IActionResult> DeleteUserAsync(
        string userId,
        CancellationToken cancellationToken)
    {
        if (!User.IsInRole(nameof(UserRole.Administrator)))
        {
            var targetUserRoles = await userService.GetUserRolesAsync(userId, cancellationToken);
            
            if (targetUserRoles.IsSuccess &&
                targetUserRoles.Data!.Contains(UserRole.Administrator))
            {
                return Response<string, GenericOperationStatuses>.Failure(
                        GenericOperationStatuses.Forbidden,
                        "You do not have permission to delete an Administrator user.")
                    .ToActionResult();
            }
        }
        
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Response<string, GenericOperationStatuses>.Failure(
                    GenericOperationStatuses.BadRequest,
                    "UserId is required.")
                .ToActionResult();
        }

        var result = await userService.DeleteUserAsync(userId, cancellationToken);

        return result.ToActionResult();
    }

    /// <summary>
    /// Gets an exam taker by its unique identifier.
    /// </summary>
    /// <param name="id">Exam taker ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns <see cref="User"/> wrapped into <see cref="Response{TData, TStatus}"/></returns>
    [HttpGet("exam-taker/{id}")]
    public async Task<IActionResult> GetExamTakerByIdAsync(
        [FromRoute] string id,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(id))
        {
            return Response<User, GenericOperationStatuses>.Failure(
                    GenericOperationStatuses.BadRequest,
                    "Id cannot be empty.")
                .ToActionResult();
        }

        var result = await userService.GetExamTakerByIdAsync(id, cancellationToken);

        return result.ToActionResult();
    }

    /// <summary>
    /// Retrieves a paginated list of users.
    /// </summary>
    /// <param name="request">Pagination parameters including page number and page size.</param>
    /// <param name="validator">Validator <seealso cref="GetPaginatedEntitiesRequestValidator"/></param>
    /// <param name="cancellationToken">A token to cancel the operation.</param>
    [Authorize(Constants.ManagersPolicy)]
    [HttpGet]
    public async Task<IActionResult> GetUsersAsync(
        [FromQuery] GetPaginatedEntitiesRequest request,
        [FromServices] IValidator<GetPaginatedEntitiesRequest> validator,
        CancellationToken cancellationToken)
    {
        var validationResult = await validator.ValidateAsync(request, cancellationToken);

        if (!validationResult.IsValid)
        {
            return Response<GetPaginatedEntitiesRequest, GenericOperationStatuses>.Failure(
                    GenericOperationStatuses.BadRequest,
                    "Validation failed",
                    validationResult.Errors.Select(e => e.ErrorMessage).ToList())
                .ToActionResult();
        }

        var result = await userService.GetUsersAsync(
            request.PageNumber,
            request.PageSize,
            cancellationToken);

        return result.ToActionResult();
    }

    /// <summary>
    /// Searches users by email (partial match) and returns a paginated result.
    /// </summary>
    /// <param name="request">The search request including partial email, page number, and page size.</param>
    /// <param name="cancellationToken">A token to cancel the operation.</param>
    [Authorize(Constants.ManagersPolicy)]
    [HttpGet("search")]
    public async Task<IActionResult> SearchUsersAsync(
        [FromQuery] SearchUserRequest request,
        CancellationToken cancellationToken)
    {
        var result = await userService.GetUsersByFilter(
            request.EmailPart,
            request.IdPart,
            request.PageNumber,
            request.PageSize,
            cancellationToken);

        return result.ToActionResult();
    }

    /// <summary>
    /// Resets a user's password.
    /// </summary>
    /// <param name="request">The password reset request containing the user's email and the new password.</param>
    /// <param name="validator">Validator for <see cref="UserPasswordResetRequest"/>.</param>
    /// <param name="cancellationToken">A token to cancel the operation.</param>
    [Authorize(Constants.AdminsPolicy)]
    [HttpPatch("reset-password-by-admin")]
    public async Task<IActionResult> ResetUserPassword(
        [FromBody] UserPasswordResetRequest request,
        [FromServices] IValidator<UserPasswordResetRequest> validator,
        CancellationToken cancellationToken)
    {
        var validationResult = await validator.ValidateAsync(request, cancellationToken);

        if (!validationResult.IsValid)
        {
            return Response<string, GenericOperationStatuses>.Failure(GenericOperationStatuses.BadRequest,
                    "Validation failed",
                    validationResult.Errors.Select(e => e.ErrorMessage).ToList())
                .ToActionResult();
        }

        var email = new MailAddress(request.Email);
        var result = await userService.ResetIdentityUserPasswordByAdminAsync(
            email,
            request.Password,
            cancellationToken);

        return result.ToActionResult();
    }

    /// <summary>
    /// Retrieves the total count of registered users.
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    [Authorize]
    [HttpGet("total")]
    public async Task<IActionResult> GetUsersCountAsync(CancellationToken cancellationToken)
    {
        var result = await userService.GetUserCountAsync(cancellationToken);

        return result.ToActionResult();
    }

    /// <summary>
    /// Forget password process initiation.
    /// </summary>
    /// <param name="request"><see cref="ForgetPasswordRequest"/></param>
    /// <param name="validator"><see cref="ForgetPasswordRequestValidator"/></param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>This endpoint should always return success if user exists.</returns>
    [HttpPost("password/forget")]
    public async Task<IActionResult> ForgetPasswordAsync(
        [FromBody] ForgetPasswordRequest request,
        [FromServices] IValidator<ForgetPasswordRequest> validator,
        CancellationToken cancellationToken)
    {
        var validationResult = await validator.ValidateAsync(request, cancellationToken);
        
        if (!validationResult.IsValid)
        {
            return Response<string, GenericOperationStatuses>.Failure(
                    GenericOperationStatuses.BadRequest,
                    "Validation failed",
                    validationResult.Errors.Select(e => e.ErrorMessage).ToList())
                .ToActionResult();
        }
        
        var mailAddress = new MailAddress(request.EmailAddress);
        
        var url = $"{Request.Scheme}://{Request.Host}/{Constants.FrontEndResetPasswordPath}";
        await userService.ForgetPasswordAsync(mailAddress, url, cancellationToken);

        return Response<GenericOperationStatuses>.Success(
            GenericOperationStatuses.Completed,
            "If the email is registered, a password reset link has been sent.")
            .ToActionResult();
    }

    /// <summary>
    /// Checks if the provided password reset token is valid.
    /// </summary>
    /// <param name="request"><see cref="CheckPasswordTokenRequest"/></param>
    /// <param name="validator"><see cref="CheckPasswordTokenRequestValidator"/></param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns <see cref="GenericOperationStatuses"/> wrapped into <see cref="Response{TStatus}"/>
    /// If the token is valid, returns <see cref="GenericOperationStatuses.Completed"/>, otherwise <see cref="GenericOperationStatuses.Failed"/>.
    /// </returns>
    [HttpPost("password/reset/token/validate")]
    public async Task<IActionResult> ValidatePasswordResetTokenAsync(
        [FromBody] CheckPasswordTokenRequest request,
        [FromServices] IValidator<CheckPasswordTokenRequest> validator,
        CancellationToken cancellationToken)
    {
        var validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return Response<string, GenericOperationStatuses>.Failure(GenericOperationStatuses.BadRequest,
                    "Validation failed",
                    validationResult.Errors.Select(e => e.ErrorMessage).ToList())
                .ToActionResult();
        }

        var mailAddress = new MailAddress(request.Email);
        var result = await userService.ValidateResetPasswordToken(
            mailAddress,
            request.Token,
            cancellationToken);
        
        return result.ToActionResult();
    }

    /// <summary>
    /// Password reset using the token sent to the user's email.
    /// </summary>
    /// <param name="request"><see cref="ResetPasswordRequest"/></param>
    /// <param name="validator"><see cref="ResetPasswordRequestValidator"/></param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns a JWT token wrapped into <see cref="Response{TData, TStatus}"/></returns>
    [HttpPost("password/reset")]
    public async Task<IActionResult> ResetPasswordAsync(
        [FromBody] ResetPasswordRequest request,
        [FromServices] IValidator<ResetPasswordRequest> validator,
        CancellationToken cancellationToken)
    {
        var validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return Response<string, GenericOperationStatuses>.Failure(GenericOperationStatuses.BadRequest,
                    "Validation failed",
                    validationResult.Errors.Select(e => e.ErrorMessage).ToList())
                .ToActionResult();
        }

        var mailAddress = new MailAddress(request.Email);
        var result = await userService.ResetPasswordAsync(
            mailAddress,
            request.Token,
            request.NewPassword,
            cancellationToken);
        
        return result.ToActionResult();
    }
}