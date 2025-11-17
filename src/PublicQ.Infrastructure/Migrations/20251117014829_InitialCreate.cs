using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace PublicQ.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AspNetRoles",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 256, nullable: true),
                    NormalizedName = table.Column<string>(type: "TEXT", maxLength: 256, nullable: true),
                    ConcurrencyStamp = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetRoles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUsers",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    FullName = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false),
                    DateOfBirth = table.Column<DateTime>(type: "TEXT", nullable: true),
                    UserName = table.Column<string>(type: "TEXT", maxLength: 256, nullable: true),
                    NormalizedUserName = table.Column<string>(type: "TEXT", maxLength: 256, nullable: true),
                    Email = table.Column<string>(type: "TEXT", maxLength: 256, nullable: true),
                    NormalizedEmail = table.Column<string>(type: "TEXT", maxLength: 256, nullable: true),
                    EmailConfirmed = table.Column<bool>(type: "INTEGER", nullable: false),
                    PasswordHash = table.Column<string>(type: "TEXT", nullable: true),
                    SecurityStamp = table.Column<string>(type: "TEXT", nullable: true),
                    ConcurrencyStamp = table.Column<string>(type: "TEXT", nullable: true),
                    PhoneNumber = table.Column<string>(type: "TEXT", nullable: true),
                    PhoneNumberConfirmed = table.Column<bool>(type: "INTEGER", nullable: false),
                    TwoFactorEnabled = table.Column<bool>(type: "INTEGER", nullable: false),
                    LockoutEnd = table.Column<DateTimeOffset>(type: "TEXT", nullable: true),
                    LockoutEnabled = table.Column<bool>(type: "INTEGER", nullable: false),
                    AccessFailedCount = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUsers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AssessmentModules",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    CreatedByUser = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AssessmentModules", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Banners",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Type = table.Column<int>(type: "INTEGER", nullable: false),
                    Title = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    Content = table.Column<string>(type: "TEXT", maxLength: 5000, nullable: false),
                    ShowToAuthenticatedUsersOnly = table.Column<bool>(type: "INTEGER", nullable: false),
                    IsDismissible = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedByUser = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    UpdatedByUser = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    StartDateUtc = table.Column<DateTime>(type: "TEXT", nullable: false),
                    EndDateUtc = table.Column<DateTime>(type: "TEXT", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Banners", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ExamTakers",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    Email = table.Column<string>(type: "TEXT", maxLength: 254, nullable: true),
                    DateOfBirth = table.Column<DateTime>(type: "TEXT", nullable: true),
                    NormalizedEmail = table.Column<string>(type: "TEXT", maxLength: 254, nullable: true),
                    FullName = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExamTakers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Groups",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Title = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    NormalizedTitle = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 5000, nullable: false),
                    WaitModuleCompletion = table.Column<bool>(type: "INTEGER", nullable: false),
                    IsMemberOrderLocked = table.Column<bool>(type: "INTEGER", nullable: false),
                    UpdatedByUserId = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedByUser = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Groups", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "LogEntries",
                columns: table => new
                {
                    Id = table.Column<long>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Timestamp = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Level = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    Category = table.Column<string>(type: "TEXT", maxLength: 255, nullable: true),
                    Message = table.Column<string>(type: "TEXT", nullable: false),
                    Exception = table.Column<string>(type: "TEXT", nullable: true),
                    UserId = table.Column<string>(type: "TEXT", maxLength: 450, nullable: true),
                    UserEmail = table.Column<string>(type: "TEXT", maxLength: 450, nullable: true),
                    RequestId = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LogEntries", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MessageTemplates",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Subject = table.Column<string>(type: "TEXT", maxLength: 300, nullable: false),
                    Body = table.Column<string>(type: "TEXT", maxLength: 10000, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MessageTemplates", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Pages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Type = table.Column<int>(type: "INTEGER", nullable: false),
                    Title = table.Column<string>(type: "TEXT", maxLength: 256, nullable: false),
                    Body = table.Column<string>(type: "TEXT", maxLength: 20480, nullable: false),
                    JsonData = table.Column<string>(type: "TEXT", maxLength: 20480, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedBy = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    UpdatedBy = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    UpdatedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Pages", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SystemSettings",
                columns: table => new
                {
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    Value = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SystemSettings", x => x.Name);
                });

            migrationBuilder.CreateTable(
                name: "UserConfigurations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Type = table.Column<int>(type: "INTEGER", nullable: false),
                    DataJson = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserConfigurations", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AspNetRoleClaims",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    RoleId = table.Column<string>(type: "TEXT", nullable: false),
                    ClaimType = table.Column<string>(type: "TEXT", nullable: true),
                    ClaimValue = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetRoleClaims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AspNetRoleClaims_AspNetRoles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "AspNetRoles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserClaims",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    UserId = table.Column<string>(type: "TEXT", nullable: false),
                    ClaimType = table.Column<string>(type: "TEXT", nullable: true),
                    ClaimValue = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserClaims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AspNetUserClaims_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserLogins",
                columns: table => new
                {
                    LoginProvider = table.Column<string>(type: "TEXT", nullable: false),
                    ProviderKey = table.Column<string>(type: "TEXT", nullable: false),
                    ProviderDisplayName = table.Column<string>(type: "TEXT", nullable: true),
                    UserId = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserLogins", x => new { x.LoginProvider, x.ProviderKey });
                    table.ForeignKey(
                        name: "FK_AspNetUserLogins_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserRoles",
                columns: table => new
                {
                    UserId = table.Column<string>(type: "TEXT", nullable: false),
                    RoleId = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserRoles", x => new { x.UserId, x.RoleId });
                    table.ForeignKey(
                        name: "FK_AspNetUserRoles_AspNetRoles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "AspNetRoles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AspNetUserRoles_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserTokens",
                columns: table => new
                {
                    UserId = table.Column<string>(type: "TEXT", nullable: false),
                    LoginProvider = table.Column<string>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    Value = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserTokens", x => new { x.UserId, x.LoginProvider, x.Name });
                    table.ForeignKey(
                        name: "FK_AspNetUserTokens_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AssessmentModuleVersions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Title = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    NormalizedTitle = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 5000, nullable: false),
                    Version = table.Column<int>(type: "INTEGER", nullable: false),
                    IsPublished = table.Column<bool>(type: "INTEGER", nullable: false),
                    PassingScorePercentage = table.Column<int>(type: "INTEGER", nullable: false),
                    DurationInMinutes = table.Column<int>(type: "INTEGER", nullable: false),
                    CreatedByUser = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    UpdatedByUser = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false),
                    AssessmentModuleId = table.Column<Guid>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AssessmentModuleVersions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AssessmentModuleVersions_AssessmentModules_AssessmentModuleId",
                        column: x => x.AssessmentModuleId,
                        principalTable: "AssessmentModules",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Assignments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Title = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    NormalizedTitle = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 5000, nullable: true),
                    StartDateUtc = table.Column<DateTime>(type: "TEXT", nullable: false),
                    EndDateUtc = table.Column<DateTime>(type: "TEXT", nullable: false),
                    ShowResultsImmediately = table.Column<bool>(type: "INTEGER", nullable: false),
                    RandomizeQuestions = table.Column<bool>(type: "INTEGER", nullable: false),
                    RandomizeAnswers = table.Column<bool>(type: "INTEGER", nullable: false),
                    IsPublished = table.Column<bool>(type: "INTEGER", nullable: false),
                    GroupId = table.Column<Guid>(type: "TEXT", nullable: false),
                    CreatedByUser = table.Column<string>(type: "TEXT", maxLength: 256, nullable: false),
                    UpdatedByUser = table.Column<string>(type: "TEXT", maxLength: 256, nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Assignments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Assignments_Groups_GroupId",
                        column: x => x.GroupId,
                        principalTable: "Groups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "GroupMembers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    GroupId = table.Column<Guid>(type: "TEXT", nullable: false),
                    OrderNumber = table.Column<int>(type: "INTEGER", nullable: false),
                    AssessmentModuleId = table.Column<Guid>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GroupMembers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GroupMembers_AssessmentModules_AssessmentModuleId",
                        column: x => x.AssessmentModuleId,
                        principalTable: "AssessmentModules",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_GroupMembers_Groups_GroupId",
                        column: x => x.GroupId,
                        principalTable: "Groups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AssessmentQuestions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Text = table.Column<string>(type: "TEXT", maxLength: 5000, nullable: false),
                    Order = table.Column<int>(type: "INTEGER", nullable: false),
                    Type = table.Column<int>(type: "INTEGER", nullable: false),
                    AssessmentModuleVersionId = table.Column<Guid>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AssessmentQuestions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AssessmentQuestions_AssessmentModuleVersions_AssessmentModuleVersionId",
                        column: x => x.AssessmentModuleVersionId,
                        principalTable: "AssessmentModuleVersions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "StaticFiles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    FileUrl = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    AssessmentModuleId = table.Column<Guid>(type: "TEXT", maxLength: 200, nullable: false),
                    Label = table.Column<string>(type: "TEXT", nullable: true),
                    UploadedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false),
                    IsModuleLevelFile = table.Column<bool>(type: "INTEGER", nullable: false),
                    AssessmentModuleVersionEntityId = table.Column<Guid>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StaticFiles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StaticFiles_AssessmentModuleVersions_AssessmentModuleVersionEntityId",
                        column: x => x.AssessmentModuleVersionEntityId,
                        principalTable: "AssessmentModuleVersions",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_StaticFiles_AssessmentModules_AssessmentModuleId",
                        column: x => x.AssessmentModuleId,
                        principalTable: "AssessmentModules",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ExamTakerAssignments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    AssignmentId = table.Column<Guid>(type: "TEXT", nullable: false),
                    ExamTakerId = table.Column<string>(type: "TEXT", nullable: false),
                    ExamTakerDisplayName = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExamTakerAssignments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ExamTakerAssignments_Assignments_AssignmentId",
                        column: x => x.AssignmentId,
                        principalTable: "Assignments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AssessmentPossibleAnswers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Order = table.Column<int>(type: "INTEGER", nullable: false),
                    Text = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: false),
                    IsCorrect = table.Column<bool>(type: "INTEGER", nullable: false),
                    QuestionId = table.Column<Guid>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AssessmentPossibleAnswers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AssessmentPossibleAnswers_AssessmentQuestions_QuestionId",
                        column: x => x.QuestionId,
                        principalTable: "AssessmentQuestions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "QuestionEntityStaticFileEntity",
                columns: table => new
                {
                    AssociatedStaticFilesId = table.Column<Guid>(type: "TEXT", nullable: false),
                    QuestionsId = table.Column<Guid>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QuestionEntityStaticFileEntity", x => new { x.AssociatedStaticFilesId, x.QuestionsId });
                    table.ForeignKey(
                        name: "FK_QuestionEntityStaticFileEntity_AssessmentQuestions_QuestionsId",
                        column: x => x.QuestionsId,
                        principalTable: "AssessmentQuestions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_QuestionEntityStaticFileEntity_StaticFiles_AssociatedStaticFilesId",
                        column: x => x.AssociatedStaticFilesId,
                        principalTable: "StaticFiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ModuleProgress",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    QuestionRandomizationSeed = table.Column<Guid>(type: "TEXT", nullable: true),
                    AnswerRandomizationSeed = table.Column<Guid>(type: "TEXT", nullable: true),
                    HasStarted = table.Column<bool>(type: "INTEGER", nullable: false),
                    DurationInMinutes = table.Column<int>(type: "INTEGER", nullable: false),
                    StartedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: true),
                    CompletedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ExamTakerAssignmentId = table.Column<Guid>(type: "TEXT", nullable: false),
                    ExamTakerId = table.Column<string>(type: "TEXT", nullable: false),
                    GroupMemberId = table.Column<Guid>(type: "TEXT", nullable: false),
                    AssessmentModuleVersionId = table.Column<Guid>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ModuleProgress", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ModuleProgress_AssessmentModuleVersions_AssessmentModuleVersionId",
                        column: x => x.AssessmentModuleVersionId,
                        principalTable: "AssessmentModuleVersions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ModuleProgress_ExamTakerAssignments_ExamTakerAssignmentId",
                        column: x => x.ExamTakerAssignmentId,
                        principalTable: "ExamTakerAssignments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ModuleProgress_GroupMembers_GroupMemberId",
                        column: x => x.GroupMemberId,
                        principalTable: "GroupMembers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PossibleAnswerEntityStaticFileEntity",
                columns: table => new
                {
                    AssociatedStaticFilesId = table.Column<Guid>(type: "TEXT", nullable: false),
                    PossibleAnswersId = table.Column<Guid>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PossibleAnswerEntityStaticFileEntity", x => new { x.AssociatedStaticFilesId, x.PossibleAnswersId });
                    table.ForeignKey(
                        name: "FK_PossibleAnswerEntityStaticFileEntity_AssessmentPossibleAnswers_PossibleAnswersId",
                        column: x => x.PossibleAnswersId,
                        principalTable: "AssessmentPossibleAnswers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PossibleAnswerEntityStaticFileEntity_StaticFiles_AssociatedStaticFilesId",
                        column: x => x.AssociatedStaticFilesId,
                        principalTable: "StaticFiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "QuestionResponses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    SelectedAnswerIds = table.Column<string>(type: "TEXT", nullable: false),
                    TextResponse = table.Column<string>(type: "TEXT", nullable: true),
                    QuestionType = table.Column<int>(type: "INTEGER", nullable: false),
                    IsCorrect = table.Column<bool>(type: "INTEGER", nullable: true),
                    RespondedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false),
                    ModuleProgressId = table.Column<Guid>(type: "TEXT", nullable: false),
                    QuestionId = table.Column<Guid>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QuestionResponses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_QuestionResponses_AssessmentQuestions_QuestionId",
                        column: x => x.QuestionId,
                        principalTable: "AssessmentQuestions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_QuestionResponses_ModuleProgress_ModuleProgressId",
                        column: x => x.ModuleProgressId,
                        principalTable: "ModuleProgress",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "MessageTemplates",
                columns: new[] { "Id", "Body", "Name", "Subject" },
                values: new object[,]
                {
                    { new Guid("6863fdeb-ed8d-41ba-8567-c00cf8561470"), "<!DOCTYPE html>\n<html lang=\"en\" style=\"margin:0;padding:0;\">\n  <head>\n    <meta charset=\"utf-8\" />\n    <meta name=\"viewport\" content=\"width=device-width,initial-scale=1\" />\n    <meta name=\"x-apple-disable-message-reformatting\" />\n    <meta name=\"format-detection\" content=\"telephone=no,address=no,email=no,date=no,url=no\" />\n    <meta name=\"color-scheme\" content=\"light dark\" />\n    <meta name=\"supported-color-schemes\" content=\"light dark\" />\n    <title>Welcome to PublicQ</title>\n    <style>\n      body {\n        margin:0;\n        padding:0;\n        background:linear-gradient(135deg,#e6f0ff,#f9fbff);\n        font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Ubuntu,'Helvetica Neue',Arial,sans-serif;\n        color:#1e2330;\n      }\n      .container {\n        max-width:800px;\n        margin:0 auto;\n        padding:32px 20px;\n      }\n      .card {\n        background:rgba(255,255,255,0.85);\n        border-radius:16px;\n        padding:32px;\n        box-shadow:0 8px 20px rgba(0,0,0,0.1);\n      }\n      h1 {\n        margin:0 0 20px 0;\n        font-size:24px;\n        font-weight:600;\n        color:#0b5fff;\n        text-align:center;\n      }\n      p {\n        margin:0 0 16px 0;\n        font-size:16px;\n        line-height:1.6;\n      }\n      .cta {\n        display:block;\n        margin:20px auto 10px auto;\n        width:max-content;\n        text-decoration:none;\n        background:#0b5fff;\n        color:#ffffff !important;\n        padding:12px 20px;\n        border-radius:10px;\n        font-weight:600;\n      }\n      .link-fallback {\n        background:#f1f4fb;\n        border-radius:8px;\n        padding:12px 16px;\n        margin:12px 0 0 0;\n        font-family:monospace;\n        font-size:14px;\n        color:#0b5fff;\n        word-break:break-all;\n      }\n      .footer {\n        margin-top:28px;\n        font-size:12px;\n        color:#6b7280;\n        text-align:center;\n      }\n      @media (max-width:600px) {\n        .card { padding:20px; }\n        h1 { font-size:20px; }\n        p { font-size:15px; }\n      }\n      @media (prefers-color-scheme: dark) {\n        body {\n          background:linear-gradient(135deg,#0f1115,#1b1e24);\n          color:#e7e7ea;\n        }\n        .card {\n          background:rgba(30,33,40,0.85);\n          border:1px solid #2a2f3a;\n        }\n        h1 { color:#7cb8ff; }\n        .cta { background:#7cb8ff; color:#0f1115 !important; }\n        .link-fallback { background:#252b36; color:#7cb8ff; }\n        .footer { color:#a7acb8; }\n      }\n    </style>\n  </head>\n  <body>\n    <div class=\"container\">\n      <div class=\"card\">\n        <h1>Welcome to PublicQ</h1>\n        <p>Hello <strong>{{User}}</strong>,</p>\n        <p>\n          Your account on <a href=\"{{BaseUrl}}\" target=\"_blank\" rel=\"noopener\" style=\"color:#0b5fff;font-weight:600;text-decoration:none;\">PublicQ</a> has been created successfully.  \n          We’re glad to welcome you to the platform.\n        </p>\n\n        <!-- Primary CTA button -->\n        <a class=\"cta\" href=\"{{CreatePasswordUrl}}\" target=\"_blank\" rel=\"noopener\">Create Your Password</a>\n\n        <!-- Fallback plain link -->\n        <div class=\"link-fallback\">\n          {{CreatePasswordUrl}}\n        </div>\n\n        <p style=\"margin-top:16px;\">If you didn’t sign up for a PublicQ account, you can safely ignore this email.</p>\n        <p>Best regards,<br/>PublicQ Team</p>\n\n        <div class=\"footer\">\n          Your account is ready — let’s get started!\n        </div>\n      </div>\n    </div>\n  </body>\n</html>", "Default Welcome Email with Create Password Link", "Dear {{User}}, welcome to PublicQ!" },
                    { new Guid("a5091d38-fa5e-4cdb-b4bc-22381aeaf8be"), "<!DOCTYPE html>\n<html lang=\"en\" style=\"margin:0;padding:0;\">\n  <head>\n    <meta charset=\"utf-8\" />\n    <meta name=\"viewport\" content=\"width=device-width,initial-scale=1\" />\n    <meta name=\"x-apple-disable-message-reformatting\" />\n    <meta name=\"format-detection\" content=\"telephone=no,address=no,email=no,date=no,url=no\" />\n    <meta name=\"color-scheme\" content=\"light dark\" />\n    <meta name=\"supported-color-schemes\" content=\"light dark\" />\n    <title>Reset Your Password</title>\n    <style>\n      body {\n        margin:0;\n        padding:0;\n        background:linear-gradient(135deg,#e6f0ff,#f9fbff);\n        font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Ubuntu,'Helvetica Neue',Arial,sans-serif;\n        color:#1e2330;\n      }\n      .container {\n        max-width:800px;\n        margin:0 auto;\n        padding:32px 20px;\n      }\n      .card {\n        background:rgba(255,255,255,0.85);\n        border-radius:16px;\n        padding:32px;\n        box-shadow:0 8px 20px rgba(0,0,0,0.1);\n      }\n      h1 {\n        margin:0 0 20px 0;\n        font-size:24px;\n        font-weight:600;\n        color:#0b5fff;\n        text-align:center;\n      }\n      p {\n        margin:0 0 16px 0;\n        font-size:16px;\n        line-height:1.6;\n      }\n      .cta {\n        display:block;\n        margin:20px auto 10px auto;\n        width:max-content;\n        text-decoration:none;\n        background:#0b5fff;\n        color:#ffffff !important;\n        padding:12px 20px;\n        border-radius:10px;\n        font-weight:600;\n      }\n      .link-fallback {\n        background:#f1f4fb;\n        border-radius:8px;\n        padding:12px 16px;\n        margin:12px 0 0 0;\n        font-family:monospace;\n        font-size:14px;\n        color:#0b5fff;\n        word-break:break-all;\n      }\n      .footer {\n        margin-top:28px;\n        font-size:12px;\n        color:#6b7280;\n        text-align:center;\n      }\n      @media (max-width:600px) {\n        .card { padding:20px; }\n        h1 { font-size:20px; }\n        p { font-size:15px; }\n      }\n      @media (prefers-color-scheme: dark) {\n        body {\n          background:linear-gradient(135deg,#0f1115,#1b1e24);\n          color:#e7e7ea;\n        }\n        .card {\n          background:rgba(30,33,40,0.85);\n          border:1px solid #2a2f3a;\n        }\n        h1 { color:#7cb8ff; }\n        .link-fallback {\n          background:#252b36;\n          color:#7cb8ff;\n        }\n        .footer { color:#a7acb8; }\n      }\n    </style>\n  </head>\n  <body>\n    <div class=\"container\">\n      <div class=\"card\">\n        <h1>Reset Your Password</h1>\n        <p>Hello <strong>{{User}}</strong>,</p>\n        <p>We received a request to reset your password. Click the button below to create a new one:</p>\n\n        <!-- Primary CTA uses the reset link -->\n        <a class=\"cta\" href=\"{{ResetLink}}\" target=\"_blank\" rel=\"noopener\">Reset Password</a>\n\n        <!-- Fallback plain link (placed under {{ResetLink}}) -->\n        <div class=\"link-fallback\">\n          {{ResetLink}}\n        </div>\n\n        <p style=\"margin-top:16px;\">If you didn’t request a password reset, you can safely ignore this email.</p>\n        <p>Best regards,<br/>PublicQ Team</p>\n\n        <div class=\"footer\">\n          This link will expire after a short period for security reasons.\n        </div>\n      </div>\n    </div>\n  </body>\n</html>", "Default Forget Password", "Dear {{User}}, here is your password reset link" },
                    { new Guid("bfc0e145-396f-4bc1-ae2f-14e528fe55b3"), "<!DOCTYPE html>\n<html lang=\"en\" style=\"margin:0;padding:0;\">\n  <head>\n    <meta charset=\"utf-8\" />\n    <meta name=\"viewport\" content=\"width=device-width,initial-scale=1\" />\n    <meta name=\"x-apple-disable-message-reformatting\" />\n    <meta name=\"format-detection\" content=\"telephone=no,address=no,email=no,date=no,url=no\" />\n    <meta name=\"color-scheme\" content=\"light dark\" />\n    <meta name=\"supported-color-schemes\" content=\"light dark\" />\n    <title>Password Reset</title>\n    <style>\n      body {\n        margin:0;\n        padding:0;\n        background:linear-gradient(135deg,#e6f0ff,#f9fbff);\n        font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Ubuntu,'Helvetica Neue',Arial,sans-serif;\n        color:#1e2330;\n      }\n      .container {\n        max-width:800px;\n        margin:0 auto;\n        padding:32px 20px;\n      }\n      .card {\n        background:rgba(255,255,255,0.85);\n        border-radius:16px;\n        padding:32px;\n        box-shadow:0 8px 20px rgba(0,0,0,0.1);\n      }\n      h1 {\n        margin:0 0 20px 0;\n        font-size:24px;\n        font-weight:600;\n        color:#0b5fff;\n        text-align:center;\n      }\n      p {\n        margin:0 0 16px 0;\n        font-size:16px;\n        line-height:1.6;\n      }\n      .password-box {\n        background:#f1f4fb;\n        border-radius:8px;\n        padding:12px 16px;\n        margin:16px 0;\n        font-family:monospace;\n        font-size:16px;\n        font-weight:600;\n        color:#0b5fff;\n        text-align:center;\n      }\n      .footer {\n        margin-top:28px;\n        font-size:12px;\n        color:#6b7280;\n        text-align:center;\n      }\n      @media (max-width:600px) {\n        .card { padding:20px; }\n        h1 { font-size:20px; }\n        p { font-size:15px; }\n      }\n      @media (prefers-color-scheme: dark) {\n        body {\n          background:linear-gradient(135deg,#0f1115,#1b1e24);\n          color:#e7e7ea;\n        }\n        .card {\n          background:rgba(30,33,40,0.85);\n          border:1px solid #2a2f3a;\n        }\n        h1 { color:#7cb8ff; }\n        .password-box {\n          background:#252b36;\n          color:#7cb8ff;\n        }\n        .footer { color:#a7acb8; }\n      }\n    </style>\n  </head>\n  <body>\n    <div class=\"container\">\n      <div class=\"card\">\n        <h1>Password Reset by Administrator</h1>\n        <p>Hello <strong>{{User}}</strong>,</p>\n        <p>\n          Your password has been reset by the <strong>system administrator</strong>.  \n        </p>\n        <p>Here is your new password:</p>\n        <div class=\"password-box\">\n          {{Password}}\n        </div>\n        <p>Best regards,<br/>PublicQ Team</p>\n        <div class=\"footer\">\n          If you did not expect this reset, please contact support immediately.\n        </div>\n      </div>\n    </div>\n  </body>\n</html>", "Default Password Reset Email", "Dear {{User}}, your password has been reset" },
                    { new Guid("f2a1a4c8-8e6a-4f1c-b9f8-9f2c4c622dd9"), "<!DOCTYPE html>\n<html lang=\"en\" style=\"margin:0;padding:0;\">\n  <head>\n    <meta charset=\"utf-8\" />\n    <meta name=\"viewport\" content=\"width=device-width,initial-scale=1\" />\n    <meta name=\"x-apple-disable-message-reformatting\" />\n    <meta name=\"format-detection\" content=\"telephone=no,address=no,email=no,date=no,url=no\" />\n    <meta name=\"color-scheme\" content=\"light dark\" />\n    <meta name=\"supported-color-schemes\" content=\"light dark\" />\n    <title>Welcome to PublicQ</title>\n    <style>\n      body {\n        margin:0;\n        padding:0;\n        background:linear-gradient(135deg,#e6f0ff,#f9fbff);\n        font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Ubuntu,'Helvetica Neue',Arial,sans-serif;\n        color:#1e2330;\n      }\n      .container {\n        max-width:800px;\n        margin:0 auto;\n        padding:32px 20px;\n      }\n      .card {\n        background:rgba(255,255,255,0.85);\n        border-radius:16px;\n        padding:32px;\n        box-shadow:0 8px 20px rgba(0,0,0,0.1);\n      }\n      h1 {\n        margin:0 0 20px 0;\n        font-size:24px;\n        font-weight:600;\n        color:#0b5fff;\n        text-align:center;\n      }\n      p {\n        margin:0 0 16px 0;\n        font-size:16px;\n        line-height:1.6;\n      }\n      .footer {\n        margin-top:28px;\n        font-size:12px;\n        color:#6b7280;\n        text-align:center;\n      }\n      @media (max-width:600px) {\n        .card { padding:20px; }\n        h1 { font-size:20px; }\n        p { font-size:15px; }\n      }\n      @media (prefers-color-scheme: dark) {\n        body {\n          background:linear-gradient(135deg,#0f1115,#1b1e24);\n          color:#e7e7ea;\n        }\n        .card {\n          background:rgba(30,33,40,0.85);\n          border:1px solid #2a2f3a;\n        }\n        h1 { color:#7cb8ff; }\n        .footer { color:#a7acb8; }\n      }\n    </style>\n  </head>\n  <body>\n    <div class=\"container\">\n      <div class=\"card\">\n        <h1>Welcome to PublicQ</h1>\n        <p>Hello <strong>{{User}}</strong>,</p>\n        <p>\n          Thank you for joining <span style=\"color:#0b5fff;font-weight:600;\">PublicQ</span>!  \n          We are excited to have you on board.\n        </p>\n        <p>Best regards,<br/>PublicQ Team</p>\n        <div class=\"footer\">\n          If you did not create a PublicQ account, you can safely ignore this message.\n        </div>\n      </div>\n    </div>\n  </body>\n</html>", "Default Welcome Email", "Dear {{User}}, welcome to PublicQ!" }
                });

            migrationBuilder.InsertData(
                table: "SystemSettings",
                columns: new[] { "Name", "Value" },
                values: new object[,]
                {
                    { "AssessmentServiceOptions:MaxPageSize", "100" },
                    { "AssignmentServiceOptions:MaxPageSize", "100" },
                    { "AuthOptions:JwtSettings:Audience", "PublicQClient" },
                    { "AuthOptions:JwtSettings:Issuer", "PublicQServer" },
                    { "AuthOptions:JwtSettings:Secret", "ChangeMe:VGhpc0lzQVNlY3VyZURlZmF1bHRKV1RTZWNyZXRLZXlGb3JEZXZlbG9wbWVudFB1cnBvc2VzT25seQ==" },
                    { "AuthOptions:JwtSettings:TokenExpiryMinutes", "60" },
                    { "DbLoggerOptions:Enabled", "true" },
                    { "DbLoggerOptions:ExcludedCategories:0", "PublicQ.Infrastructure.DynamicJwtBearerHandler" },
                    { "DbLoggerOptions:ExcludedCategories:1", "Microsoft" },
                    { "DbLoggerOptions:ExcludedCategories:2", "System" },
                    { "DbLoggerOptions:LogLevel", "Error" },
                    { "DbLoggerOptions:MaxPageSize", "100" },
                    { "DbLoggerOptions:RetentionPeriodInDays", "90" },
                    { "EmailOptions:MessageProvider", "Sendgrid" },
                    { "EmailOptions:SendFrom", "change-me@publiq.local" },
                    { "FileStorageOptions:MaxUploadFileSizeInKilobytes", "5120" },
                    { "FileStorageOptions:StaticContentPath", "static" },
                    { "GroupServiceOptions:MaxPageSize", "100" },
                    { "InitialSetupOptions:IsInitialized", "false" },
                    { "IpRateLimitOptions:GeneralRules:0:Endpoint", "*" },
                    { "IpRateLimitOptions:GeneralRules:0:Limit", "100" },
                    { "IpRateLimitOptions:GeneralRules:0:Period", "10s" },
                    { "IpRateLimitOptions:IpWhitelist:0", "127.0.0.1" },
                    { "IpRateLimitOptions:IpWhitelist:1", "::1" },
                    { "IpRateLimitOptions:RealIpHeader", "X-Forwarded-For" },
                    { "LlmIntegrationOptions:Enabled", "false" },
                    { "LlmIntegrationOptions:Provider", "OpenAI" },
                    { "PasswordPolicyOptions:RequireDigit", "true" },
                    { "PasswordPolicyOptions:RequireLowercase", "true" },
                    { "PasswordPolicyOptions:RequireNonAlphanumeric", "false" },
                    { "PasswordPolicyOptions:RequireUppercase", "true" },
                    { "PasswordPolicyOptions:RequiredLength", "8" },
                    { "RedisOptions:AbortOnConnectFail", "false" },
                    { "RedisOptions:ConnectionString", "redis:6379" },
                    { "RedisOptions:DefaultDurationInMinutes", "60" },
                    { "RedisOptions:Enabled", "false" },
                    { "RedisOptions:KeyPrefix", "PublicQ:" },
                    { "RedisOptions:ServiceDurationsInMinutes:IReportingService", "60" },
                    { "ReportingServiceOptions:MaxPageSize", "100" },
                    { "SendgridOptions:ApiKey", "<Your Sendgrid API Key>" },
                    { "SmtpOptions:SmtpHost", "localhost" },
                    { "SmtpOptions:SmtpPort", "25" },
                    { "SmtpOptions:UseSsl", "false" },
                    { "SmtpOptions:UseStartTls", "false" },
                    { "UserServiceOptions:MaxImportSize", "500" },
                    { "UserServiceOptions:MaxPageSize", "100" },
                    { "UserServiceOptions:SelfServiceRegistrationEnabled", "true" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_AspNetRoleClaims_RoleId",
                table: "AspNetRoleClaims",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "RoleNameIndex",
                table: "AspNetRoles",
                column: "NormalizedName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserClaims_UserId",
                table: "AspNetUserClaims",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserLogins_UserId",
                table: "AspNetUserLogins",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserRoles_RoleId",
                table: "AspNetUserRoles",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "EmailIndex",
                table: "AspNetUsers",
                column: "NormalizedEmail");

            migrationBuilder.CreateIndex(
                name: "UserNameIndex",
                table: "AspNetUsers",
                column: "NormalizedUserName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AssessmentModuleVersions_AssessmentModuleId",
                table: "AssessmentModuleVersions",
                column: "AssessmentModuleId");

            migrationBuilder.CreateIndex(
                name: "IX_AssessmentModuleVersions_NormalizedTitle",
                table: "AssessmentModuleVersions",
                column: "NormalizedTitle");

            migrationBuilder.CreateIndex(
                name: "IX_AssessmentModuleVersions_Title",
                table: "AssessmentModuleVersions",
                column: "Title");

            migrationBuilder.CreateIndex(
                name: "IX_AssessmentPossibleAnswers_QuestionId",
                table: "AssessmentPossibleAnswers",
                column: "QuestionId");

            migrationBuilder.CreateIndex(
                name: "IX_AssessmentQuestions_AssessmentModuleVersionId",
                table: "AssessmentQuestions",
                column: "AssessmentModuleVersionId");

            migrationBuilder.CreateIndex(
                name: "IX_Assignments_GroupId",
                table: "Assignments",
                column: "GroupId");

            migrationBuilder.CreateIndex(
                name: "IX_Assignments_Title",
                table: "Assignments",
                column: "Title",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Banners_ShowToAuthenticatedUsersOnly",
                table: "Banners",
                column: "ShowToAuthenticatedUsersOnly");

            migrationBuilder.CreateIndex(
                name: "IX_ExamTakerAssignments_AssignmentId",
                table: "ExamTakerAssignments",
                column: "AssignmentId");

            migrationBuilder.CreateIndex(
                name: "IX_ExamTakers_NormalizedEmail",
                table: "ExamTakers",
                column: "NormalizedEmail",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_GroupMembers_AssessmentModuleId",
                table: "GroupMembers",
                column: "AssessmentModuleId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupMembers_GroupId_OrderNumber",
                table: "GroupMembers",
                columns: new[] { "GroupId", "OrderNumber" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Groups_NormalizedTitle",
                table: "Groups",
                column: "NormalizedTitle",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_LogEntries_Level",
                table: "LogEntries",
                column: "Level");

            migrationBuilder.CreateIndex(
                name: "IX_LogEntries_Timestamp",
                table: "LogEntries",
                column: "Timestamp");

            migrationBuilder.CreateIndex(
                name: "IX_ModuleProgress_AssessmentModuleVersionId",
                table: "ModuleProgress",
                column: "AssessmentModuleVersionId");

            migrationBuilder.CreateIndex(
                name: "IX_ModuleProgress_ExamTakerAssignmentId",
                table: "ModuleProgress",
                column: "ExamTakerAssignmentId");

            migrationBuilder.CreateIndex(
                name: "IX_ModuleProgress_GroupMemberId",
                table: "ModuleProgress",
                column: "GroupMemberId");

            migrationBuilder.CreateIndex(
                name: "IX_PossibleAnswerEntityStaticFileEntity_PossibleAnswersId",
                table: "PossibleAnswerEntityStaticFileEntity",
                column: "PossibleAnswersId");

            migrationBuilder.CreateIndex(
                name: "IX_QuestionEntityStaticFileEntity_QuestionsId",
                table: "QuestionEntityStaticFileEntity",
                column: "QuestionsId");

            migrationBuilder.CreateIndex(
                name: "IX_QuestionResponses_ModuleProgressId",
                table: "QuestionResponses",
                column: "ModuleProgressId");

            migrationBuilder.CreateIndex(
                name: "IX_QuestionResponses_QuestionId",
                table: "QuestionResponses",
                column: "QuestionId");

            migrationBuilder.CreateIndex(
                name: "IX_StaticFiles_AssessmentModuleId",
                table: "StaticFiles",
                column: "AssessmentModuleId");

            migrationBuilder.CreateIndex(
                name: "IX_StaticFiles_AssessmentModuleVersionEntityId",
                table: "StaticFiles",
                column: "AssessmentModuleVersionEntityId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AspNetRoleClaims");

            migrationBuilder.DropTable(
                name: "AspNetUserClaims");

            migrationBuilder.DropTable(
                name: "AspNetUserLogins");

            migrationBuilder.DropTable(
                name: "AspNetUserRoles");

            migrationBuilder.DropTable(
                name: "AspNetUserTokens");

            migrationBuilder.DropTable(
                name: "Banners");

            migrationBuilder.DropTable(
                name: "ExamTakers");

            migrationBuilder.DropTable(
                name: "LogEntries");

            migrationBuilder.DropTable(
                name: "MessageTemplates");

            migrationBuilder.DropTable(
                name: "Pages");

            migrationBuilder.DropTable(
                name: "PossibleAnswerEntityStaticFileEntity");

            migrationBuilder.DropTable(
                name: "QuestionEntityStaticFileEntity");

            migrationBuilder.DropTable(
                name: "QuestionResponses");

            migrationBuilder.DropTable(
                name: "SystemSettings");

            migrationBuilder.DropTable(
                name: "UserConfigurations");

            migrationBuilder.DropTable(
                name: "AspNetRoles");

            migrationBuilder.DropTable(
                name: "AspNetUsers");

            migrationBuilder.DropTable(
                name: "AssessmentPossibleAnswers");

            migrationBuilder.DropTable(
                name: "StaticFiles");

            migrationBuilder.DropTable(
                name: "ModuleProgress");

            migrationBuilder.DropTable(
                name: "AssessmentQuestions");

            migrationBuilder.DropTable(
                name: "ExamTakerAssignments");

            migrationBuilder.DropTable(
                name: "GroupMembers");

            migrationBuilder.DropTable(
                name: "AssessmentModuleVersions");

            migrationBuilder.DropTable(
                name: "Assignments");

            migrationBuilder.DropTable(
                name: "AssessmentModules");

            migrationBuilder.DropTable(
                name: "Groups");
        }
    }
}
