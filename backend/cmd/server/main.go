package main

import (
	"log"
	"ai-interviewer-backend/internal/service"

	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()

	// Initialize WebSocket Hub
	hub := service.NewHub()
	go hub.Run()

	r.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "pong",
		})
	})

	r.GET("/ws", func(c *gin.Context) {
		service.ServeWs(hub, c.Writer, c.Request)
	})

	log.Println("Server starting on :8080")
	if err := r.Run(":8080"); err != nil {
		log.Fatal("Server failed to start:", err)
	}
}
