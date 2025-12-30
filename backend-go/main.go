package main

import (
	"fmt"
	"log"
	"portal-razvitie/config"
	"portal-razvitie/database"
	"portal-razvitie/routes"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

// @title Portal Razvitie API
// @version 1.0
// @description API сервер для портала развития торговых объектов
// @host localhost:5000
// @BasePath /
func main() {
	// Load configuration
	cfg := config.Load()
	log.Println("🚀 Starting Portal Razvitie API Server...")

	// Connect to database
	if err := database.Connect(cfg); err != nil {
		log.Fatal("❌ Failed to connect to database:", err)
	}

	// Run migrations
	if err := database.AutoMigrate(); err != nil {
		log.Fatal("❌ Failed to run migrations:", err)
	}

	// Initialize Gin router
	router := gin.Default()

	// Configure CORS
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{cfg.CORSOrigin},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// Setup routes
	routes.SetupRoutes(router, cfg)

	// Health check endpoint
	router.GET("/health", func(c *gin.Context) {
		var dbName, inetServerAddr string
		var count int64

		db := database.GetDB()
		db.Raw("SELECT current_database()").Scan(&dbName)
		db.Raw("SELECT inet_server_addr() || ':' || inet_server_port()").Scan(&inetServerAddr)
		db.Table("Stores").Count(&count)

		c.JSON(200, gin.H{
			"status":       "ok",
			"database":     dbName,
			"address":      inetServerAddr,
			"stores_count": count,
			"service":      "Portal Razvitie API",
			"version":      "1.0.0",
		})
	})

	// Start server
	address := fmt.Sprintf(":%s", cfg.ServerPort)
	log.Printf("✅ Server is running on http://localhost%s\n", address)
	log.Printf("📝 API Documentation: http://localhost%s/swagger/index.html\n", address)

	if err := router.Run(address); err != nil {
		log.Fatal("❌ Failed to start server:", err)
	}
}
