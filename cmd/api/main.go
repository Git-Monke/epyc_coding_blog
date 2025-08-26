package main

import (
	"log"

	"github.com/git-monke/epyc_coding_blog/internal/config"
	"github.com/git-monke/epyc_coding_blog/internal/handlers"
	"github.com/git-monke/epyc_coding_blog/internal/server"
)

func main() {
	app := server.New()

	cfg, err := config.Load()

	if err != nil {
		log.Fatal(err.Error())
	}

	server.RegisterRoutes(app, handlers.New(cfg))
	log.Fatal(app.Listen(":760"))
}
