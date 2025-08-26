package server

import (
	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/static"
)

func New() *fiber.App {
	app := fiber.New()

	app.Get("/public/*", static.New("./public"))

	app.Get("/health", func(c fiber.Ctx) error {
		return c.SendString("ok")
	})

	return app
}
