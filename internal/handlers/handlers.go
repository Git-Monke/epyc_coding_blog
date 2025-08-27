package handlers

import (
	"fmt"

	"github.com/git-monke/epyc_coding_blog/internal/config"
	"github.com/gofiber/fiber/v3"
	"github.com/meilisearch/meilisearch-go"
)


type Handlers struct {
	Config       *config.Config
	SearchClient meilisearch.ServiceManager
}

func New(cfg *config.Config) *Handlers {
	client := meilisearch.New("http://localhost:7700")

	return &Handlers{
		Config:       cfg,
		SearchClient: client,
	}
}

func nestErr(c fiber.Ctx, statusCode int, message string, err error) error {
	return c.Status(statusCode).JSON(fiber.Map{"error": fmt.Errorf(message, err).Error()})
}

// Posts -> posts.go
// Uploads -> uploads.go
// Search -> search.go
