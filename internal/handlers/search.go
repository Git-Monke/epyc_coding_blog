package handlers

import (
	"net/http"
	"strconv"

	"github.com/meilisearch/meilisearch-go"
	"github.com/gofiber/fiber/v3"
)


func (h *Handlers) Search(c fiber.Ctx) error {
	search := c.Query("s", "")

	var page int
	var err error

  if page, err = strconv.Atoi(c.Query("p", "0")); err != nil {
		return nestErr(c, http.StatusBadRequest, "Failed to convert page # to int: %w", err)
	}

	searchRes, err := h.SearchClient.Index("posts").Search(search,
		&meilisearch.SearchRequest{
			Limit:                h.Config.PageSize,
			Offset:               int64(page) * h.Config.PageSize,
			AttributesToRetrieve: []string{"id", "title", "tags", "description"},
		})

	if err != nil {
		return nestErr(c, http.StatusInternalServerError, "Failed to perform search: %w", err)
	}

	return c.JSON(fiber.Map{
		"hits": searchRes.Hits,
		"totalPages": (searchRes.EstimatedTotalHits / h.Config.PageSize) + 1,
		"processingTimeMs": searchRes.ProcessingTimeMs,
		"query": search,
	})
}
