package main

import (
	"fmt"
	"log"
	"net/http"
	"path/filepath"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// Memory 模型定义
type Memory struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	Title             string  `json:"title"`
	Category          string  `json:"category"`
	Description       string  `json:"description"`
	AIPolishedStory   string  `json:"ai_polished_story"`
	Location          string  `json:"location"`
	Latitude          float64 `json:"latitude"`
	Longitude         float64 `json:"longitude"`
	Year              int     `json:"year"`
	OriginalImagePath string  `json:"original_image_path"`
	RestoredImagePath string  `json:"restored_image_path"`
	Author            string  `json:"author"`
	Tags              string  `json:"tags"` // 以逗号分隔
}

var db *gorm.DB

func initDB() {
	var err error
	db, err = gorm.Open(sqlite.Open("cultural_memory.db"), &gorm.Config{})
	if err != nil {
		log.Fatal("failed to connect database")
	}

	// 自动迁移
	db.AutoMigrate(&Memory{})
}

func main() {
	initDB()

	r := gin.Default()

	// 配置 CORS
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// API 分组
	v1 := r.Group("/api/v1")
	{
		v1.GET("/memories", getMemories)
		v1.GET("/memories/:id", getMemoryDetail)
		v1.POST("/memories", createMemory)
		v1.POST("/upload", uploadFile)
		v1.POST("/process-ai", processAIMemory)
	}

	// 静态文件服务
	r.Static("/uploads", "../client/public/uploads")

	log.Println("Server starting on http://localhost:8080...")
	r.Run(":8080")
}

func getMemories(c *gin.Context) {
	category := c.Query("category")
	var memories []Memory
	query := db.Order("created_at desc")
	if category != "" && category != "全部" {
		query = query.Where("category = ?", category)
	}
	query.Find(&memories)
	c.JSON(http.StatusOK, memories)
}

func getMemoryDetail(c *gin.Context) {
	id := c.Param("id")
	var memory Memory
	if err := db.First(&memory, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Memory not found"})
		return
	}
	c.JSON(http.StatusOK, memory)
}

func createMemory(c *gin.Context) {
	var memory Memory
	if err := c.ShouldBindJSON(&memory); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	db.Create(&memory)
	c.JSON(http.StatusCreated, memory)
}

func uploadFile(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file is received"})
		return
	}

	// 生成唯一文件名
	extension := filepath.Ext(file.Filename)
	newFileName := uuid.New().String() + extension

	// 设置保存路径
	path := filepath.Join("../client/public/uploads", newFileName)

	if err := c.SaveUploadedFile(file, path); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to save the file"})
		return
	}

	// 返回可访问的 URL
	// 注意：在前端访问时可以是 /uploads/filename
	c.JSON(http.StatusOK, gin.H{
		"url": fmt.Sprintf("/uploads/%s", newFileName),
	})
}

// 模拟 AI 处理
func processAIMemory(c *gin.Context) {
	var req struct {
		ImageURL string `json:"image_url"`
		Prompt   string `json:"prompt"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 模拟 AI 处理耗时
	time.Sleep(2 * time.Second)

	// 这里在真实场景中会调用 Python 服务或云端 API
	// 目前返回原图或预设图作为模拟
	c.JSON(http.StatusOK, gin.H{
		"restored_url":   req.ImageURL, // 模拟修复
		"polished_story": "由于 AIGC 技术的润色，您的故事现在更具诗意：在古老的巷弄里，每一块青石板都低语着往事...",
	})
}
