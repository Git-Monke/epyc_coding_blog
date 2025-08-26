package handlers

import (
	"github.com/gofiber/fiber/v3"
	"github.com/meilisearch/meilisearch-go"
	"net/http"
	"github.com/google/uuid"
)

func (h *Handlers) GetPost(c fiber.Ctx) error {
	postId := c.Params("postId")
	var content string

	err := h.SearchClient.Index("posts").GetDocument(postId, &meilisearch.DocumentQuery{
		Fields: []string{"content"},
	}, content)

	if err != nil {
		return nestErr(c, http.StatusNotFound, "Failed to find document: %w", err)
	}

	return c.JSON(fiber.Map{
		content: content,
	})
}

// ---

func (h *Handlers) DeletePost(c fiber.Ctx) error {
	postId := c.Params("postId")

	task, err := h.SearchClient.Index("posts").DeleteDocument(postId)

	if err != nil {
		nestErr(c, http.StatusInternalServerError, "Failed to delete document: %w", err)
	}

	return c.JSON(fiber.Map{"taskId": task.TaskUID, "postId": postId})
}

// ---

func (h *Handlers) PostPost(c fiber.Ctx) error {
	var post Post

	if err := c.Bind().JSON(&post); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid JSON"})
	}

	if post.Id == "" {
		post.Id = uuid.NewString()
	}

	index := h.SearchClient.Index("posts")

	primaryKey := "id"
	task, err := index.AddDocuments([]Post{post}, &primaryKey)

	if err != nil {
		nestErr(c, http.StatusInternalServerError, "Failed to add document: %w", err)
	}

	return c.JSON(fiber.Map{"taskId": task.TaskUID, "postId": post.Id})
}

