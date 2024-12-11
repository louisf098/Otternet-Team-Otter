package statistics

import (
	"encoding/json"
	"fmt"
	"net/http"
)

func GetBytesUploadedHandler(w http.ResponseWriter, r *http.Request) {
	// Call helper function to get bytes uploaded from file
	bytesUploaded, err := getBytesUploadedFromFile("bytes_uploaded.txt")
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to retrieve bytes uploaded: %v", err), http.StatusInternalServerError)
		return
	}

	// Create a response payload
	response := map[string]interface{}{
		"bytesUploaded": bytesUploaded,
	}

	// Set headers and write response as JSON
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(response); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
	}
}