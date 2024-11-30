package download

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"sync"
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

const jsonFilePath = "./api/download/downloads.json"

// Handles downloading, and adding to download history
func DownloadFile(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Invalid request method. Use POST.", http.StatusMethodNotAllowed)
		return
	}
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
			http.Error(w, "Error marshalling empty data", http.StatusInternalServerError)
			return
		}

		err = os.WriteFile(jsonFilePath, firstData, 0644)
		if err != nil {
			http.Error(w, "Error writing to file", http.StatusInternalServerError)
			return
		}
	}
	existingData, err := os.ReadFile(jsonFilePath)
	if err != nil {
		http.Error(w, "Error reading file", http.StatusInternalServerError)
		return
	}
	err = json.Unmarshal(existingData, &postDatas)
	if err != nil {
		http.Error(w, "Error unmarshalling file", http.StatusInternalServerError)
		return
	}

	postDatas = append(postDatas, postData)
	newData, err := json.MarshalIndent(postDatas, "", " ")
	if err != nil {
		http.Error(w, "Error marshalling data", http.StatusInternalServerError)
		return
	}
	err = os.WriteFile(jsonFilePath, newData, 0644)
	if err != nil {
		http.Error(w, "Error writing to file", http.StatusInternalServerError)
		return
	}
	response := map[string]string{"message": "Download Successful"}
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
	fmt.Println("Download Successful")
}

func GetDownloadHistory(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, "Invalid request method. Use GET.", http.StatusMethodNotAllowed)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	mutex.Lock()
	defer mutex.Unlock()
	if _, err := os.Stat(jsonFilePath); os.IsNotExist(err) {
		http.Error(w, "No downloads found", http.StatusNotFound)
		return
	}
	fileData, err := os.ReadFile(jsonFilePath)
	if err != nil {
		http.Error(w, "Error reading file data", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
	w.Write(fileData)
	fmt.Println("Get All Downloads API Hit")
}

// Handles adding to download history - used by download file in files.go !!!!!!
func StoreFile(postData FormData) int {
	mutex.Lock()
	defer mutex.Unlock()

	// Holds existing File metadata if JSON file exists
	var postDatas []FormData

	if _, err := os.Stat(jsonFilePath); os.IsNotExist(err) {
		fmt.Println("File does not exist")
		emptyData := []FormData{}
		firstData, err := json.MarshalIndent(emptyData, "", " ")
		if err != nil {
			fmt.Println("Error marshalling empty data")
			return -1
		}

		err = os.WriteFile(jsonFilePath, firstData, 0644)
		if err != nil {
			fmt.Println("Error writing to file")
			return -1
		}
	}
	existingData, err := os.ReadFile(jsonFilePath)
	if err != nil {
		fmt.Println("Error reading file")
		return -1
	}
	err = json.Unmarshal(existingData, &postDatas)
	if err != nil {
		fmt.Println("Error unmarshalling file")
		return -1
	}

	postDatas = append(postDatas, postData)
	newData, err := json.MarshalIndent(postDatas, "", " ")
	if err != nil {
		fmt.Println("Error marshalling data")
		return -1
	}
	err = os.WriteFile(jsonFilePath, newData, 0644)
	if err != nil {
		fmt.Println("Error writing to file")
		return -1
	}
	return 0
}
