package main

import (
	"Otternet/backend/api/bitcoin"
	"Otternet/backend/api/dhtnode"
	"Otternet/backend/api/download"
	files "Otternet/backend/api/files"
	"Otternet/backend/api/proxy"
	"Otternet/backend/global"
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
	handlers.AllowedOrigins([]string{"*"}),
	handlers.AllowedMethods([]string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}),
	handlers.AllowedHeaders([]string{"Content-Type", "Authorization"}),
)

var (
	globalCtx       context.Context
	cancelGlobalCtx context.CancelFunc
)

type TestJSON struct {
    Name string `json:"name"`
}

func registerHandleConnectEndpoint(router *mux.Router) {
    router.HandleFunc("/connectToProxy", func(w http.ResponseWriter, r *http.Request) {
        var req struct {
            ClientAddr string `json:"clientAddr"`
        }
        if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
            http.Error(w, "Invalid request body", http.StatusBadRequest)
            return
        }

        if req.ClientAddr == "" {
            http.Error(w, "Client address is required", http.StatusBadRequest)
            return
        }

        // Authorize the client
        proxy.Mu.Lock() // Ensure thread-safe access
        proxy.AuthorizedClients[req.ClientAddr] = true
        proxy.Mu.Unlock()

        log.Printf("Client %s connected to proxy via API", req.ClientAddr)
        w.WriteHeader(http.StatusOK)
        json.NewEncoder(w).Encode(map[string]string{"message": "Client authorized successfully"})
    }).Methods("POST")
}


func baseHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "Hello World")
}

/*
Test Function
*/
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

func main() {
	var err error
	global.DHTNode, err = dhtnode.CreateLibp2pHost()
	if err != nil {
		log.Fatalf("Failed to instantiate the DHT node: %v", err)
	}
	global.DHTNode.ConnectToPeer(dhtnode.RelayNodeAddr)
	global.DHTNode.MakeReservation()
	global.DHTNode.ConnectToPeer(dhtnode.BootstrapNodeAddr)
	files.HandleFileRequests(global.DHTNode.Host)
	files.HandlePriceRequests(global.DHTNode.Host)
	go global.DHTNode.HandlePeerExchange()

	defer global.DHTNode.Close()

	// Create a cancellable context for proxy mode
	globalCtx, cancelGlobalCtx = context.WithCancel(context.Background())
	defer cancelGlobalCtx()

	r := mux.NewRouter()
	r.HandleFunc("/test", testOutput)
	r.HandleFunc("/hello/{name}", nameReader)
	r.HandleFunc("/json", jsonResponse)
	r.HandleFunc("/", baseHandler)

	// Register Bitcoin routes
	r.HandleFunc("/balance", bitcoin.GetBalanceHandler).Methods("GET")
	r.HandleFunc("/newaddress", bitcoin.GenerateAddressHandler).Methods("GET")

	// Label from address route
	r.HandleFunc("/labelfromaddress", bitcoin.GetLabelFromAddressHandler).Methods("GET")

	// Other existing routes
	r.HandleFunc("/uploadFile", files.UploadFile).Methods("POST")
	r.HandleFunc("/deleteFile/{fileHash}", files.DeleteFile).Methods("DELETE")
	r.HandleFunc("/confirmFile/{fileHash}", files.ConfirmFileinDHT).Methods("GET")
	r.HandleFunc("/getUploads", files.GetAllFiles).Methods("GET")
	r.HandleFunc("/getPrices/{fileHash}", files.GetFilePrices).Methods("GET")
	r.HandleFunc("/download", files.DownloadFile).Methods("POST")
	r.HandleFunc("/getProviders/{fileHash}", files.GetProviders).Methods("GET")
	// r.HandleFunc("/download", download.DownloadFile).Methods("POST")
	r.HandleFunc("/getDownloadHistory", download.GetDownloadHistory).Methods("GET")

	// Proxy-related routes
	r.HandleFunc("/startProxyServer", func(w http.ResponseWriter, r *http.Request) {
		type StartRequest struct {
			Port string `json:"port"`
		}
		var req StartRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Port == "" {
			http.Error(w, "Invalid port provided", http.StatusBadRequest)
			return
		}
		go func() {
			if err := proxy.StartProxyServer(req.Port); err != nil {
				log.Printf("Error starting proxy server: %v", err)
			}
		}()
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"message": "Proxy server started"})
	}).Methods("POST")

	r.HandleFunc("/fetchAvailableProxies", func(w http.ResponseWriter, r *http.Request) {
		// Use the global DHT context to fetch available proxies
		proxies, err := proxy.FetchAvailableProxies(global.DHTNode.Ctx)
		if err != nil {
			http.Error(w, fmt.Sprintf("Error fetching available proxies: %v", err), http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(proxies)
	}).Methods("GET")

	registerHandleConnectEndpoint(r)

	// r.HandleFunc("/connectToProxy", proxy.ConnectToProxy).Methods("POST")
	// r.HandleFunc("/getProxyHistory", proxy.GetProxyHistory).Methods("GET")
	// r.HandleFunc("/registerNode", proxy.RegisterNodeHandler).Methods("POST")
	// r.HandleFunc("/startProxy", proxy.StartServer).Methods("POST")
	// r.HandleFunc("/shutdownProxy", proxy.ShutdownServer).Methods("POST")
	// r.HandleFunc("/handleRequest", proxy.HandleRequest).Methods("POST")
	// r.HandleFunc("/getProxyStatus", proxy.GetStatus).Methods("GET")
	// r.HandleFunc("/getNodes", proxy.GetNodesHandler).Methods("GET")

	// // New routes for enabling/disabling proxy advertisement
	// r.HandleFunc("/startProxyMode", proxy.StartProxyModeHandler).Methods("POST")
	// r.HandleFunc("/stopProxyMode", stopProxyModeHandler).Methods("POST")

	handlerWithCORS := corsOptions(r)

	server := &http.Server{
		Addr:    ":9378", // 9378
		Handler: handlerWithCORS,
	}

	signalChan := make(chan os.Signal, 1)
	signal.Notify(signalChan, syscall.SIGTERM, syscall.SIGINT)
	shutdownComplete := make(chan bool)
	go func() {
		println("Preparing to listen on port 9378")
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("ListenAndServer error: %s\n", err)
		}
	}()

	go func() {
		sig := <-signalChan
		fmt.Printf("Received signal: %s\n", sig)
		if err := server.Shutdown(context.TODO()); err != nil {
			log.Fatalf("Error during shutdown: %v", err)
		}
		shutdownComplete <- true
	}()
	<-shutdownComplete
	log.Println("Server stopped")
}

// func startProxyModeHandler(w http.ResponseWriter, r *http.Request) {
// 	type ProxyConfig struct {
// 		IP          string  `json:"ip"`
// 		Port        string  `json:"port"`
// 		PricePerHour float64 `json:"pricePerHour"`
// 	}

// 	var config ProxyConfig
// 	if err := json.NewDecoder(r.Body).Decode(&config); err != nil {
// 		http.Error(w, "Invalid request body", http.StatusBadRequest)
// 		return
// 	}

// 	log.Printf("Starting proxy mode with config: %+v\n", config)

// 	go func() {
// 		// Start proxy here as well proxy.startProxy()
// 		err := proxy.AdvertiseSelfAsNode(globalCtx, config.IP, config.Port, config.PricePerHour)
// 		if err != nil {
// 			log.Printf("Failed to start proxy mode: %v\n", err)
// 		}
// 	}()

// 	w.WriteHeader(http.StatusOK)
// 	json.NewEncoder(w).Encode(map[string]string{"message": "Proxy mode started"})
// }

// stopping proxy mode
// func stopProxyModeHandler(w http.ResponseWriter, r *http.Request) {
// 	log.Println("Stopping proxy mode")

// 	// remove the provider from the hard coded file hash (available proxy nodes)
// 	response := struct {
//         Status int    `json:"status"` // 0 indicates failure (not available as a proxy)
//         Message string `json:"message"`
//     }{
//         Status:  0,
//         Message: "Node is no longer available as a proxy",
//     }

// 	w.WriteHeader(http.StatusOK)
// 	json.NewEncoder(w).Encode(response)

// 	log.Printf("Node removed as a proxy for hard coded file hash")
// }