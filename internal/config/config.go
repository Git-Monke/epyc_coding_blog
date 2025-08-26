package config

import (
	"os"
)

type Config struct {
	UploadsDir  string
	SearchURL   string
	Environment string
	Port        string
	PageSize    int64
}

func Load() (*Config, error) {
	cfg := &Config{
		UploadsDir:  getEnv("UPLOADS_DIR", "./public"),
		SearchURL:   getEnv("SEARCH_URL", "localhost:7700"),
		Environment: getEnv("ENVIRONMENT", "dev"),
		Port:        getEnv("PORT", "760"),
		PageSize:    20,
	}

	return cfg, nil
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}

	return defaultValue
}
