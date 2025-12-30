package routes

import (
	"portal-razvitie/config"
	"portal-razvitie/controllers"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(router *gin.Engine, cfg *config.Config) {
	// Initialize controllers
	storesController := &controllers.StoresController{}
	projectsController := &controllers.ProjectsController{}
	tasksController := &controllers.TasksController{}
	documentsController := controllers.NewDocumentsController(cfg)

	// API group
	api := router.Group("/api")
	{
		// Stores routes
		stores := api.Group("/stores")
		{
			stores.GET("", storesController.GetStores)
			stores.GET("/:id", storesController.GetStore)
			stores.POST("", storesController.CreateStore)
			stores.PUT("/:id", storesController.UpdateStore)
			stores.DELETE("/:id", storesController.DeleteStore)
		}

		// Projects routes
		projects := api.Group("/projects")
		{
			projects.GET("", projectsController.GetProjects)
			projects.GET("/:id", projectsController.GetProject)
			projects.POST("", projectsController.CreateProject)
			projects.PUT("/:id", projectsController.UpdateProject)
			projects.PATCH("/:id/status", projectsController.UpdateProjectStatus)
			projects.DELETE("/:id", projectsController.DeleteProject)
		}

		// Tasks routes
		tasks := api.Group("/tasks")
		{
			tasks.GET("", tasksController.GetAllTasks)
			tasks.GET("/project/:projectId", tasksController.GetProjectTasks)
			tasks.GET("/debug-assignments", tasksController.DebugAssignments)
			tasks.POST("", tasksController.CreateTask)
			tasks.PUT("/:id", tasksController.UpdateTask)
			tasks.PATCH("/:id/status", tasksController.UpdateTaskStatus)
			tasks.DELETE("/cleanup-old", tasksController.CleanupOldTasks)
		}

		// Documents routes
		documents := api.Group("/documents")
		{
			documents.POST("/upload", documentsController.Upload)
			documents.GET("/:id", documentsController.GetById)
			documents.GET("/project/:projectId", documentsController.GetByProject)
			documents.GET("/task/:taskId", documentsController.GetByTask)
			documents.GET("/download/:id", documentsController.Download)
			documents.DELETE("/:id", documentsController.Delete)
		}
	}
}
