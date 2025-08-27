package server

import (
	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/static"
	"github.com/gofiber/fiber/v3/middleware/cors"
)

func New() *fiber.App {
	app := fiber.New()

	app.Get("/public/*", static.New("./public"))

	app.Use(cors.New())

	app.Get("/health", func(c fiber.Ctx) error {
		return c.SendString("ok")
	})

	return app
}
