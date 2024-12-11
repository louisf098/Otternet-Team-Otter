package statistics

import (
	"fmt"
	"os"
	"strconv"
)

// Get bytes fro man uploaded file
func getBytesUploadedFromFile(filePath string) (int, error) {
	// Read the file content
	content, err := os.ReadFile(filePath)
	if err != nil {
		return 0, fmt.Errorf("failed to read file: %w", err)
	}

	// Trim whitespace and convert to an integer
	number, err := strconv.Atoi(string(content))
	if err != nil {
		return 0, fmt.Errorf("failed to convert file content to integer: %w", err)
	}

	return number, nil
}