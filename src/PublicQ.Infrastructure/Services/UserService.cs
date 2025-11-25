using System.Net.Mail;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using PublicQ.Application.Interfaces;
using PublicQ.Application.Models;
using PublicQ.Domain.Enums;
using PublicQ.Infrastructure.Options;
using PublicQ.Infrastructure.Persistence;
using PublicQ.Infrastructure.Persistence.Entities;
using PublicQ.Shared;

namespace PublicQ.Infrastructure.Services;

/// <summary>
/// User service implementation.
/// </summary>
/// <param name="userManager"></param>
/// <param name="logger"></param>
public class UserService(
    UserManager<ApplicationUser> userManager,
    ITokenService tokenService,
    ApplicationDbContext dbContext,
    IMessageService messageService,
    IAssignmentService assignmentService,
    IEmailSender<ApplicationUser> identityEmailSender,
    IOptionsMonitor<UserServiceOptions> userServiceOptions,
    IOptionsMonitor<PasswordPolicyOptions> passwordPolicyOptions,
    ILogger<UserService> logger) : IUserService
{
    /// <summary>
    /// Default user role for new users.
    /// </summary>
    private UserRole DefaultUserRole => UserRole.ExamTaker;
    
    /// <summary>
    /// Maximum attempts to generate a unique ID for exam taker.
    /// </summary>
    private const int IdGenerationMaxAttempts = 10;
    
    /// <summary>
    /// Key name for exam taker with no assignments.
    /// </summary>
    private const string ExamTakerWithNoAssignmentsKeyName = "empty";

    /// <summary>
    /// <see cref="IUserService.LoginUserAsync"/>
    /// </summary>
    public async Task<Response<string, GenericOperationStatuses>> LoginUserAsync(string userId, string password)
    {
        Guard.AgainstNull(userId, nameof(userId));
        Guard.AgainstNullOrWhiteSpace(password, nameof(password));

        var user = await userManager.FindByNameAsync(userId);

        if (user == null)
        {
            logger.LogDebug("User '{UserId}' not found", userId);
            return Response<string, GenericOperationStatuses>.Failure(
                GenericOperationStatuses.Unauthorized,
                "User or password is incorrect.");
        }

        var passwordCheckResult = await userManager.CheckPasswordAsync(user, password);

        if (!passwordCheckResult)
        {
            logger.LogInformation("Invalid password for user '{UserId}'", userId);
            return Response<string, GenericOperationStatuses>.Failure(
                GenericOperationStatuses.Unauthorized,
                "User or password is incorrect.");
        }

        var roles = await userManager.GetRolesAsync(user);

        var tokenResponse = tokenService.IssueToken(
            user.Id,
            user.Email!, 
            user.FullName, roles);

        if (tokenResponse.IsFailed)
        {
            logger.LogError("Token generation failed for user {UserId}: {Errors}", userId, tokenResponse.Errors);
            return Response<string, GenericOperationStatuses>.Failure(
                tokenResponse.Status,
                tokenResponse.Message,
                tokenResponse.Errors);
        }

        return Response<string, GenericOperationStatuses>
            .Success(tokenResponse.Data!, tokenResponse.Status, tokenResponse.Message);
    }

    /// <summary>
    /// <see cref="IUserService.SelfServiceUserRegistartionReturnTokenAsync"/>
    /// </summary>
    public async Task<Response<Token, GenericOperationStatuses>> SelfServiceUserRegistartionReturnTokenAsync(
        MailAddress email,
        string fullName,
        string password,
        DateTime? dateOfBirth,
        CancellationToken cancellationToken)
    {
        if (!userServiceOptions.CurrentValue.SelfServiceRegistrationEnabled)
        {
            return Response<Token, GenericOperationStatuses>.Success(
                null!,
                GenericOperationStatuses.NotAllowed,
                "Self-service registration is disabled.");
        }
        
        Guard.AgainstNull(email, nameof(email));
        Guard.AgainstNullOrWhiteSpace(password, nameof(password));
        Guard.AgainstNullOrWhiteSpace(fullName, nameof(fullName));

        var createdUser = await SelfServiceUserRegistrationAsync(
            email, 
            fullName, 
            password, 
            dateOfBirth,
            baseUrl: default, // Not needed as user registers themselves with a password
            cancellationToken);

        if (createdUser.IsFailed)
        {
            return Response<Token, GenericOperationStatuses>.Failure(
                createdUser.Status,
                createdUser.Message,
                createdUser.Errors);
        }
        
        // This should never be null here as we just created the user
        var user = await userManager.FindByEmailAsync(email.Address);
        
        var tokenResponse = tokenService.IssueToken(
                user!.Id,
                email.Address,
                user.FullName,
                [DefaultUserRole.ToString()]);

        if (tokenResponse.IsFailed)
        {
            logger.LogError("Token generation failed for {Username}: {Errors}", email, tokenResponse.Errors);
            return Response<Token, GenericOperationStatuses>.Failure(
                GenericOperationStatuses.Failed,
                "Token generation failed.",
                tokenResponse.Errors);
        }

        var token = new Token
        {
            AccessToken = tokenResponse.Data!
        };

        logger.LogInformation("User {Username} registered successfully", email);
        return Response<Token, GenericOperationStatuses>.Success(
            token,
            GenericOperationStatuses.Completed,
            $"User {email} registered successfully.");
    }

    /// <inheritdoc cref="IUserService.SelfServiceUserRegistrationAsync"/>
    public async Task<Response<GenericOperationStatuses>> SelfServiceUserRegistrationAsync(
        MailAddress email, 
        string fullName, 
        string? password,
        DateTime? dateOfBirth,
        string? baseUrl,
        CancellationToken cancellationToken)
    {
        logger.LogDebug("Request to register user received.");

        if (!userServiceOptions.CurrentValue.SelfServiceRegistrationEnabled)
        {
            return Response<GenericOperationStatuses>.Success(
                GenericOperationStatuses.NotAllowed,
                "Self-service registration is disabled.");
        }
        
        Guard.AgainstNull(email, nameof(email));
        Guard.AgainstNullOrWhiteSpace(fullName, nameof(fullName));
        
        return await RegisterIdentityUserAsync(
            email, 
            fullName, 
            password, 
            dateOfBirth, 
            baseUrl, 
            cancellationToken);
    }

    /// <inheritdoc cref="IUserService.RegisterIdentityUserByAdminAsync"/>
    public async Task<Response<GenericOperationStatuses>> RegisterIdentityUserByAdminAsync(
        MailAddress email, 
        string fullName, 
        string? password, 
        DateTime? dateOfBirth,
        string? baseUrl,
        CancellationToken cancellationToken)
    {
        Guard.AgainstNull(email, nameof(email));
        Guard.AgainstNullOrWhiteSpace(fullName, nameof(fullName));
        
        return await RegisterIdentityUserAsync(
            email, 
            fullName, 
            password, 
            dateOfBirth, 
            baseUrl,
            cancellationToken);
    }

    /// <summary>
    /// Registers a new identity user.
    /// </summary>
    /// <param name="email">Email</param>
    /// <param name="fullName">Full name</param>
    /// <param name="password">Optional: password</param>
    /// <param name="dateOfBirth">Optional: Date of birth</param>
    /// <param name="baseUrl">Optional: Base URL</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns <see cref="GenericOperationStatuses"/> wrapped into <see cref="Response{TStatus}"/></returns>
    async Task<Response<GenericOperationStatuses>> RegisterIdentityUserAsync(
        MailAddress email, 
        string fullName, 
        string? password, 
        DateTime? dateOfBirth,
        string? baseUrl, 
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(password) && string.IsNullOrWhiteSpace(baseUrl))
        {
            logger.LogDebug("Either password or createPasswordUrl must be provided.");
            return Response<GenericOperationStatuses>.Failure(
                GenericOperationStatuses.BadRequest,
                "Either password or createPasswordUrl must be provided.");
        }
        
        var emailAddressUpper = email.Address.ToUpper();

        var examTakerHasThisEmail = await dbContext.ExamTakers
            .AsNoTracking()
            .AnyAsync(e => e.NormalizedEmail == emailAddressUpper, cancellationToken);

        if (examTakerHasThisEmail)
        {
            logger.LogInformation("Cannot register user. An exam taker with email {Username} already exists.", 
                email);
            return Response<GenericOperationStatuses>.Failure(GenericOperationStatuses.Conflict,
                $"Cannot register user. An exam taker with email '{email}' already exists.");
        }
        
        var user = new ApplicationUser
        {
            Email = email.Address,
            FullName = fullName,
            UserName = emailAddressUpper,
            NormalizedEmail = emailAddressUpper,
            NormalizedUserName = emailAddressUpper,
            DateOfBirth = dateOfBirth,
            CreatedAtUtc = DateTime.UtcNow,
        };

        IdentityResult identityResult;
        if (!string.IsNullOrWhiteSpace(password))
        {
            var passwordValidationResponse = ValidatePassword(password);

            if (passwordValidationResponse.IsFailed)
            {
                var errors = string.Join(", ", passwordValidationResponse.Errors);
                logger.LogDebug("Password does not meet the security requirements. Errors: {Errors}", 
                    errors);
                return Response<GenericOperationStatuses>.Failure(
                    GenericOperationStatuses.BadRequest,
                    $"Password does not meet the security requirements. Validation errors: '{errors}'.");
            }
            
            identityResult = await userManager.CreateAsync(user, password);
        }
        else
        {
            identityResult = await userManager.CreateAsync(user);
        }
        
        if (!identityResult.Succeeded)
        {
            logger.LogError("User registration failed for {Username}: {Errors}", email, identityResult.Errors);
            var errors = identityResult.Errors
                .Select(e => e.Description)
                .ToList();

            return Response<GenericOperationStatuses>.Failure(
                GenericOperationStatuses.Failed,
                "User registration failed.",
                errors);
        }
        
        SendMessageRequest messageRequest;
        // If password is not provided, we skip sending the link
        if (string.IsNullOrWhiteSpace(password))
        {
            var createPasswordUrl = await GenerateResetLinkAsync(
                $"{baseUrl}/{Constants.FrontEndResetPasswordPath}", 
                user);
            messageRequest = new SendMessageRequest
            {
                TemplateId = Constants.DefaultWelcomeMessageWithCreatePasswordTemplateId,
                Recipients = [email.Address],
                Placeholders = new Dictionary<string, string>
                {
                    { "User", email.Address.Split("@")[0] },
                    { "BaseUrl", baseUrl! },
                    { "CreatePasswordUrl", createPasswordUrl }
                }
            };
        }
        else
        {
            messageRequest = new SendMessageRequest
            {
                TemplateId = Constants.DefaultWelcomeMessageTemplateId,
                Recipients = [email.Address],
                Placeholders = new Dictionary<string, string>
                {
                    { "User", email.Address.Split("@")[0] }
                }
            };
        }
        
        await NotifyUserAsync(email, messageRequest, cancellationToken);
        
        var assignDefaultRoleResult = await userManager.AddToRoleAsync(user, DefaultUserRole.ToString());
        if (!assignDefaultRoleResult.Succeeded)
        {
            logger.LogError(
                "User registration failed for {Username}: {Errors}.  User was created without default assigned role",
                email,
                assignDefaultRoleResult.Errors);

            return Response<GenericOperationStatuses>.Failure(
                GenericOperationStatuses.Failed,
                "Registration failed. User was created without default assigned role.",
                assignDefaultRoleResult.Errors.Select(e => e.Description).ToList());
        }
        
        return Response<GenericOperationStatuses>.Success(GenericOperationStatuses.Completed,
            $"User {email} registered successfully.");
    }

    /// <inheritdoc cref="IUserService.RegisterExamTakerAsync"/>
    public async Task<Response<User, GenericOperationStatuses>> RegisterExamTakerAsync(
        MailAddress? email,
        string? id,
        DateTime? dateOfBirth,
        string fullName,
        CancellationToken cancellationToken)
    {
        logger.LogDebug("Request to register exam taker received.");
        Guard.AgainstNullOrWhiteSpace(fullName, nameof(fullName));

        if (string.IsNullOrWhiteSpace(id))
        {
            string? generatedId = null;
            for (var attempt = 1; attempt <= IdGenerationMaxAttempts; attempt++)
            {
                var candidate = ExamTakerIdGenerator.Generate(); // ensure generator returns uppercase
                var exists = await CheckIfExamTakerExistsAsync(email, candidate, cancellationToken);
                if (!exists)
                {
                    generatedId = candidate;
                    break;
                }
            }

            if (generatedId is null)
            {
                logger.LogError("Unable to generate a unique ID for the exam taker after {MaxAttempts} attempts.",
                    IdGenerationMaxAttempts);
                return Response<User, GenericOperationStatuses>.Failure(
                    GenericOperationStatuses.Failed,
                    $"Unable to generate a unique ID for the exam taker after '{IdGenerationMaxAttempts}' attempts."); 
            }
            
            id = generatedId;
        }
        else
        {
            id = id.Trim().ToUpperInvariant();
            var examTakerExists = await CheckIfExamTakerExistsAsync(email, id, cancellationToken);
            if (examTakerExists)
            {
                logger.LogWarning("Exam taker already exists with given ID or Email");
                return Response<User, GenericOperationStatuses>.Failure(
                    GenericOperationStatuses.Conflict,
                    "Exam taker already exists with given ID or Email");
            }
        }
        
        if (email is not null)
        {
            var userWithThisEmail = await userManager.FindByEmailAsync(email.Address);
            if (userWithThisEmail != null)
            {
                logger.LogWarning("Cannot register exam taker. A user with email {Email} already exists.", 
                    email);
                return Response<User, GenericOperationStatuses>.Failure(GenericOperationStatuses.Conflict,
                    $"Cannot register exam taker. A user with email {email} already exists.");
            }
        }
        var examTaker = new ExamTakerEntity
        {
            Id = id,
            Email = email?.Address,
            NormalizedEmail = email?.Address.ToUpperInvariant(),
            FullName = fullName,
            DateOfBirth = dateOfBirth,
            CreatedAtUtc = DateTime.UtcNow
        };
        
        await dbContext.ExamTakers.AddAsync(examTaker, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
        
        logger.LogInformation("Exam taker registered successfully. ID: {Id}.", id);
        
        return Response<User, GenericOperationStatuses>.Success(
            examTaker.ConvertToUser(),
            GenericOperationStatuses.Completed,
            $"Exam taker registered successfully. ID: '{id}'.");
    }
    
    /// <summary>
    /// <see cref="IUserService.ResetIdentityUserPasswordByAdminAsync"/>
    /// </summary>
    public async Task<Response<GenericOperationStatuses>> ResetIdentityUserPasswordByAdminAsync(
        MailAddress email, 
        string password,
        CancellationToken cancellationToken)
    {
        logger.LogDebug("Request to reset password for exam taker received.");
        
        Guard.AgainstNullOrWhiteSpace(password, nameof(password));
        Guard.AgainstNull(email, nameof(email));
        
        var validatePasswordResponse = ValidatePassword(password);
        if (validatePasswordResponse.IsFailed)
        {
            return Response<GenericOperationStatuses>.Failure(
                GenericOperationStatuses.BadRequest,
                "Password does not meet the security requirements.",
                validatePasswordResponse.Errors);
        }

        var user = await userManager.FindByEmailAsync(email.Address);
        if (user == null)
        {
            logger.LogWarning("Unable to reset the password. User {Username} not found", email);
            return Response<GenericOperationStatuses>.Failure(
                GenericOperationStatuses.NotFound,
                $"Unable to reset the password.User {email.Address} not found.");
        }

        var token = await userManager.GeneratePasswordResetTokenAsync(user);
        var result = await userManager.ResetPasswordAsync(user, token, password);

        if (!result.Succeeded)
        {
            logger.LogWarning("Failed to reset password for {Username}: {Errors}",
                email.Address,
                result.Errors);
            return Response<GenericOperationStatuses>.Failure(
                GenericOperationStatuses.Failed,
                $"Failed to reset password for {email.Address}.",
                result.Errors.Select(e => e.Description).ToList());
        }

        logger.LogInformation("Password reset successfully for {Username}",
            email);

        var messageRequest = new SendMessageRequest
        {
            TemplateId = Constants.DefaultPasswordResetMessageTemplateId,
            Recipients = [email.Address],
            Placeholders = new Dictionary<string, string>
            {
                { "User", email.Address.Split("@")[0] },
                { "Password", password }
            }
        };
        
        // TODO: Consider removing password from the email notification for security reasons
        // and instead provide a link to set the password via a secure page.
        await NotifyUserAsync(email, messageRequest, cancellationToken);

        return Response<GenericOperationStatuses>.Success(
            GenericOperationStatuses.Completed,
            $"Password reset successfully for {email}.");
    }

    /// <summary>
    /// <see cref="IUserService"/>
    /// </summary>
    public async Task<Response<GenericOperationStatuses>> DeleteUserAsync(
        string userId,
        CancellationToken cancellation)
    {
        Guard.AgainstNullOrWhiteSpace(userId, nameof(userId));

        logger.LogInformation("Deleting user '{UserId}'", userId);
        var identityUser = await userManager.FindByIdAsync(userId);

        if (identityUser != null)
        {
            if (string.Equals(identityUser.Email, Constants.DefaultAdminEmail, StringComparison.InvariantCultureIgnoreCase))
            {
                logger.LogWarning(
                    "Attempt to delete the default admin user '{UserId}' not allowed. You cannot remove default admin account",
                    userId);
                return Response<GenericOperationStatuses>.Failure(GenericOperationStatuses.Failed,
                    $"You cannot remove the default admin account '{userId}'.");
            }
            
            var result = await userManager.DeleteAsync(identityUser);

            if (!result.Succeeded)
            {
                logger.LogWarning("Failed to delete user '{UserId}'. Errors: '{Errors}'", userId, result.Errors);
                return Response<GenericOperationStatuses>.Failure(GenericOperationStatuses.Failed,
                    $"Failed to delete user with ID '{userId}'.",
                    result.Errors.Select(e => e.Description).ToList());
            }

            logger.LogInformation("User '{UserId}' deleted successfully", userId);

            return Response<GenericOperationStatuses>.Success(GenericOperationStatuses.Completed,
                $"User with ID '{userId}' deleted successfully.");
        }
        
        var examTaker = await dbContext.ExamTakers
            .FirstOrDefaultAsync(e => e.Id == userId, cancellation);
        
        // If we reach here, identityUser and examTaker are both null
        if (examTaker == null)
        {
            logger.LogWarning("No user with {ID} ID found", userId);
            return Response<GenericOperationStatuses>.Failure(GenericOperationStatuses.NotFound,
                $"No user with '{userId}' ID found.");
        }
        
        dbContext.ExamTakers.Remove(examTaker);
        await dbContext.SaveChangesAsync(cancellation);
        
        logger.LogInformation("Exam taker with '{ID}' deleted successfully", userId);
        
        return Response<GenericOperationStatuses>.Success(GenericOperationStatuses.Completed,
            $"User with '{userId}' ID deleted successfully.");
    }

    /// <summary>
    /// <see cref="IUserService.AssignIdentityRoleAsync"/>
    /// </summary>
    public async Task<Response<GenericOperationStatuses>> AssignIdentityRoleAsync(
        string userId,
        UserRole roleName)
    {
        Guard.AgainstNullOrWhiteSpace(userId, nameof(userId));

        var user = await userManager.FindByIdAsync(userId);

        if (user == null)
        {
            logger.LogWarning(
                "Unable to assign role '{RoleName}' to user '{UserId}' Fetching user from database returned no result.",
                roleName,
                userId);

            return Response<GenericOperationStatuses>
                .Failure(GenericOperationStatuses.NotFound, $"User '{userId}' not found.");
        }

        if (await userManager.IsInRoleAsync(user, roleName.ToString()))
        {
            logger.LogInformation("User '{UserId}' already has the role '{RoleName}'.",
                userId,
                roleName);
            return Response<GenericOperationStatuses>.Failure(GenericOperationStatuses.Conflict,
                $"User '{userId}' already has the role '{roleName}'.");
        }

        var result = await userManager.AddToRoleAsync(user, roleName.ToString());

        if (!result.Succeeded)
        {
            logger.LogError("Failed to assign role '{RoleName}' to user '{UserId}': '{Errors}'",
                roleName,
                user,
                result.Errors);

            return Response<GenericOperationStatuses>.Failure(
                GenericOperationStatuses.Failed,
                $"Failed to assign role '{roleName}' to user '{userId}'.",
                result.Errors.Select(e => e.Description).ToList());
        }

        return Response<GenericOperationStatuses>
            .Success(GenericOperationStatuses.Completed,
                $"Role '{roleName}' assigned to user '{userId}' successfully.");
    }

    /// <summary>
    /// <see cref="IUserService.UnassignIdentityRoleAsync"/>
    /// </summary>
    public async Task<Response<GenericOperationStatuses>> UnassignIdentityRoleAsync(
        string userId,
        UserRole roleName)
    {
        Guard.AgainstNullOrWhiteSpace(userId, nameof(userId));

        var user = await userManager.FindByIdAsync(userId);
        if (user == null)
        {
            logger.LogWarning(
                "Unable to unassign role '{RoleName}' from user '{UserId}' Fetching user from database returned no result.",
                roleName,
                userId);

            return Response<GenericOperationStatuses>
                .Failure(GenericOperationStatuses.NotFound, $"User '{userId}' not found.");
        }

        if (!await userManager.IsInRoleAsync(user, roleName.ToString()))
        {
            logger.LogInformation("User '{UserId}' does not have the role '{RoleName}'.",
                userId,
                roleName);
            return Response<GenericOperationStatuses>.Failure(GenericOperationStatuses.Conflict,
                $"User '{userId}' does not have the role '{roleName}'.");
        }

        var result = await userManager.RemoveFromRoleAsync(user, roleName.ToString());

        if (!result.Succeeded)
        {
            logger.LogError("Failed to unassign role '{RoleName}' from user '{UserId}': '{Errors}'",
                roleName,
                userId,
                result.Errors);

            return Response<GenericOperationStatuses>.Failure(
                GenericOperationStatuses.Failed,
                $"Failed to unassign role '{roleName}' from user '{userId}'.",
                result.Errors.Select(e => e.Description).ToList());
        }

        return Response<GenericOperationStatuses>
            .Success(GenericOperationStatuses.Completed,
                $"Role '{roleName}' unassigned from user '{userId}' successfully.");
    }

    /// <summary>
    /// <see cref="IUserService.GetUsersAsync"/>
    /// </summary>
    public async Task<Response<PaginatedResponse<User>, GenericOperationStatuses>> GetUsersAsync(
        int pageNumber = 1,
        int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        // TODO: Move to a repository pattern
        if (pageNumber < 1)
        {
            logger.LogDebug("Page number is less than 1 in the request. Setting to 1.");
            pageNumber = 1;
        }

        pageSize = Math.Min(pageSize, userServiceOptions.CurrentValue.MaxPageSize);

        // Project both sets to a common shape and UNION ALL, then order & page once.
        var usersQ = dbContext.Users
            .Select(u => new
            {
                u.Id,
                u.Email,
                u.FullName,
                u.DateOfBirth,
                u.CreatedAtUtc,
                HasCredential = true
            });

        var examTakersQ = dbContext.ExamTakers
            .Select(e => new
            {
                e.Id,
                e.Email,
                e.FullName,
                e.DateOfBirth,
                e.CreatedAtUtc,
                HasCredential = false
            });

        var unifiedQ = usersQ.Concat(examTakersQ!);

        var totalCount = await unifiedQ.LongCountAsync(cancellationToken);

        var pageItems = await unifiedQ
            .OrderByDescending(x => x.CreatedAtUtc)
                .ThenBy(x => x.Email)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .AsNoTracking()
            .Select(x => new User
            {
                Id = x.Id,
                Email = x.Email!,
                FullName = x.FullName,
                DateOfBirth = x.DateOfBirth,
                HasCredential = x.HasCredential
            })
            .ToListAsync(cancellationToken);

        var page = new PaginatedResponse<User>
        {
            PageNumber = pageNumber,
            PageSize = pageSize,
            TotalCount = totalCount
        };
        page.Data.AddRange(pageItems);
        
        var message = pageItems.Count == 0 ? "No users found." : "Users retrieved successfully.";
        return Response<PaginatedResponse<User>, GenericOperationStatuses>.Success(
            page, 
            GenericOperationStatuses.Completed, 
            message);
    }

    /// <inheritdoc cref="IUserService.GetExamTakerByIdAsync"/>
    public async Task<Response<User, GenericOperationStatuses>> GetExamTakerByIdAsync(
        string id, 
        CancellationToken cancellationToken = default)
    {
        logger.LogDebug("Get exam taker by id request received.");
        Guard.AgainstNullOrWhiteSpace(id, nameof(id));
        
        var examTakerId = await dbContext
            .ExamTakers
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.Id == id.ToUpperInvariant(), cancellationToken);

        if (examTakerId == null)
        {
            logger.LogDebug("No exam taker found with ID '{Id}'", id);
            return Response<User, GenericOperationStatuses>.Failure(
                GenericOperationStatuses.NotFound,
                $"No exam taker found with ID '{id}'.");
        }
        
        var user = new User
        {
            Id = examTakerId.Id,
            Email = examTakerId.Email!,
            FullName = examTakerId.FullName,
            DateOfBirth = examTakerId.DateOfBirth,
            HasCredential = false
        };
        
        logger.LogDebug("Exam taker with ID '{Id}' retrieved successfully.", id);
        return Response<User, GenericOperationStatuses>.Success(
            user,
            GenericOperationStatuses.Completed,
            $"Exam taker with ID '{id}' retrieved successfully.");
    }

    /// <summary>
    /// <see cref="IUserService.GetUsersByFilter"/>
    /// </summary>
    /// TODO: Combine SearchUsersByEmailAsync and GetUsersAsync into a single method with optional email parameter
    /// TODO: Should we use Specification pattern here?
    public async Task<Response<PaginatedResponse<User>, GenericOperationStatuses>> GetUsersByFilter(
    string? email,
    string? id,
    int pageNumber = 1,
    int pageSize = 10,
    CancellationToken cancellationToken = default)
    {
        if (pageNumber < 1)
        {
            logger.LogWarning("Page number is less than 1 in the request. Setting to 1.");
            pageNumber = 1;
        }

        var maxPage = userServiceOptions.CurrentValue.MaxPageSize;
        pageSize = Math.Min(pageSize, maxPage);

        var emailIsEmpty = string.IsNullOrWhiteSpace(email);
        var idIsEmpty = string.IsNullOrWhiteSpace(id);

        var queryIdentityUsers = dbContext.Users
            .AsNoTracking();
        var queryExamTakers = dbContext.ExamTakers
            .AsNoTracking();
        
        if (!emailIsEmpty)
        {
            var norm = email!.ToUpperInvariant();
            // Optional literal match: var pattern = "%" + EscapeLike(norm) + "%";
            var pattern = $"%{norm.EscapeLike()}%";
            queryIdentityUsers = queryIdentityUsers.Where(u => EF.Functions.Like(u.NormalizedEmail, pattern));
            queryExamTakers = queryExamTakers.Where(e => EF.Functions.Like(e.NormalizedEmail, pattern));
        }

        if (!idIsEmpty)
        {
            // If Id is GUID, prefer equality or StartsWith on normalized string.
            var idPattern = $"%{id}%";
            queryIdentityUsers = queryIdentityUsers.Where(u => EF.Functions.Like(u.Id, idPattern));
            queryExamTakers = queryExamTakers.Where(u => EF.Functions.Like(u.Id, idPattern));
        }

        var totalIdentityUsersCount = await queryIdentityUsers.LongCountAsync(cancellationToken);
    
        var identityUsers = new List<User>();
        if (totalIdentityUsersCount > 0)
        {
            identityUsers = await queryIdentityUsers
                .OrderBy(u => u.Email)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(u => new User
                {
                    Id = u.Id,
                    Email = u.Email!,
                    FullName = u.FullName,
                    DateOfBirth = u.DateOfBirth,
                    HasCredential = true
                })
                .ToListAsync(cancellationToken);
        }
        

        var totalExamTakersCount = await queryExamTakers.LongCountAsync(cancellationToken);

        var examTakers = new List<User>();
        if (totalExamTakersCount > 0)
        {
            examTakers = await queryExamTakers
                .OrderBy(e => e.Email)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(e => new User
                {
                    Id = e.Id,
                    Email = e.Email,
                    FullName = e.FullName,
                    DateOfBirth = e.DateOfBirth,
                    HasCredential = false
                })
                .ToListAsync(cancellationToken);
        }
        
        var page = new PaginatedResponse<User>
        {
            PageNumber = pageNumber,
            PageSize = pageSize,
            TotalCount = totalIdentityUsersCount + totalExamTakersCount
        };
        
        page.Data.AddRange(identityUsers);
        page.Data.AddRange(examTakers);

        if (totalIdentityUsersCount == 0)
        {
            logger.LogDebug("No users found. Criteria: email='{Email}', id='{Id}'", email, id);
            return Response<PaginatedResponse<User>, GenericOperationStatuses>
                .Success(page, GenericOperationStatuses.Completed, "No users found.");
        }

        logger.LogDebug("Retrieved {Count}/{Total} users for email='{Email}', id='{Id}'",
            identityUsers.Count, totalIdentityUsersCount, email, id);

        return Response<PaginatedResponse<User>, GenericOperationStatuses>
            .Success(page, GenericOperationStatuses.Completed, "Users retrieved successfully.");
    }

    /// <inheritdoc cref="IUserService.GetUsersByIdAsync"/>
    public async Task<Response<IList<User>, GenericOperationStatuses>> GetUsersByIdAsync(
        HashSet<string> userIds, 
        CancellationToken cancellationToken)
    {
        logger.LogDebug("Get user by ID request received.");
        
        if (userIds.Any(string.IsNullOrWhiteSpace))
        {
            logger.LogDebug("One or more user IDs are empty.");
            return Response<IList<User>, GenericOperationStatuses>
                .Failure(GenericOperationStatuses.BadRequest, "One or more user IDs are empty.");
        }
        
        var identityUsers = await dbContext.Users
            .AsNoTracking()
            .Where(u => userIds.Contains(u.Id))
            .Select(u => new User
            {
                Id = u.Id,
                Email = u.Email!,
                FullName = u.FullName,
                DateOfBirth = u.DateOfBirth,
                HasCredential = true
            })
            .ToListAsync(cancellationToken);
        
        var examTakers = await dbContext.ExamTakers
            .AsNoTracking()
            .Where(e => userIds.Contains(e.Id))
            .Select(e => new User
            {
                Id = e.Id,
                Email = e.Email,
                FullName = e.FullName,
                DateOfBirth = e.DateOfBirth,
                HasCredential = false
            })
            .ToListAsync(cancellationToken);
        
        var totalUsers = identityUsers.Count + examTakers.Count;
        
        if (totalUsers == 0)
        {
            logger.LogInformation("No user with {UserId} ID is found in the database.", userIds);
            return Response<IList<User>, GenericOperationStatuses>.Failure(GenericOperationStatuses.NotFound,
                $"No user with {userIds} ID is found in the database.");
        }
        
        if (totalUsers != userIds.Count)
        {
            var foundUserIds = identityUsers.Select(u => u.Id).ToHashSet();
            var foundUserIdsStr = string.Join(", ", foundUserIds);
            var notFoundUserIdsStr = string.Join(", ", userIds.Except(foundUserIds));
            
            logger.LogWarning("Some users were not found. Requested IDs: {RequestedIds}, Found IDs: {FoundIds}, Not Found IDs: {NotFoundIds}",
                userIds, foundUserIdsStr, notFoundUserIdsStr);
            
            return Response<IList<User>, GenericOperationStatuses>.Success(identityUsers,GenericOperationStatuses.PartiallyCompleted,
                $"Some users were not found. Requested IDs: '{string.Join(", ", userIds)}', Found IDs: '{foundUserIdsStr}', Not Found IDs: '{notFoundUserIdsStr}'.");
        }
        
        var allUsers = identityUsers.Concat(examTakers).ToList();
        
        return Response<IList<User>, GenericOperationStatuses>.Success(allUsers,GenericOperationStatuses.Completed);
    }

    /// <inheritdoc cref="IUserService.GetUserCountAsync"/>>
    public async Task<Response<long, GenericOperationStatuses>> GetUserCountAsync(
        CancellationToken cancellationToken = default)
    {
        logger.LogDebug("Retrieving total user count from the database.");

        var identityUsers = await dbContext.Users
            .LongCountAsync(cancellationToken);
        var examTakers = await dbContext.ExamTakers
            .LongCountAsync(cancellationToken);
        
        var totalUsers = identityUsers + examTakers;
        
        logger.LogDebug("Retrieved total user count from the database: {Count}", totalUsers);

        return Response<long, GenericOperationStatuses>.Success(totalUsers, GenericOperationStatuses.Completed);
    }

    /// <inheritdoc cref="IUserService.GetUserRolesAsync"/>
    public async Task<Response<IList<UserRole>, GenericOperationStatuses>> GetUserRolesAsync(
        string userId, 
        CancellationToken cancellationToken = default)
    {
        Guard.AgainstNullOrWhiteSpace(userId, nameof(userId));
        logger.LogDebug("Retrieving user roles from the database.");
        
        var roles = await userManager.GetRolesAsync(new ApplicationUser { Id = userId });
        
        if (roles.Count == 0)
        {
            logger.LogDebug("No roles found for user with ID '{UserId}'", userId);
            return Response<IList<UserRole>, GenericOperationStatuses>.Failure(GenericOperationStatuses.NotFound,
                $"No roles found for user with ID '{userId}'.");
        }

        var parsedRoles = roles.Select(r =>
        {
            if (!Enum.TryParse<UserRole>(r, out var role))
            {
                // This should never happen if roles are managed correctly
                logger.LogError("Failed to parse role '{Role}' for user '{UserId}'", 
                    r, 
                    userId);
            }
            
            return role;
        }).ToList();
        
        logger.LogDebug("Retrieved roles from the database: {Roles}", parsedRoles);
        
        return Response<IList<UserRole>, GenericOperationStatuses>.Success(
            parsedRoles, 
            GenericOperationStatuses.Completed);
    }

    /// <inheritdoc cref="IUserService.ImportExamTakers"/>
    public async Task<Response<IList<User>, GenericOperationStatuses>> ImportExamTakers(
        IList<ExamTakerImportDto> examTakers,
        string importedByUser,
        CancellationToken cancellationToken)
    {
        logger.LogDebug("Import exam takers request received.");
        Guard.AgainstNull(examTakers, nameof(examTakers));
        
        var validationResponse = await ValidateExamTakerBeforeImportAsync(examTakers, cancellationToken);
        
        if (validationResponse.IsFailed)
        {
            return Response<IList<User>, GenericOperationStatuses>.Failure(
                GenericOperationStatuses.Conflict,
                validationResponse.Message,
                validationResponse.Errors);
        }
        
        logger.LogDebug("Creating new exam takers.");
        var errorMessages = new List<string>();

        var groupedUsersWithAssignments = new Dictionary<Guid, IList<User>>();
        var usersWithNoAssignment = new List<User>();
        
        foreach (var examTaker in examTakers)
        {
            var email = examTaker.Email is not null ? 
                new MailAddress(examTaker.Email) : 
                null;
            
            var userResponse = await RegisterExamTakerAsync(
                email,
                examTaker.Id,
                examTaker.DateOfBirth,
                examTaker.Name, 
                cancellationToken);

            if (userResponse.IsSuccess)
            {
                if (examTaker.AssignmentId.HasValue && 
                    groupedUsersWithAssignments.TryGetValue(examTaker.AssignmentId.Value, out var users))
                {
                    users.Add(userResponse.Data!);
                }
                else if (examTaker.AssignmentId.HasValue)
                {
                    groupedUsersWithAssignments[examTaker.AssignmentId.Value] = new List<User> { userResponse.Data! };
                }
                else
                {
                    usersWithNoAssignment.Add(userResponse.Data!);
                }
            }
            // We need to keep processing other users even if one fails
            // and report all errors at the end
            else
            {
                errorMessages.Add(userResponse.Message);
            }
        }

        foreach (var group in groupedUsersWithAssignments)
        {
            var userIds = group
                .Value
                .Select(u => u.Id)
                .ToHashSet();
            
            var assignExamTakersResult = await assignmentService.AddExamTakersAsync(
                group.Key, 
                userIds, 
                importedByUser, 
                cancellationToken);

            if (assignExamTakersResult.IsFailed)
            {
                errorMessages.Add($"Unable to assign exam takers to assignment '{group.Key}' ID. Errors:  {string.Join(",", assignExamTakersResult.Errors)}");
            }
        }

        // Combine all created users
        var createdUsers = groupedUsersWithAssignments.Select(g => g.Value)
            .SelectMany(u => u)
            .Concat(usersWithNoAssignment)
            .ToList();
        
        if (errorMessages.Count > 0)
        {
            var errorMessagesString = string.Join("; ", errorMessages);
            logger.LogWarning("Import exam takers completed with some errors. {ErrorMessages}", errorMessagesString);
            return Response<IList<User>, GenericOperationStatuses>.Success(
                createdUsers,
                GenericOperationStatuses.PartiallyCompleted,
                $"Import exam takers completed with some errors. Error messages: '{errorMessagesString}'");
        }
        
        return Response<IList<User>, GenericOperationStatuses>.Success(
            createdUsers,
            GenericOperationStatuses.Completed,
            "Import exam takers completed successfully.");
    }

    /// <inheritdoc cref="IUserService.ForgetPasswordAsync"/>
    public async Task<Response<GenericOperationStatuses>> ForgetPasswordAsync(
        MailAddress email,
        string url,
        CancellationToken cancellationToken)
    {
        logger.LogDebug("Forget password request received.");
        Guard.AgainstNull(email, nameof(email));
        
        var user = await userManager.FindByEmailAsync(email.Address);
        if (user == null)
        {
            logger.LogWarning("No user found with email '{Email}'", email);
            return Response<GenericOperationStatuses>.Failure(
                GenericOperationStatuses.NotFound,
                $"No user found with email '{email.Address}'.");
        }
        
        var resetLink = await GenerateResetLinkAsync(url, user);

        await identityEmailSender.SendPasswordResetLinkAsync(user, user.Email!, resetLink);
        
        return Response<GenericOperationStatuses>.Success(GenericOperationStatuses.Completed,
            $"Password reset link sent to '{email.Address}' if the user exists.");
    }

    /// <inheritdoc cref="IUserService.ValidateResetPasswordToken"/>
    public async Task<Response<GenericOperationStatuses>> ValidateResetPasswordToken(
        MailAddress email, 
        string token, 
        CancellationToken cancellationToken)
    {
        var user = await userManager.FindByEmailAsync(email.Address);
        if (user == null)
        {
            logger.LogInformation("Given Token is invalid. No user found with email '{Email}'", email);
            return Response<string, GenericOperationStatuses>.Failure(
                GenericOperationStatuses.Failed,
                $"Token is invalid try to request a new one.");
        }
        
        var isValid = await userManager.VerifyUserTokenAsync(
            user, 
            userManager.Options.Tokens.PasswordResetTokenProvider, 
            UserManager<ApplicationUser>.ResetPasswordTokenPurpose, 
            token);

        if (isValid)
        {
            logger.LogInformation("Given Token is valid for '{Email}'", email);
            return Response<GenericOperationStatuses>.Success(
                GenericOperationStatuses.Completed,
                "Token is valid.");
        }
        
        logger.LogInformation("Given Token is invalid for '{Email}'", email);
        return Response<GenericOperationStatuses>.Failure(
            GenericOperationStatuses.Failed,
            "Token is invalid try to request a new one.");
    }

    /// <inheritdoc cref="IUserService.ResetPasswordAsync"/>
    public async Task<Response<string, GenericOperationStatuses>> ResetPasswordAsync(
        MailAddress email, 
        string token, 
        string newPassword, 
        CancellationToken cancellationToken)
    {
        logger.LogDebug("Reset password request received.");
        Guard.AgainstNull(email, nameof(email));
        Guard.AgainstNullOrWhiteSpace(token, nameof(token));
        Guard.AgainstNullOrWhiteSpace(newPassword, nameof(newPassword));
        
        var validatePasswordResponse = ValidatePassword(newPassword);
        if (validatePasswordResponse.IsFailed)
        {
            return Response<string, GenericOperationStatuses>.Failure(
                GenericOperationStatuses.BadRequest,
                "Password does not meet the security requirements.",
                validatePasswordResponse.Errors);
        }
        
        var user = await userManager.FindByEmailAsync(email.Address);
        if (user == null)
        {
            logger.LogWarning("No user found with email '{Email}'", email);
            return Response<string, GenericOperationStatuses>.Failure(
                GenericOperationStatuses.NotFound,
                $"No user found with email '{email.Address}'.");
        }
        
        var result = await userManager.ResetPasswordAsync(user, token, newPassword);
        
        if (!result.Succeeded)
        {
            logger.LogWarning("Failed to reset password for '{Email}': {Errors}",
                email,
                result.Errors);
            return Response<string, GenericOperationStatuses>.Failure(
                GenericOperationStatuses.Failed,
                $"Failed to reset password for '{email.Address}'.",
                result.Errors.Select(e => e.Description).ToList());
        }
        
        logger.LogInformation("Password reset successfully for '{Email}'",
            email);
        
        var roles = await userManager.GetRolesAsync(user);

        // We do not check if token generation succeeded, as failure is unlikely here
        // and we want to let the user know that password reset was successful regardless.
        var tokenResponse = tokenService.IssueToken(
            user.Id,
            user.Email!, 
            user.FullName, roles);
        
        // Return success response with the new token or empty string if token generation failed
        return Response<string, GenericOperationStatuses>.Success(
            tokenResponse.Data ?? string.Empty,
            GenericOperationStatuses.Completed,
            $"Password reset successfully for '{email.Address}'.");
    }

    /// <summary>
    /// Validates exam takers before import. Checks for existing IDs or Emails and verifies assignments.
    /// </summary>
    /// <param name="examTakers">Arrays of <see cref="ExamTakerImportDto"/></param>
    /// <param name="cancellationToken">Cancellation Token</param>
    /// <returns>Returns <see cref="GenericOperationStatuses"/> wrapped into <see cref="Response{TStatus}"/></returns>
    private async Task<Response<GenericOperationStatuses>> ValidateExamTakerBeforeImportAsync(
        IList<ExamTakerImportDto> examTakers,
        CancellationToken cancellationToken)
    {
        logger.LogDebug("Checking for existing users with the same IDs or Emails.");

        if (examTakers.Count > userServiceOptions.CurrentValue.MaxImportSize)
        {
            logger.LogInformation("Max import size exceeded. Max: {MaxImportSize}, Provided: {ProvidedSize}",
                userServiceOptions.CurrentValue.MaxImportSize,
                examTakers.Count);
            return Response<GenericOperationStatuses>.Failure(
                GenericOperationStatuses.BadRequest,
                $"Max import size exceeded. Max: '{userServiceOptions.CurrentValue.MaxImportSize}', Provided: '{examTakers.Count}'");
        }
        
        // Extract IDs and emails for efficient querying
        var examTakerIds = examTakers.Select(e => e.Id).ToList();
        var examTakerIdsUppercase = examTakers.Select(e => e.Id.ToUpperInvariant()).ToList();
        var examTakerEmails = examTakers
            .Where(e => !string.IsNullOrWhiteSpace(e.Email))
            .Select(e => e.Email!)
            .ToList();
        
        var existingUsers = await dbContext
            .Users
            .AsNoTracking()
            .Where(u => examTakerIds.Contains(u.Id)
                || (u.Email != null && examTakerEmails.Contains(u.Email)))
            .ToListAsync(cancellationToken);
            
        var existingExamTakersInDb = await dbContext.ExamTakers
            .Where(e => examTakerIdsUppercase.Contains(e.Id)
                || (e.Email != null && examTakerEmails.Contains(e.Email)))
            .ToListAsync(cancellationToken);
        
        var errorMessages = new List<string>();
        if (existingUsers.Count > 0 || existingExamTakersInDb.Count > 0)
        {
            var existingIds = existingUsers.Select(u => u.Id)
                .Concat(existingExamTakersInDb.Select(e => e.Id))
                .Distinct()
                .ToList();
            var existingEmails = existingUsers.Select(u => u.Email)
                .Concat(existingExamTakersInDb.Select(e => e.Email))
                .Where(e => e != null)
                .Distinct(StringComparer.InvariantCultureIgnoreCase)
                .ToList();
            
            if (existingIds.Count > 0)
            {
                errorMessages.Add($"The following IDs already exist: {string.Join(", ", existingIds)}");
            }
            if (existingEmails.Count > 0)
            {
                errorMessages.Add($"The following Emails already exist: {string.Join(", ", existingEmails)}");
            }
            
            var errorMessage = string.Join("; ", errorMessages);
            logger.LogWarning("Import exam takers failed due to existing IDs or Emails. {ErrorMessage}", errorMessage);
            
            return Response<IList<User>, GenericOperationStatuses>.Failure(
                GenericOperationStatuses.Conflict,
                "Import exam takers failed due to existing IDs or Emails.",
                errorMessages);
        }
        logger.LogDebug("ID and Email verification completed.");

        logger.LogDebug("Checking for assignments linked to the exam takers.");
        var assignmentIds = examTakers
            .Where(e => e.AssignmentId != null)
            .Select(e => e.AssignmentId!.Value)
            .Distinct()
            .ToList();

        if (assignmentIds.Count > 0)
        {
            var existingAssignments = await dbContext.Assignments
                .AsNoTracking()
                .Where(a => assignmentIds.Contains(a.Id))
                .ToListAsync(cancellationToken);

            if (existingAssignments.Count != assignmentIds.Count)
            {
                var missingAssignmentIds = assignmentIds
                    .Except(existingAssignments.Select(a => a.Id))
                    .ToList();
                
                logger.LogWarning("Import exam takers failed due to missing assignments. Missing Assignment IDs: {MissingAssignmentIds}",
                    string.Join(", ", missingAssignmentIds));
                
                errorMessages.Add($"The following Assignment IDs do not exist: {string.Join(", ", missingAssignmentIds)}");
            }
        }

        logger.LogDebug("Assignment verification completed.");
        
        if (errorMessages.Count > 0)
        {
            return Response<IList<User>, GenericOperationStatuses>.Failure(
                GenericOperationStatuses.Failed,
                "Import exam takers failed due to validation issues, check errors for more details.",
                errorMessages);
        }
        
        return Response<GenericOperationStatuses>.Success(
            GenericOperationStatuses.Completed,
            "Validation completed successfully.");
    }
    
    /// <summary>
    /// Notifies the user via email with a message request.
    /// </summary>
    /// <param name="email">User email</param>
    /// <param name="messageRequest"><see cref="SendMessageRequest"/></param>
    /// <param name="cancellationToken">Cancellation token</param>
    private async Task NotifyUserAsync(
        MailAddress email,
        SendMessageRequest messageRequest,
        CancellationToken cancellationToken)
    {
        var messageSendResponse = await messageService.SendAsync(messageRequest, cancellationToken);
        if (messageSendResponse.IsFailed)
        {
            logger.LogWarning("Failed to send message to {Username}: {Errors}",
                email,
                messageSendResponse.Errors);
        }
        else if (messageSendResponse.Status == GenericOperationStatuses.FeatureIsNotAvailable)
        {
            logger.LogDebug("Message send feature is not available. Skipping sending message to {Username}",
                email);
        }
    }
    
    /// <summary>
    /// Validates the password against the defined security policies.
    /// </summary>
    /// <param name="password">Password to check</param>
    private Response<GenericOperationStatuses> ValidatePassword(string password)
    {
        var errors = new List<string>();
        
        if (password.Length < passwordPolicyOptions.CurrentValue.RequiredLength)
        {
            errors.Add($"Password must be at least {passwordPolicyOptions.CurrentValue.RequiredLength} characters long");
        }
        
        if (passwordPolicyOptions.CurrentValue.RequireDigit && !password.Any(char.IsDigit))
        {
            errors.Add("Password must contain at least one digit");
        }
        
        if (passwordPolicyOptions.CurrentValue.RequireLowercase && !password.Any(char.IsLower))
        {
            errors.Add("Password must contain at least one lowercase letter");
        }
        
        if (passwordPolicyOptions.CurrentValue.RequireUppercase && !password.Any(char.IsUpper))
        {
            errors.Add("Password must contain at least one uppercase letter");
        }
        
        if (passwordPolicyOptions.CurrentValue.RequireNonAlphanumeric && password.All(char.IsLetterOrDigit))
        {
            errors.Add("Password must contain at least one non-alphanumeric character");
        }
        
        if (errors.Count > 0)
        {
            return Response<GenericOperationStatuses>.Failure(
                GenericOperationStatuses.Failed,
                "Password does not meet the security requirements.",
                errors);
        }
        
        return Response<GenericOperationStatuses>.Success(
            GenericOperationStatuses.Completed,
            "Password meets the security requirements.");
    }
    
    /// <summary>
    /// Returns true if an exam taker with the given email or ID already exists.
    /// </summary>
    /// <param name="email">Optional: Email address</param>
    /// <param name="id">User ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    private async Task<bool> CheckIfExamTakerExistsAsync(
        MailAddress? email, 
        string id, 
        CancellationToken cancellationToken)
    {
        var hasEmail = email is not null;
        
        return await dbContext.ExamTakers
            .AsNoTracking()
            .AnyAsync(e => (hasEmail && e.NormalizedEmail == email!.Address.ToUpperInvariant()) 
                             || e.Id == id.ToUpperInvariant(), cancellationToken);
    }
    
    /// <summary>
    /// Generates a password reset link for the user.
    /// </summary>
    /// <param name="url">Base URL</param>
    /// <param name="user"><see cref="ApplicationUser"/></param>
    /// <returns>Returns a link to reset password</returns>
    private async Task<string> GenerateResetLinkAsync(string url, ApplicationUser user)
    {
        var token = await userManager.GeneratePasswordResetTokenAsync(user);
        var encodedToken = Uri.EscapeDataString(token);
        var encodedEmail = Uri.EscapeDataString(user.Email!);
        
        var resetLink = $"{url}?email={encodedEmail}&token={encodedToken}";
        return resetLink;
    }
}
