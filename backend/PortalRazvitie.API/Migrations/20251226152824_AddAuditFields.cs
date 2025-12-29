using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalRazvitie.API.Migrations
{
    /// <inheritdoc />
    public partial class AddAuditFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "ActualAuditDate",
                table: "ProjectTasks",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "PlannedAuditDate",
                table: "ProjectTasks",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProjectFolderLink",
                table: "ProjectTasks",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ActualAuditDate",
                table: "ProjectTasks");

            migrationBuilder.DropColumn(
                name: "PlannedAuditDate",
                table: "ProjectTasks");

            migrationBuilder.DropColumn(
                name: "ProjectFolderLink",
                table: "ProjectTasks");
        }
    }
}
