package handlers

import (
	"Otternet/backend/global_wallet"
	"bufio"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"os"
	"strings"
	"path/filepath"
	"strconv"

	"github.com/libp2p/go-libp2p/core/host"
	"github.com/libp2p/go-libp2p/core/network"
	"github.com/libp2p/go-libp2p/core/protocol"
)

var FileRequestProtocol = protocol.ID("/otternet/fileRequest")
var PriceRequestProtocol = protocol.ID("/otternet/priceRequest")
var CatalogRequestProtocol = protocol.ID("/otternet/catalogRequest")
var OtternetPeersProtocol = protocol.ID("/otternet/peers")

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

type WalletAddress struct {
	WalletID string `json:"walletID"`
}

// Handles incoming file requests using a stream handler
func HandleFileRequests(h host.Host) {
	h.SetStreamHandler(FileRequestProtocol, func(s network.Stream) {
		defer s.Close()

		// Read the incoming file hash from the stream
		r := bufio.NewReader(s)
		fileHash, err := r.ReadString('\n')
		if err != nil {
			log.Printf("Error reading from stream: %v", err)
		}
		fileHash = strings.TrimSpace(fileHash)

		// Check if the file hash exists in our local file.json and retrieve the file path from metadata
		metadata, err := getMetadataByHash(fileHash)
		if err != nil {
			log.Printf("Error retrieving metadata: %v", err)
			return
		}

		// Get the file from the file path in metadata
		file, err := os.Open(metadata.FilePath)
		if err != nil {
			log.Printf("Error opening file: %v", err)
		}

		// Send the file metadata back to the requester
		fmt.Printf("Sending metadata: %v\n", metadata)
		var meta []byte
		meta, err = json.Marshal(metadata)
		if err != nil {
			log.Printf("Error marshalling metadata: %v", err)
		}
		_, err = s.Write(meta)
		if err != nil {
			log.Printf("Error sending metadata: %v", err)
		}

		// Send the wallet address back to the requester

		wallet := WalletAddress{WalletID: global_wallet.WalletAddr + "\n"}
		var walletBytes []byte
		walletBytes, err = json.Marshal(wallet)
		if err != nil {
			log.Printf("Error marshalling wallet address: %v", err)
		}

		_, err = s.Write(walletBytes)
		if err != nil {
			log.Printf("Error sending wallet address: %v", err)
		}

		//Send the file back to the requester
		_, err = io.Copy(s, file)
		if err != nil {
			log.Printf("Error sending file: %v", err)
		}
			// Define file paths
		// bytesFilePath := "../files/bytesuploaded.txt"
		bytesFilePath := "./api/files/providers.txt"

		// Handle first file
		bytesFileContent, err := handleFile(bytesFilePath)
		if err != nil {
			fmt.Printf("Error handling bytes file: %v\n", err)
			return
		}
		fmt.Printf("Bytes file content: %s\n", string(bytesFileContent))
		intFileSize := int(metadata.FileSize)
		// Retrieve the values in the text file, increment those values accordingly
		newBytesUploaded, err := updateNumberWithFileSize(string(bytesFileContent), intFileSize)
		if err != nil {
			fmt.Printf("Error handling bytes file: %v\n", err)
			return
		}
		// Write the updated number back to the file
		// Overwrite the values from the integer back to the file
		err = os.WriteFile(bytesFilePath, []byte(strconv.Itoa(newBytesUploaded)), 0644)
		if err != nil {
			fmt.Printf("Error writing to file: %v\n", err)
			return
		}
		fmt.Printf("File updated successfully. New number: %d\n", newBytesUploaded)
		fmt.Printf("Reached end of file request handler\n")
	})
}

// Retrieves file metadata by file hash from local file.json
func getMetadataByHash(fileHash string) (FormData, error) {
	file, err := os.Open("./api/files/files.json")
	if err != nil {
		return FormData{}, err
	}
	defer file.Close()

	var files []FormData
	err = json.NewDecoder(file).Decode(&files)
	if err != nil {
		return FormData{}, err
	}

	for _, fileData := range files {
		if fileData.FileHash == fileHash {
			return fileData, nil
		}
	}
	return FormData{}, errors.New("file not found")
}

// Handles incoming price requests using a stream handler
func HandlePriceRequests(h host.Host) {
	h.SetStreamHandler(PriceRequestProtocol, func(s network.Stream) {
		defer s.Close()

		// Read the incoming file hash from the stream
		r := bufio.NewReader(s)
		fileHash, err := r.ReadString('\n')
		if err != nil {
			log.Printf("Error reading from stream: %v", err)
		}
		fileHash = strings.TrimSpace(fileHash)

		// Check if the file hash exists in our local file.json and retrieve the file price from metadata
		metadata, err := getMetadataByHash(fileHash)
		if err != nil {
			log.Printf("Error retrieving metadata: %v", err)
			return
		}

		// Send the file price back to the requester
		priceStr := fmt.Sprintf("%f", metadata.Price)
		_, err = s.Write([]byte(priceStr))
		if err != nil {
			log.Printf("Error sending price: %v", err)
		}
	})
}

func HandleCatalogRequests(h host.Host) {
	h.SetStreamHandler(CatalogRequestProtocol, func(s network.Stream) {
		defer s.Close()
		fmt.Print("Catalog request received\n")
		// send files.json to requester
		file, err := os.Open("./api/files/files.json")
		if err != nil {
			log.Printf("Error opening file: %v", err)
			return
		}
		walletAddr := global_wallet.WalletAddr
		var files []FormData
		err = json.NewDecoder(file).Decode(&files)
		if err != nil {
			log.Printf("Error decoding JSON: %v", err)
			return
		}

		var filteredFiles []FormData
		for _, fileData := range files {
			if fileData.WalletID == walletAddr {
				filteredFiles = append(filteredFiles, fileData)
			}
		}

		filteredData, err := json.Marshal(filteredFiles)
		if err != nil {
			log.Printf("Error marshalling filtered data: %v", err)
			return
		}

		_, err = s.Write(filteredData)
		if err != nil {
			log.Printf("Error sending filtered data: %v", err)
		}
		defer file.Close()
		_, err = io.Copy(s, file) //might not work. might need to write as bytes to stream

		if err != nil {
			log.Printf("Error sending file: %v", err)
		}
	})
}

// Handles incoming isOtternet requesets. If receive "otternet1" then send "otternet2"
func HandleOtternetPeersRequests(h host.Host) {
	h.SetStreamHandler(OtternetPeersProtocol, func(s network.Stream) {
		defer s.Close()
		walletAddr := global_wallet.WalletAddr
		r := bufio.NewReader(s)
		fmt.Printf("Otternet peers request received\n")

		secretMessage, err := r.ReadString('\n')
		if err != nil {
			log.Printf("Error reading from stream: %v", err)
			return
		}
		fmt.Printf("Secret message: %v\n", secretMessage)

		secretMessage = strings.ToLower(strings.TrimSpace(secretMessage))

		if secretMessage != "otternet1" {
			log.Printf("Invalid secret message: %v", secretMessage)
			return
		}

		returnMessage := ""

		file, err := os.Open("./api/files/files.json")
		if err != nil {
			log.Printf("Error opening files.json: %v", err)
		} else {
			defer file.Close()
			var files []FormData
			decoder := json.NewDecoder(file)
			err = decoder.Decode(&files)
			if err != nil {
				log.Printf("Error decoding JSON: %v", err)
				return
			}
			for _, fileData := range files {
				if fileData.WalletID == walletAddr {
					returnMessage = "otternet2\n"
					break
				}
			}
		}

		fmt.Printf("Generated eturn message: %v\n", returnMessage)

		// Send the appropriate return message back through the stream
		_, err = s.Write([]byte(returnMessage))
		if err != nil {
			log.Printf("Error sending message: %v", err)
		}
		fmt.Printf("Sent return message: %v\n", returnMessage)
	})
}

// Function to handle file operations
func handleFile(filePath string) ([]byte, error) {
	// Ensure the directory exists
	dir := filepath.Dir(filePath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create directories: %w", err)
	}

	// Open or create the file
	file, err := os.OpenFile(filePath, os.O_RDWR|os.O_CREATE, 0644)
	if err != nil {
		return nil, fmt.Errorf("failed to open or create file: %w", err)
	}
	defer file.Close()

	// Read the file content
	content, err := os.ReadFile(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to read file: %w", err)
	}

	fmt.Printf("File handled successfully: %s\n", file.Name())
	
	return content, nil
}

// Helper function to update a number based on file content and size
func updateNumberWithFileSize(fileContent string, fileSize int) (int, error) {
	// Step 1: Convert the file content to an integer
	number, err := strconv.Atoi(fileContent)
	if err != nil {
		return 0, fmt.Errorf("failed to convert file content to integer: %w", err)
	}

	// Step 2: Increment the number by the file size
	number += fileSize

	return number, nil
}