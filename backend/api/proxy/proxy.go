package proxy

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/gorilla/mux"
)

type ProxyData struct {
	ID        string  `json:"id"`
	IPAddr    string  `json:"ipAddr"`
	Price     float64 `json:"price"`
	Timestamp string  `json:"timestamp"`
}

var mutex = &sync.Mutex{}

var serverStarted = false
var proxyServer *http.Server
var customTransport = http.DefaultTransport

const jsonFilePath = "./api/proxy/proxy.json"

// Handles connecting to a different node's proxy. For now, we just store proxy history in a JSON file.
func ConnectToProxy(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Invalid request method. Use POST.", http.StatusMethodNotAllowed)
		return
	}
	fmt.Println("Connect to Proxy API Hit")
	w.Header().Set("Content-Type", "application/json")
	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Error reading request body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()
	var postData ProxyData
	fmt.Println("Body: ", string(body))
	err = json.Unmarshal(body, &postData)
	if err != nil {
		http.Error(w, "Error unmarshalling request body", http.StatusBadRequest)
		return
	}
	mutex.Lock()
	defer mutex.Unlock()

	var postDatas []ProxyData

	if _, err := os.Stat(jsonFilePath); os.IsNotExist(err) {
		fmt.Println("File does not exist")
		emptyData := []ProxyData{}
		firstData, err := json.MarshalIndent(emptyData, "", " ")
		if err != nil {
			http.Error(w, "Error marshalling empty data", http.StatusInternalServerError)
			return
		}
		err = os.WriteFile(jsonFilePath, firstData, 0644) // 0644 means read/write permissions for owner, read permissions for all others
		if err != nil {
			http.Error(w, "Error writing empty data", http.StatusInternalServerError)
			fmt.Println("Error writing empty data")
			return
		}
	}
	existingData, err := os.ReadFile(jsonFilePath)
	if err != nil {
		http.Error(w, "Error reading existing data", http.StatusInternalServerError)
		return
	}
	err = json.Unmarshal(existingData, &postDatas)
	if err != nil {
		http.Error(w, "Error unmarshalling existing data", http.StatusInternalServerError)
		return
	}
	postDatas = append(postDatas, postData)
	newData, err := json.MarshalIndent(postDatas, "", " ")
	if err != nil {
		http.Error(w, "Error marshalling new data", http.StatusInternalServerError)
		return
	}
	err = os.WriteFile(jsonFilePath, newData, 0644)
	if err != nil {
		http.Error(w, "Error writing new data", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(postData)
	fmt.Println("Post Data: ", postData)
	fmt.Println("Post Datas: ", postDatas)
	fmt.Println("Successfully connected to proxy")
}

// Get proxy history
func GetProxyHistory(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, "Invalid request method. Use GET.", http.StatusMethodNotAllowed)
		return
	}
	fmt.Println("Get Proxy History API Hit")
	w.Header().Set("Content-Type", "application/json")
	mutex.Lock()
	defer mutex.Unlock()
	if _, err := os.Stat(jsonFilePath); os.IsNotExist(err) {
		http.Error(w, "No proxy history found", http.StatusNotFound)
		return
	}
	existingData, err := os.ReadFile(jsonFilePath)
	if err != nil {
		http.Error(w, "Error reading existing data", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
	w.Write(existingData)
	fmt.Println("Successfully retrieved proxy history")
}

// Become a proxy server
func StartServer(w http.ResponseWriter, r *http.Request) {
	if serverStarted {
		http.Error(w, "Server already started", http.StatusBadRequest)
		return
	}

	proxyServer = &http.Server{
		Addr:    ":9138",
		Handler: http.HandlerFunc(HandleRequest),
	}

	// Start server in a goroutine so that it doesn't block the main thread
	go func() {
		err := proxyServer.ListenAndServe()
		if err != nil {
			fmt.Printf("Error starting server: %v\n", err)
			serverStarted = false
		}
	}()
	serverStarted = true
	w.WriteHeader(http.StatusOK)
	fmt.Println("Successfully started proxy server on port 9138")
}

func ShutdownServer(w http.ResponseWriter, r *http.Request) {
	if !serverStarted {
		http.Error(w, "Server not started", http.StatusBadRequest)
		return
	}
	// If server takes more than 8 seconds to shutdown, forcefully close it
	ctx, cancel := context.WithTimeout(context.Background(), 8*time.Second)
	defer cancel()

	err := proxyServer.Shutdown(ctx)
	if err != nil {
		http.Error(w, "Error shutting down server", http.StatusInternalServerError)
		return
	}
	serverStarted = false

	w.WriteHeader(http.StatusOK)
	fmt.Println("Successfully stopped proxy server")
}

func HandleRequest(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	target := vars["target"]

	targetURL := "https://" + target + r.URL.Path
	fmt.Println("Target URL: ", targetURL)

}

func GetStatus(w http.ResponseWriter, r *http.Request) {
	if serverStarted {
		w.WriteHeader(http.StatusOK)
		fmt.Println("Server is running")
	} else {
		w.WriteHeader(http.StatusServiceUnavailable)
		fmt.Println("Server is not running")
	}
}
