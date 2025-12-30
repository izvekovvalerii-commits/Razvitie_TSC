package controllers

import (
	"bytes"
	"io"
	"log"
	"net/http"
	"portal-razvitie/database"
	"portal-razvitie/models"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

type ProjectsController struct{}

// GetProjects godoc
// @Summary Get all projects
// @Description Get list of all projects with store information
// @Tags projects
// @Produce json
// @Success 200 {array} models.Project
// @Router /api/projects [get]
func (pc *ProjectsController) GetProjects(c *gin.Context) {
	var projects []models.Project

	if err := database.DB.Find(&projects).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Manually load stores for each project
	for i := range projects {
		var store models.Store
		if err := database.DB.First(&store, projects[i].StoreID).Error; err == nil {
			projects[i].Store = &store
		}
	}

	c.JSON(http.StatusOK, projects)
}

// GetProject godoc
// @Summary Get project by ID
// @Description Get a single project by ID with store information
// @Tags projects
// @Produce json
// @Param id path int true "Project ID"
// @Success 200 {object} models.Project
// @Failure 404 {object} map[string]string
// @Router /api/projects/{id} [get]
func (pc *ProjectsController) GetProject(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var project models.Project
	if err := database.DB.First(&project, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
		return
	}

	// Manually load store
	var store models.Store
	if err := database.DB.First(&store, project.StoreID).Error; err == nil {
		project.Store = &store
	}

	c.JSON(http.StatusOK, project)
}

// CreateProject godoc
// @Summary Create a new project
// @Description Create a new project
// @Tags projects
// @Accept json
// @Produce json
// @Param project body models.Project true "Project object"
// @Success 201 {object} models.Project
// @Failure 400 {object} map[string]string
// @Router /api/projects [post]
func (pc *ProjectsController) CreateProject(c *gin.Context) {
	var project models.Project

	// Log raw request body for debugging
	bodyBytes, _ := c.GetRawData()
	c.Request.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))
	log.Printf("[CreateProject] Received body: %s", string(bodyBytes))

	if err := c.ShouldBindJSON(&project); err != nil {
		log.Printf("[CreateProject] Validation error: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	log.Printf("[CreateProject] Parsed project: %+v", project)

	project.CreatedAt = time.Now().UTC()

	if err := database.DB.Create(&project).Error; err != nil {
		log.Printf("[CreateProject] Database error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, project)
}

// UpdateProject godoc
// @Summary Update a project
// @Description Update an existing project
// @Tags projects
// @Accept json
// @Produce json
// @Param id path int true "Project ID"
// @Param project body models.Project true "Project object"
// @Success 204
// @Failure 400 {object} map[string]string
// @Router /api/projects/{id} [put]
func (pc *ProjectsController) UpdateProject(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var project models.Project
	if err := c.ShouldBindJSON(&project); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if uint(id) != project.ID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID mismatch"})
		return
	}

	now := time.Now().UTC()
	project.UpdatedAt = &now

	if err := database.DB.Save(&project).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}

// UpdateProjectStatus godoc
// @Summary Update project status
// @Description Update the status of a project
// @Tags projects
// @Accept json
// @Produce json
// @Param id path int true "Project ID"
// @Param status body string true "New status"
// @Success 204
// @Failure 404 {object} map[string]string
// @Router /api/projects/{id}/status [patch]
func (pc *ProjectsController) UpdateProjectStatus(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var statusUpdate struct {
		Status string `json:"status"`
	}

	if err := c.ShouldBindJSON(&statusUpdate); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var project models.Project
	if err := database.DB.First(&project, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
		return
	}

	now := time.Now().UTC()
	project.Status = statusUpdate.Status
	project.UpdatedAt = &now

	if err := database.DB.Save(&project).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}

// DeleteProject godoc
// @Summary Delete a project
// @Description Delete a project by ID
// @Tags projects
// @Param id path int true "Project ID"
// @Success 204
// @Failure 404 {object} map[string]string
// @Router /api/projects/{id} [delete]
func (pc *ProjectsController) DeleteProject(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	result := database.DB.Delete(&models.Project{}, id)
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
		return
	}

	c.Status(http.StatusNoContent)
}
