package files

import (
	"Otternet/backend/api/download"
	"Otternet/backend/api/handlers"
	"Otternet/backend/global"
	"bufio"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

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

type CatalogItem struct {
	FileName   string  `json:"fileName"`
	FileHash   string  `json:"fileHash"`
	FileType   string  `json:"fileType"`
	Price      float64 `json:"price"`
	BundleMode bool    `json:"bundleMode"`
	Timestamp  string  `json:"timestamp"`
}

type ProviderList struct {
	List []string `json:"list"`
}

var mutex = &sync.Mutex{}
var mutex2 = &sync.Mutex{}

const (
	jsonFilePath      = "./api/files/files.json"
	providersFilePath = "./api/files/providers.txt"
	maxProviders      = 50
	popAmount         = 5 // number of oldest providers to remove from cache when maxProviders is reached
)

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
	w.Header().Set("Content-Type", "application/json")
	vars := mux.Vars(r)
	walletAddr := vars["walletAddr"]
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
	var postDatas []FormData
	err = json.Unmarshal(fileData, &postDatas)
	if err != nil {
		http.Error(w, "Error unmarshalling file data", http.StatusInternalServerError)
		return
	}
	var filteredData []FormData
	for _, data := range postDatas {
		if data.WalletID == walletAddr {
			filteredData = append(filteredData, data)
		}
	}
	if len(filteredData) == 0 {
		http.Error(w, "No files found for the given wallet address", http.StatusNotFound)
		return
	}
	responseData, err := json.MarshalIndent(filteredData, "", " ")
	if err != nil {
		http.Error(w, "Error marshalling filtered file data", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
	w.Write(responseData)
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
	w.Header().Set("Content-Type", "application/json")

	vars := mux.Vars(r)

	// get file hash from request
	fileHash, exists := vars["fileHash"]
	if !exists || fileHash == "" {
		http.Error(w, "No file hash provided", http.StatusBadRequest)
		return
	}
	fmt.Printf("Searching Providers of File Hash: %s\n", fileHash)

	providers, err := global.DHTNode.FindProviders(fileHash)
	if err != nil {
		http.Error(w, "Error finding providers", http.StatusInternalServerError)
		return
	}

	var providerIDs []string
	for _, provider := range providers {
		providerIDs = append(providerIDs, provider.ID.String())
	}
	fmt.Printf("Found Provider(s): %v\n", providerIDs)

	prices := make(map[string]float64)
	for _, provider := range providers {
		// open stream to provider using priceRequest protocol
		stream, err := global.DHTNode.Host.NewStream(global.DHTNode.Ctx, provider.ID, handlers.PriceRequestProtocol)
		if err != nil {
			fmt.Printf("Error opening stream: %v\n", err)
			continue
		}
		fmt.Printf("Connected to provider %s\n", provider.ID.String())

		// send file hash to provider
		_, err = stream.Write([]byte(fileHash + "\n"))
		if err != nil {
			fmt.Printf("Error sending file hash: %v\n", err)
			continue
		}
		defer stream.Close()

		// provider will send price back in byte form - ensure it is decoded correctly into float64
		decoder := json.NewDecoder(stream)

		var price float64
		err = decoder.Decode(&price)
		if err != nil {
			fmt.Printf("Error decoding price: %v\n", err)
			continue
		}

		fmt.Printf("File priced at %f OTTC from provider %s\n", price, provider.ID.String())

		// AppendProviderID(provider.ID.String()) // doing this caused context deadline exceeded error. Will need to make another route just to append provider IDs

		prices[provider.ID.String()] = price
	}

	// send map of providers with prices back
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(prices)
}

func AppendProviderIDs(providerIDs []string) error {
	mutex2.Lock()
	defer mutex2.Unlock()
	// append and read-write to providers.txt. create if it doesn't exist
	fmt.Printf("Appending %d provider IDs to cache\n", len(providerIDs))
	fmt.Printf("Providers: %v\n", providerIDs)
	providerList, providerSet, err := readProviders()
	if err != nil {
		fmt.Printf("Provider file not found. Creating new file\n")
		providerList = &ProviderList{List: []string{}}
		providerSet = make(map[string]struct{})
	}

	fmt.Printf("REACHED AFTER READPROVIDERS\n")

	for _, providerID := range providerIDs {
		if _, exists := providerSet[providerID]; !exists {
			providerList.List = append(providerList.List, providerID)
			providerSet[providerID] = struct{}{}
		}
	}

	fmt.Printf("REACHED AFTER LOOP\n")

	if len(providerList.List) > maxProviders {
		providerList.List = providerList.List[popAmount:]
	}
	err = writeProviders(providerList.List)
	if err != nil {
		return fmt.Errorf("error writing provider IDs: %w", err)
	}
	return nil
}

// creates temp file, writes provider IDs to it, then renames it to providers.txt (for atomicity)
func writeProviders(providers []string) error {
	fmt.Printf("Writing %d provider IDs to file\n", len(providers))
	fmt.Printf("Providers: %v\n", providers)
	dir := filepath.Dir(providersFilePath)
	err := os.MkdirAll(dir, 0755)
	if err != nil {
		return fmt.Errorf("error creating providers directory: %w", err)
	}

	tempFile, err := os.CreateTemp(dir, "providers_*.txt")
	if err != nil {
		return fmt.Errorf("error creating temporary providers file: %w", err)
	}
	tempFilePath := tempFile.Name()

	writer := bufio.NewWriter(tempFile)
	for _, provider := range providers {
		_, err := writer.WriteString(provider + "\n")
		if err != nil {
			tempFile.Close()
			os.Remove(tempFilePath)
			return fmt.Errorf("error writing provider ID: %w", err)
		}
	}
	err = writer.Flush()
	if err != nil {
		tempFile.Close()
		os.Remove(tempFilePath)
		return fmt.Errorf("error flushing writer: %w", err)
	}
	tempFile.Close()
	if err != nil {
		os.Remove(tempFilePath)
		return fmt.Errorf("error closing temporary providers file: %w", err)
	}
	err = os.Rename(tempFilePath, providersFilePath)
	if err != nil {
		return fmt.Errorf("error renaming temporary providers file: %w", err)
	}
	return nil
}

// Returns list of provider IDs and a set of provider IDs
func readProviders() (*ProviderList, map[string]struct{}, error) {
	file, err := os.Open(providersFilePath)
	if err != nil {
		return nil, nil, fmt.Errorf("error opening providers file: %w", err)
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	providerList := &ProviderList{List: []string{}}
	providerSet := make(map[string]struct{})

	for scanner.Scan() {
		line := scanner.Text()
		if line != "" {
			providerList.List = append(providerList.List, line)
			providerSet[line] = struct{}{}
		}
	}
	if err := scanner.Err(); err != nil {
		return nil, nil, fmt.Errorf("error reading providers file: %w", err)
	}
	return providerList, providerSet, nil
}

func PutPeersInCache(w http.ResponseWriter, r *http.Request) {
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
	var peerIDs ProviderList
	err = json.Unmarshal(body, &peerIDs)
	if err != nil {
		http.Error(w, "Error unmarshalling request body", http.StatusBadRequest)
		return
	}
	peerInfos := []string{}
	for _, peerID := range peerIDs.List {
		peerInfo, err := peer.Decode(peerID)
		if err != nil {
			http.Error(w, "Invalid peer ID", http.StatusBadRequest)
			return
		}
		peerInfos = append(peerInfos, peerInfo.String())
	}

	AppendProviderIDs(peerInfos)
	fmt.Printf("Peers added to cache: %v\n", peerInfos)

	response := map[string]string{"message": "Peers added to cache successfully", "status": "success"}
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// Handles downloading file metadata and file
func DownloadFile(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Invalid request method. Use POST.", http.StatusMethodNotAllowed)
		return
	}
	w.Header().Set("Content-Type", "application/json")

	// get details from request
	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Error reading request body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()
	var postData = struct {
		WalletID     string `json:"walletID"`
		ProviderID   string `json:"providerID"`
		DownloadPath string `json:"downloadPath"`
		FileHash     string `json:"fileHash"`
	}{}
	err = json.Unmarshal(body, &postData)
	if err != nil {
		http.Error(w, "Error unmarshalling request body", http.StatusBadRequest)
		return
	}

	walletID := postData.WalletID
	providerID := postData.ProviderID
	downloadPath := postData.DownloadPath
	fileHash := postData.FileHash

	// Obtain peer info from DHT using providerID
	peerID, err := peer.Decode(providerID)
	if err != nil {
		http.Error(w, "Invalid provider ID", http.StatusBadRequest)
		return
	}

	peerInfo, err := global.DHTNode.DHT.FindPeer(global.DHTNode.Ctx, peerID)
	if err != nil {
		fmt.Printf("Error finding peer: %v\n", err)
		return
	}

	// Open connection to peer using fileRequest protocol - consider using connect function from dht.go
	stream, err := global.DHTNode.Host.NewStream(global.DHTNode.Ctx, peerInfo.ID, handlers.FileRequestProtocol)
	if err != nil {
		fmt.Printf("Error opening stream: %v\n", err)
		return
	}
	defer stream.Close()

	fmt.Printf("Connected to provider %s\n", providerID)

	// Send file hash to peer
	_, err = stream.Write([]byte(fileHash + "\n"))
	if err != nil {
		fmt.Printf("Error sending file hash: %v\n", err)
		return
	}

	fmt.Println("Sending the File Hash to Provider")

	// Receive file metadata from peer
	decoder := json.NewDecoder(stream)
	var metadata FormData
	err = decoder.Decode(&metadata)
	if err != nil {
		fmt.Printf("Error decoding metadata: %v\n", err)
		return
	}

	fmt.Printf("Received metadata: %v\n", metadata)

	// Download file from peer

	fmt.Println("Creating the File in Download Location")
	fmt.Println("Download Path: ", downloadPath)
	fmt.Println("File Name: ", metadata.FileName)

	file, err := os.Create(downloadPath + "/" + metadata.FileName)
	if err != nil {
		fmt.Printf("Error creating file: %v\n", err)
		return
	}

	fmt.Println("Downloading in Progress")

	_, err = io.Copy(file, stream)
	if err != nil {
		fmt.Printf("Error copying file: %v\n", err)
		return
	}
	defer file.Close()

	fmt.Println("File Downloaded Successfully")

	// Save file metadata to local file.json
	downloadedFile := FormData{
		WalletID:   walletID,
		SrcID:      providerID,
		Price:      metadata.Price,
		FileName:   metadata.FileName,
		FilePath:   downloadPath,
		FileSize:   metadata.FileSize,
		FileType:   metadata.FileType,
		Timestamp:  time.Now().Format(time.RFC3339),
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
}

// Obtains the catalog of files from providerID
func GetCatalog(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, "Invalid request method. Use GET.", http.StatusMethodNotAllowed)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	vars := mux.Vars(r)
	providerID, exists := vars["providerID"]
	if !exists || providerID == "" {
		http.Error(w, "Invalid or Incorrect provider ID", http.StatusBadRequest)
		return
	}
	fmt.Printf("Provider ID: %s\n", providerID)
	peerID, err := peer.Decode(providerID)
	if err != nil {
		http.Error(w, "Invalid provider ID", http.StatusBadRequest)
		return
	}
	peerInfo, err := global.DHTNode.DHT.FindPeer(global.DHTNode.Ctx, peerID)
	if err != nil {
		http.Error(w, "Error finding peer", http.StatusInternalServerError)
		return
	}
	stream, err := global.DHTNode.Host.NewStream(global.DHTNode.Ctx, peerInfo.ID, handlers.CatalogRequestProtocol)
	if err != nil {
		http.Error(w, "Error opening stream: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer stream.Close()
	fmt.Printf("Connected to provider %s\n", providerID)
	// send anything using catalogRequestProtocol to get attention
	_, err = stream.Write([]byte("catalog\n"))
	if err != nil {
		http.Error(w, "Error sending request", http.StatusInternalServerError)
		return
	}
	// receive files.json and convert into list of catalog items
	decoder := json.NewDecoder(stream)
	var catalog []CatalogItem
	err = decoder.Decode(&catalog)
	if err != nil {
		http.Error(w, "Error decoding catalog", http.StatusInternalServerError)
		return
	}
	fmt.Printf("Received catalog: %v\n", catalog)
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(catalog)
}

func GetOtternetPeers(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, "Invalid request method. Use GET.", http.StatusMethodNotAllowed)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	providerIDs, _, err := readProviders()
	if err != nil {
		http.Error(w, "Error reading providers file", http.StatusInternalServerError)
		return
	}
	returnIDs := make([]string, 0)
	for _, peerID := range providerIDs.List {
		peerID_, err := peer.Decode(peerID)
		if err != nil {
			fmt.Printf("Error decoding peer ID: %v\n", err)
			continue
		}
		stream, err := global.DHTNode.Host.NewStream(global.DHTNode.Ctx, peerID_, handlers.OtternetPeersProtocol)
		if err != nil {
			fmt.Printf("Error opening stream: %v\n", err)
			continue
		}
		defer stream.Close()
		_, err = stream.Write([]byte("otternet1\n"))
		if err != nil {
			fmt.Printf("Error sending secret message: %v\n", err)
			continue
		}
		r := bufio.NewReader(stream)
		secretMessage, err := r.ReadString('\n')
		if err != nil {
			fmt.Printf("Error reading from stream: %v\n", err)
			continue
		}
		secretMessage = strings.ToLower(strings.TrimSpace(secretMessage))
		if secretMessage == "otternet2" {
			fmt.Printf("Peer %s is an otternet peer\n", peerID)
			returnIDs = append(returnIDs, peerID)
		}
	}
	response := returnIDs
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// Gets the goods from peerstore
func GetPeers(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, "Invalid request method. Use GET.", http.StatusMethodNotAllowed)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	peers := global.DHTNode.Host.Peerstore().Peers()
	var peerIDs []string
	for _, peer := range peers {
		peerIDs = append(peerIDs, peer.String())
	}
	response := map[string][]string{"peers": peerIDs}
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

func GetClosestPeers(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, "Invalid request method. Use GET.", http.StatusMethodNotAllowed)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	// get own peer ID and use as key for GetClosestPeers as string
	peerID := global.DHTNode.Host.ID()
	fmt.Printf("My Own Peer ID: %s\n", peerID.String())
	peers, err := global.DHTNode.GetClosestPeers(peerID.String())
	if err != nil {
		http.Error(w, "Error getting closest peers", http.StatusInternalServerError)
		return
	}
	var peerIDs []string
	for _, peer := range peers {
		peerIDs = append(peerIDs, peer.String())
	}
	response := map[string][]string{"peers": peerIDs}
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}
