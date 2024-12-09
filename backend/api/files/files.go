package files

import (
	"Otternet/backend/api/download"
	"Otternet/backend/global"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"sync"

	"github.com/gorilla/mux"
	"github.com/libp2p/go-libp2p/core/peer"
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

func GetProviders(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, "Invalid request method. Use GET.", http.StatusMethodNotAllowed)
		return
	}
	fmt.Println("Get Providers API Hit")
	w.Header().Set("Content-Type", "application/json")
	vars := mux.Vars(r)
	fileHash, exists := vars["fileHash"]
	if !exists || fileHash == "" {
		http.Error(w, "Invalid file hash", http.StatusBadRequest)
		return
	}
	fmt.Printf("File Hash: %s\n", fileHash)
	providers, err := global.DHTNode.FindProviders(fileHash)
	if err != nil {
		http.Error(w, "Error finding providers", http.StatusInternalServerError)
		return
	}
	var providerIDs []string
	for _, provider := range providers {
		providerIDs = append(providerIDs, provider.ID.String())
	}
	response := map[string][]string{"providers": providerIDs}
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
	fmt.Println("Get Providers API Response Sent")
}

// Call FindProviders from dht.go to get list of providers, iterate through list of providers and send a ping to each provider
// Receive price from each provider and store in a map, return map of providers with prices
func GetFilePrices(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, "Invalid request method. Use GET.", http.StatusMethodNotAllowed)
		return
	}
	fmt.Println("Get File Prices API Hit")
	w.Header().Set("Content-Type", "application/json")

	vars := mux.Vars(r)

	// get file hash from request
	fileHash, exists := vars["fileHash"]
	if !exists || fileHash == "" {
		http.Error(w, "No file hash provided", http.StatusBadRequest)
		return
	}
	fmt.Printf("File Hash: %s\n", fileHash)

	providers, err := global.DHTNode.FindProviders(fileHash)
	if err != nil {
		http.Error(w, "Error finding providers", http.StatusInternalServerError)
		return
	}
	fmt.Printf("Found Provider(s): %v\n", providers)

	prices := make(map[string]float64)
	for _, provider := range providers {
		stream, err := global.DHTNode.Host.NewStream(global.DHTNode.Ctx, provider.ID, priceRequestProtocol)
		if err != nil {
			fmt.Printf("Error opening stream: %v\n", err)
			continue
		}
		defer stream.Close()

		// send file hash to provider
		_, err = stream.Write([]byte(fileHash + "\n"))
		if err != nil {
			fmt.Printf("Error sending file hash: %v\n", err)
			continue
		}

		// provider will send price back in byte form - ensure it is decoded correctly into float64
		decoder := json.NewDecoder(stream)
		var price float64
		err = decoder.Decode(&price)
		if err != nil {
			fmt.Printf("Error decoding price: %v\n", err)
			continue
		}

		prices[provider.ID.String()] = price
	}

	// send map of providers with prices back
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(prices)
	fmt.Println("Get File Prices API Response Sent")
}

// Handles downloading file metadata and file
func DownloadFile(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Invalid request method. Use POST.", http.StatusMethodNotAllowed)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	fmt.Println("File Download API Hit")

	// get details from request
	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Error reading request body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()
	var postData = struct {
		ProviderID   string `json:"providerID"`
		DownloadPath string `json:"downloadPath"`
		FileHash     string `json:"fileHash"`
	}{}
	err = json.Unmarshal(body, &postData)
	if err != nil {
		http.Error(w, "Error unmarshalling request body", http.StatusBadRequest)
		return
	}

	providerID := postData.ProviderID
	downloadPath := postData.DownloadPath
	fileHash := postData.FileHash

	// make sure peerID is valid
	peerID := peer.ID(providerID)
	fmt.Printf("Peer ID: %s\n", peerID)

	// Obtain peer info from DHT using providerID
	peerInfo, err := global.DHTNode.DHT.FindPeer(global.DHTNode.Ctx, peerID)
	if err != nil {
		fmt.Printf("Error finding peer: %v\n", err)
		return
	}

	// Open connection to peer using fileRequest protocol - consider using connect function from dht.go
	stream, err := global.DHTNode.Host.NewStream(global.DHTNode.Ctx, peerInfo.ID, fileRequestProtocol)
	if err != nil {
		fmt.Printf("Error opening stream: %v\n", err)
		return
	}
	defer stream.Close()

	// Send file hash to peer
	_, err = stream.Write([]byte(fileHash + "\n"))
	if err != nil {
		fmt.Printf("Error sending file hash: %v\n", err)
		return
	}

	// Receive file metadata from peer
	decoder := json.NewDecoder(stream)
	var metadata FormData
	err = decoder.Decode(&metadata)
	if err != nil {
		fmt.Printf("Error decoding metadata: %v\n", err)
		return
	}

	// Download file from peer
	file, err := os.Create(downloadPath)
	if err != nil {
		fmt.Printf("Error creating file: %v\n", err)
		return
	}

	_, err = io.Copy(file, stream)
	if err != nil {
		fmt.Printf("Error copying file: %v\n", err)
		return
	}
	file.Close()
	fmt.Println("File Downloaded Successfully")

	// Save file metadata to local file.json
	downloadedFile := FormData{
		UserID:     providerID,
		Price:      metadata.Price,
		FileName:   metadata.FileName,
		FilePath:   downloadPath,
		FileSize:   metadata.FileSize,
		FileType:   metadata.FileType,
		Timestamp:  metadata.Timestamp,
		FileHash:   fileHash,
		BundleMode: metadata.BundleMode,
	}

	res := download.StoreFile(download.FormData(downloadedFile)) // ???!!!
	if res != 0 {
		http.Error(w, "Error storing file in downloads.json", http.StatusInternalServerError)
		return
	}

	response := map[string]string{"message": "File downloaded successfully", "status": "success"}
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
	fmt.Println("File Download API Response Sent")
}
