package files

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

var fileRequestProtocol = protocol.ID("/otternet/fileRequest")
var priceRequestProtocol = protocol.ID("/otternet/priceRequest")

// Handles incoming file requests using a stream handler
func HandleFileRequests(h host.Host) {
	h.SetStreamHandler(fileRequestProtocol, func(s network.Stream) {
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
	h.SetStreamHandler(priceRequestProtocol, func(s network.Stream) {
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
