using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PublicQ.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class DedupeAndUniqueProgressResponses20260525 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_QuestionResponses_ModuleProgressId",
                table: "QuestionResponses");

            migrationBuilder.DropIndex(
                name: "IX_ModuleProgress_ExamTakerAssignmentId",
                table: "ModuleProgress");

            // 1. ModuleProgress: keep best row per (ExamTakerAssignmentId, GroupMemberId).
            //    Tie-break: completed > most-answered > earliest started > Id asc.
            //    Losing rows' QuestionResponses cascade-delete via FK.
            migrationBuilder.Sql(@"
DELETE FROM ModuleProgress
WHERE Id IN (
    SELECT Id FROM (
        SELECT mp.Id,
               ROW_NUMBER() OVER (
                   PARTITION BY mp.ExamTakerAssignmentId, mp.GroupMemberId
                   ORDER BY
                       CASE WHEN mp.CompletedAtUtc IS NOT NULL THEN 0 ELSE 1 END,
                       (SELECT COUNT(*) FROM QuestionResponses qr WHERE qr.ModuleProgressId = mp.Id) DESC,
                       mp.StartedAtUtc ASC,
                       mp.Id ASC
               ) AS rn
        FROM ModuleProgress mp
    ) ranked
    WHERE ranked.rn > 1
);
");

            // 2. QuestionResponses: keep most recent row per (ModuleProgressId, QuestionId).
            migrationBuilder.Sql(@"
DELETE FROM QuestionResponses
WHERE Id IN (
    SELECT Id FROM (
        SELECT Id,
               ROW_NUMBER() OVER (
                   PARTITION BY ModuleProgressId, QuestionId
                   ORDER BY RespondedAtUtc DESC, Id DESC
               ) AS rn
        FROM QuestionResponses
    ) ranked
    WHERE ranked.rn > 1
);
");

            migrationBuilder.CreateIndex(
                name: "IX_QuestionResponses_ModuleProgressId_QuestionId",
                table: "QuestionResponses",
                columns: new[] { "ModuleProgressId", "QuestionId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ModuleProgress_ExamTakerAssignmentId_GroupMemberId",
                table: "ModuleProgress",
                columns: new[] { "ExamTakerAssignmentId", "GroupMemberId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_QuestionResponses_ModuleProgressId_QuestionId",
                table: "QuestionResponses");

            migrationBuilder.DropIndex(
                name: "IX_ModuleProgress_ExamTakerAssignmentId_GroupMemberId",
                table: "ModuleProgress");

            migrationBuilder.CreateIndex(
                name: "IX_QuestionResponses_ModuleProgressId",
                table: "QuestionResponses",
                column: "ModuleProgressId");

            migrationBuilder.CreateIndex(
                name: "IX_ModuleProgress_ExamTakerAssignmentId",
                table: "ModuleProgress",
                column: "ExamTakerAssignmentId");
        }
    }
}
