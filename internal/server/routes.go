package server

import (
	"github.com/gofiber/fiber/v3"
)

type Handlers interface {
	GetPost(fiber.Ctx) error
	PostPost(fiber.Ctx) error
	DeletePost(fiber.Ctx) error

	PostResource(fiber.Ctx) error
	ListPostResources(fiber.Ctx) error
	DeleteResource(fiber.Ctx) error

	Search(fiber.Ctx) error
}

func RegisterRoutes(app *fiber.App, h Handlers) {
	app.Post("/posts", h.PostPost)
	app.Get("/posts/:postId", h.GetPost)
	app.Delete("/posts/:postId", h.DeletePost)

	app.Post("/uploads/:postId", h.PostResource)
	app.Delete("/uploads/:postId/:resourceName", h.DeleteResource)
	app.Get("/uploads/:postId", h.ListPostResources)

	// In order to get all posts, just use an empty search
	app.Get("/search", h.Search)
}
