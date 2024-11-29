package files

import (
	"Otternet/backend/global"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"sync"

	"github.com/gorilla/mux"
)

type FormData struct {
	UserID     string  `json:"userID"`
	Price      float64 `json:"price"`
	FileName   string  `json:"fileName"`
	FilePath   string  `json:"filePath"`
	FileSize   int64   `json:"fileSize"`
	FileType   string  `json:"fileType"`
	Timestamp  string  `json:"timestamp"`
	FileHash   string  `json:"fileHash"`
	BundleMode bool    `json:"bundleMode"`
}

var mutex = &sync.Mutex{}

const jsonFilePath = "./api/files/files.json"

// Handles uploading new file or updating existing file metadata
func UploadFile(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Invalid request method. Use POST.", http.StatusMethodNotAllowed)
		return
	}
	fmt.Println("File Upload API Hit")
	w.Header().Set("Content-Type", "application/json")
	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Error reading request body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()
	var postData FormData
	err = json.Unmarshal(body, &postData)
	if err != nil {
		http.Error(w, "Error unmarshalling request body", http.StatusBadRequest)
		return
	}

	mutex.Lock()
	defer mutex.Unlock()

	// Holds existing File metadata if JSON file exists
	var postDatas []FormData

	if _, err := os.Stat(jsonFilePath); os.IsNotExist(err) {
		fmt.Println("File does not exist")
		emptyData := []FormData{}
		firstData, err := json.MarshalIndent(emptyData, "", " ")
		if err != nil {
			http.Error(w, "Error marshalling empty file data", http.StatusInternalServerError)
			return
		}

		err = os.WriteFile(jsonFilePath, firstData, 0644) // 0644 means read/write permissions for owner, read permissions for all others
		if err != nil {
			http.Error(w, "Error writing empty file data", http.StatusInternalServerError)
			fmt.Println("Error writing empty file data")
			return
		}
	}

	existingData, err := os.ReadFile(jsonFilePath)
	if err != nil {
		http.Error(w, "Error reading existing file data", http.StatusInternalServerError)
		return
	}
	err = json.Unmarshal(existingData, &postDatas)
	if err != nil {
		http.Error(w, "Error unmarshalling existing file data", http.StatusInternalServerError)
		return
	}

	// Check if file already exists. If it does, replace it with this new entry
	found := false
	for i, data := range postDatas {
		if data.FileHash == postData.FileHash {
			postDatas[i] = postData // Replace existing file metadata with new file metadata
			found = true
			break
		}
	}
	if !found {
		// Append new file metadata to existing file metadata
		result := insertFileinDHT(postData.FileHash)
		if result == -1 {
			http.Error(w, "Error storing file in DHT", http.StatusInternalServerError)
			// return
		}
		fmt.Printf("File %s stored in DHT\n", postData.FileHash)
		postDatas = append(postDatas, postData)
	}

	newData, err := json.MarshalIndent(postDatas, "", " ")
	if err != nil {
		http.Error(w, "Error marshalling new file data", http.StatusInternalServerError)
		return
	}
	err = os.WriteFile(jsonFilePath, newData, 0644)
	if err != nil {
		http.Error(w, "Error writing new file data", http.StatusInternalServerError)
		return
	}
	response := map[string]string{"message": "File uploaded successfully", "status": "success"}
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
	fmt.Println("File Upload API Response Sent")
}

func DeleteFile(w http.ResponseWriter, r *http.Request) {
	if r.Method != "DELETE" {
		http.Error(w, "Invalid request method. Use DELETE.", http.StatusMethodNotAllowed)
		return
	}
	fmt.Println("File Delete API Hit")
	w.Header().Set("Content-Type", "application/json")
	vars := mux.Vars(r)
	fileHash, exists := vars["fileHash"]
	if !exists || fileHash == "" {
		http.Error(w, "Invalid file hash", http.StatusBadRequest)
		return
	}
	mutex.Lock()
	defer mutex.Unlock()
	existingData, err := os.ReadFile(jsonFilePath)
	if err != nil {
		http.Error(w, "Error reading existing file data", http.StatusInternalServerError)
		return
	}
	var postDatas []FormData
	err = json.Unmarshal(existingData, &postDatas)
	if err != nil {
		http.Error(w, "Error unmarshalling existing file data", http.StatusInternalServerError)
		return
	}
	found := false
	for i, data := range postDatas {
		if data.FileHash == fileHash {
			postDatas = append(postDatas[:i], postDatas[i+1:]...)
			found = true
			break
		}
	}
	if !found {
		http.Error(w, "File not found", http.StatusNotFound)
		return
	}
	newData, err := json.MarshalIndent(postDatas, "", " ")
	if err != nil {
		http.Error(w, "Error marshalling new file data", http.StatusInternalServerError)
		return
	}
	err = os.WriteFile(jsonFilePath, newData, 0644)
	if err != nil {
		http.Error(w, "Error writing new file data", http.StatusInternalServerError)
		return
	}
	response := map[string]string{"message": "File deleted successfully", "status": "success"}
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
	fmt.Println("File Delete API Response Sent")
}

func GetAllFiles(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, "Invalid request method. Use GET.", http.StatusMethodNotAllowed)
		return
	}
	fmt.Println("Get All Files API Hit")
	w.Header().Set("Content-Type", "application/json")
	mutex.Lock()
	defer mutex.Unlock()
	if _, err := os.Stat(jsonFilePath); os.IsNotExist(err) {
		http.Error(w, "No files uploaded yet", http.StatusNotFound)
		return
	}
	fileData, err := os.ReadFile(jsonFilePath)
	if err != nil {
		http.Error(w, "Error reading file data", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
	w.Write(fileData)
	fmt.Println("Get All Files API Response Sent")
}

// Confirm that file exists in DHT
func ConfirmFileinDHT(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, "Invalid request method. Use GET.", http.StatusMethodNotAllowed)
		return
	}
	fmt.Println("Confirm File in DHT API Hit")
	w.Header().Set("Content-Type", "application/json")
	vars := mux.Vars(r)
	fileHash, exists := vars["fileHash"]
	if !exists || fileHash == "" {
		http.Error(w, "Invalid file hash", http.StatusBadRequest)
		return
	}
	fmt.Printf("File Hash: %s\n", fileHash)
	value, err := global.DHTNode.GetValue(fileHash)
	if err != nil {
		http.Error(w, "File not found in DHT", http.StatusNotFound)
		return
	}

	response := map[string]string{"message": value, "status": "success"}
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

func insertFileinDHT(fileHash string) int {
	err := global.DHTNode.PutValue(fileHash, "test123")
	if err != nil {
		fmt.Printf("Failed to put record: %v\n", err)
	}
	err = global.DHTNode.ProvideKey(fileHash)
	if err != nil {
		fmt.Printf("Failed to provide key: %v\n", err)
		return -1
	}
	fmt.Printf("File %s stored successfully\n", fileHash)
	return 0
}

// can be used to set provider or reset expiration timer for provider
func setProvider(fileHash string) int {
	err := global.DHTNode.ProvideKey(fileHash)
	if err != nil {
		fmt.Printf("Failed to provide key: %v\n", err)
		return -1
	}
	fmt.Printf("File %s stored successfully\n", fileHash)
	return 0
}

// Handles downloading file metadata and file
func DownloadFile(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, "Invalid request method. Use GET.", http.StatusMethodNotAllowed)
		return
	}
	fmt.Println("File Download API Hit")

	providerID := r.PathValue("providerID")
	fileHash := r.PathValue("fileHash")

	// Connect to peer, send file hash, receive file metadata and file

	// Obtain peer info from DHT using providerID

	// Open connection to peer using fileRequest protocol

	// Send file hash to peer

	// Receive file metadata and file

	// Save file metadata to local file.json
}
