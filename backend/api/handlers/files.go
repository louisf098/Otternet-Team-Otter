package handlers

import (
	"bufio"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"os"
	"strings"

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

		//Send the file back to the requester
		_, err = io.Copy(s, file)
		if err != nil {
			log.Printf("Error sending file: %v", err)
		}
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
		r := bufio.NewReader(s)

		secretMessage, err := r.ReadString('\n')
		if err != nil {
			log.Printf("Error reading from stream: %v", err)
			return
		}

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
			if err := decoder.Decode(&files); err != nil {
				log.Printf("Error decoding JSON: %v", err)
			} else {
				if len(files) > 0 {
					returnMessage = "otternet2"
				} else {
					returnMessage = ""
				}
			}
		}

		// Send the appropriate return message back through the stream
		_, err = s.Write([]byte(returnMessage))
		if err != nil {
			log.Printf("Error sending message: %v", err)
		}
	})
}
