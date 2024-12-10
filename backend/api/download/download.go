package download

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"sync"

	"github.com/gorilla/mux"
)

type FormData struct {
	WalletID   string  `json:"walletID"`
	SrcID      string  `json:"srcID"`
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
	vars := mux.Vars(r)
	walletAddr, exists := vars["walletAddr"]
	if !exists || walletAddr == "" {
		http.Error(w, "Invalid wallet address", http.StatusBadRequest)
		return
	}
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
	var postDatas []FormData
	err = json.Unmarshal(fileData, &postDatas)
	if err != nil {
		http.Error(w, "Error unmarshalling file data", http.StatusInternalServerError)
		return
	}
	var filteredData []FormData
	for _, data := range postDatas {
		fmt.Printf("WalletID: %s\n", data.WalletID)
		fmt.Printf("WalletAddr: %s\n", walletAddr)
		fmt.Printf("Data: %v\n", data)
		if data.WalletID == walletAddr {
			fmt.Print("HI\n")
			filteredData = append(filteredData, data)
		}
	}
	if len(filteredData) == 0 {
		http.Error(w, "No downloads found for the given wallet address", http.StatusNotFound)
		return
	}
	responseData, err := json.MarshalIndent(filteredData, "", " ")
	if err != nil {
		http.Error(w, "Error marshalling filtered data", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
	w.Write(responseData)
	fmt.Println("Get All Downloads API Hit")
}
