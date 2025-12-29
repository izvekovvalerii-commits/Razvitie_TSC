using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalRazvitie.API.Migrations
{
    /// <inheritdoc />
    public partial class AddTaskIdToDocuments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "TaskId",
                table: "ProjectDocuments",
                type: "integer",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TaskId",
                table: "ProjectDocuments");
        }
    }
}
