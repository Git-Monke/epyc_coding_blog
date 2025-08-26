package handlers

import (
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/gofiber/fiber/v3"
	"github.com/gosimple/slug"
)

func (h *Handlers) PostResource(c fiber.Ctx) error {
	postId := c.Params("postId")

	fh, err := c.FormFile("file")
	if err != nil {
		return nestErr(c, http.StatusBadRequest, "File missing: %w", err)
	}

	ext := filepath.Ext(fh.Filename)
	slug := slug.Make(strings.TrimSuffix(fh.Filename, ext))

	savePath := filepath.Join(h.Config.UploadsDir, postId, slug+ext)

	if err := os.MkdirAll(filepath.Dir(savePath), os.ModePerm); err != nil {
		return nestErr(c, http.StatusInternalServerError, "Failed to create nested dirs when uploading resource: %w", err)
	}

	openedFile, err := fh.Open()
	var fileData []byte
	_, err = openedFile.Read(fileData)
	openedFile.Close()

	if err != nil {
		return nestErr(c, http.StatusInternalServerError, "Failed to extract file data: %w", err)
	}

	if err := c.SaveFile(fh, savePath); err != nil {
		return nestErr(c, http.StatusInternalServerError, "Failed when writing new resource to file: %w", err)
	}

	return c.SendString("Recieved and saved successfully")
}

func (h *Handlers) DeleteResource(c fiber.Ctx) error {
  postId := c.Params("postId")
	filename := c.Params("resourceName")

	savePath := filepath.Join(h.Config.UploadsDir, postId, filename)

	if err := os.Remove(savePath); err != nil {
		return nestErr(c, http.StatusInternalServerError, "Failed to delete new file: %w", err)
	}

	return c.SendString("deleted successfully")
}

func (h *Handlers) ListPostResources(c fiber.Ctx) error {
	postId := c.Params("postId")
	folderPath := filepath.Join(h.Config.UploadsDir, postId)

	if _, err := os.Stat(folderPath); err != nil {
		return c.JSON(fiber.Map{"files": []string{}})
	}

	files, err := os.ReadDir(folderPath)

	if err != nil {
		return nestErr(c, http.StatusInternalServerError, "Failed reading requested dir: %w", err)
	}

	fileNames := []string{}

	for _, file := range files {
		fileNames = append(fileNames, file.Name())
	}

	return c.JSON(fileNames)
}

