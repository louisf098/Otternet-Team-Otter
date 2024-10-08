package api

import (
	"crypto/sha256"
	"fmt"
	"io"
	"net/http"
)

// Upload file as single chunk
func UploadFile(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Invalid request method. Use POST.", http.StatusMethodNotAllowed)
		return
	}
	fmt.Println("File Upload API Hit")
	err := r.ParseMultipartForm(10 << 20) // 10 MB
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	file, handler, err := r.FormFile("file")
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	defer file.Close()

	hasher := sha256.New()
	_, err = io.Copy(hasher, file)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	hash := hasher.Sum(nil)
	fmt.Fprintf(w, "Upload %s with hash: %x", handler.Filename, hash)
	insertFileinDHT(fmt.Sprintf("%x", hash))
}

// // Upload file in chunks similar to IPFS
// func hashInChunks(file multipart.File) error {

// }

func insertFileinDHT(hashFile string) {
	// Insert file in DHT
}
