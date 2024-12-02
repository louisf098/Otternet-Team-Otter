package main

import (
	"Otternet/backend/api/bitcoin"
	"Otternet/backend/api/download"
	files "Otternet/backend/api/files"
	"Otternet/backend/api/proxy"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
)

var corsOptions = handlers.CORS(
	handlers.AllowedOrigins([]string{"*"}), // Update as needed
	handlers.AllowedMethods([]string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}),
	handlers.AllowedHeaders([]string{"Content-Type", "Authorization"}),
)

// Global context for managing proxy mode
var (
	globalCtx       context.Context
	cancelGlobalCtx context.CancelFunc
)

func main() {
	// Create a cancellable context for proxy mode
	globalCtx, cancelGlobalCtx = context.WithCancel(context.Background())
	defer cancelGlobalCtx()

	// Create router and register routes
	r := mux.NewRouter()
	r.HandleFunc("/test", testOutput)
	r.HandleFunc("/hello/{name}", nameReader)
	r.HandleFunc("/json", jsonResponse)
	r.HandleFunc("/", baseHandler)

	// Bitcoin-related routes
	r.HandleFunc("/balance", bitcoin.GetBalanceHandler).Methods("GET")
	r.HandleFunc("/newaddress", bitcoin.GenerateAddressHandler).Methods("GET")

	// File sharing routes
	r.HandleFunc("/uploadFile", files.UploadFile).Methods("POST")
	r.HandleFunc("/deleteFile/{fileHash}", files.DeleteFile).Methods("DELETE")
	r.HandleFunc("/getUploads", files.GetAllFiles).Methods("GET")
	r.HandleFunc("/download", download.DownloadFile).Methods("POST")
	r.HandleFunc("/getDownloadHistory", download.GetDownloadHistory).Methods("GET")

	// Proxy-related routes
	r.HandleFunc("/connectToProxy", proxy.ConnectToProxy).Methods("POST")
	r.HandleFunc("/getProxyHistory", proxy.GetProxyHistory).Methods("GET")
	r.HandleFunc("/registerNode", proxy.RegisterNodeHandler).Methods("POST")
	r.HandleFunc("/startProxy", proxy.StartServer).Methods("POST")
	r.HandleFunc("/shutdownProxy", proxy.ShutdownServer).Methods("POST")
	r.HandleFunc("/handleRequest", proxy.HandleRequest).Methods("POST")
	r.HandleFunc("/getProxyStatus", proxy.GetStatus).Methods("GET")
	r.HandleFunc("/getNodes", proxy.GetNodesHandler).Methods("GET")

	// New routes for enabling/disabling proxy advertisement
	r.HandleFunc("/startProxyMode", startProxyModeHandler).Methods("POST")
	r.HandleFunc("/stopProxyMode", stopProxyModeHandler).Methods("POST")

	// Set up the server
	server := &http.Server{
		Addr:    ":9378",
		Handler: corsOptions(r),
	}

	// Graceful shutdown logic
	signalChan := make(chan os.Signal, 1)
	signal.Notify(signalChan, syscall.SIGTERM, syscall.SIGINT)

	go func() {
		sig := <-signalChan
		fmt.Printf("Received signal: %s. Shutting down...\n", sig)
		cancelGlobalCtx()
		if err := server.Close(); err != nil {
			log.Fatalf("Error shutting down server: %v", err)
		}
	}()

	// Start the server
	fmt.Println("Server started on port 9378")
	log.Fatal(server.ListenAndServe())
}

// Handler for starting proxy mode
func startProxyModeHandler(w http.ResponseWriter, r *http.Request) {
	type ProxyConfig struct {
		IP          string  `json:"ip"`
		Port        string  `json:"port"`
		PricePerHour float64 `json:"pricePerHour"`
	}

	var config ProxyConfig
	if err := json.NewDecoder(r.Body).Decode(&config); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	log.Printf("Starting proxy mode with config: %+v\n", config)

	go func() {
		err := proxy.AdvertiseSelfAsNode(globalCtx, config.IP, config.Port, config.PricePerHour)
		if err != nil {
			log.Printf("Failed to start proxy mode: %v\n", err)
		}
	}()

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Proxy mode started"})
}

// Handler for stopping proxy mode
func stopProxyModeHandler(w http.ResponseWriter, r *http.Request) {
	log.Println("Stopping proxy mode...")
	cancelGlobalCtx()
	globalCtx, cancelGlobalCtx = context.WithCancel(context.Background()) // Reset the context

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Proxy mode stopped"})
}

// Helper Functions

func baseHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "Hello World")
}

func testOutput(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET":
		fmt.Fprintf(w, "GET")
	case "POST":
		fmt.Fprintf(w, "POST")
	default:
		http.Error(w, "Invalid request method.", http.StatusMethodNotAllowed)
	}
}

func nameReader(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	name := vars["name"]
	fmt.Fprintf(w, "Hello %s!\n", name)
}

func jsonResponse(w http.ResponseWriter, r *http.Request) {
	type TestJSON struct {
		Name string `json:"name"`
	}
	test := TestJSON{Name: "Test"}
	json.NewEncoder(w).Encode(test)
}
