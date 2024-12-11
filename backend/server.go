package main

import (
	"Otternet/backend/api/bitcoin"
	dhtHandlers "Otternet/backend/api/dht_handlers"
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
	r := mux.NewRouter()
	r.HandleFunc("/test", testOutput)
	r.HandleFunc("/hello/{name}", nameReader)
	r.HandleFunc("/json", jsonResponse)
	r.HandleFunc("/", baseHandler)

	r.HandleFunc("/createwallet/{walletName}", bitcoin.GenerateWalletHandler).Methods("GET")
	r.HandleFunc("/createwalletandaddress/{walletName}/{passphrase}", bitcoin.CreateWalletAndAddressHandler).Methods("GET")
	r.HandleFunc("/unlockwallet/{address}/{passphrase}", bitcoin.UnlockWalletHandler).Methods("GET")
	r.HandleFunc("/lockwallet/{walletName}", bitcoin.LockWalletHandler).Methods("GET")

	// Register Bitcoin routes
	r.HandleFunc("/newaddress/{walletName}", bitcoin.GenerateAddressHandler).Methods("GET")
	r.HandleFunc("/newaddress/{walletName}/{label}", bitcoin.GenerateAddressWithLabelHandler).Methods("GET")

	r.HandleFunc("/getbalance/{walletName}", bitcoin.GetBalanceHandler).Methods("GET")

	r.HandleFunc("/minecoins/{address}/{amount}", bitcoin.MineCoinsHandler).Methods("GET")

	// Label from address route
	r.HandleFunc("/labelfromaddress/{walletName}/{address}", bitcoin.GetLabelFromAddressHandler).Methods("GET")

	r.HandleFunc("/gettransactions/{walletName}", bitcoin.GetTransactionsHandler).Methods("GET")
	// Coin transaction route
	r.HandleFunc("/transferCoins/{walletName}/{toAddress}/{amount}/{label}", bitcoin.TransferCoinsHandler).Methods("POST")

	// Other existing routes
	r.HandleFunc("/uploadFile", files.UploadFile).Methods("POST")
	r.HandleFunc("/deleteFile/{fileHash}", files.DeleteFile).Methods("DELETE")
	r.HandleFunc("/confirmFile/{fileHash}", files.ConfirmFileinDHT).Methods("GET")
	r.HandleFunc("/getUploads/{walletAddr}", files.GetAllFiles).Methods("GET")
	r.HandleFunc("/getPrices/{fileHash}", files.GetFilePrices).Methods("GET")
	r.HandleFunc("/download", files.DownloadFile).Methods("POST")
	r.HandleFunc("/getProviders/{fileHash}", files.GetProviders).Methods("GET")
	// r.HandleFunc("/download", download.DownloadFile).Methods("POST")
	r.HandleFunc("/getDownloadHistory/{walletAddr}", download.GetDownloadHistory).Methods("GET")
	// Peers Routes
	r.HandleFunc("/getPeers", files.GetPeers).Methods("GET")
	r.HandleFunc("/getClosestPeers", files.GetClosestPeers).Methods("GET")
	r.HandleFunc("/getCatalog/{providerID}", files.GetCatalog).Methods("GET")
	r.HandleFunc("/getOtternetPeers", files.GetOtternetPeers).Methods("GET") // get otternet peers that HAVE FILES UPLOADED
	r.HandleFunc("/putPeersInCache", files.PutPeersInCache).Methods("POST")

	// DHT Routes
	r.HandleFunc("/startDHT/{walletAddr}", dhtHandlers.StartDHTHandler).Methods("GET")
	r.HandleFunc("/stopDHT", dhtHandlers.CloseDHTHandler).Methods("GET")

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

	r.HandleFunc("/getPublicIP", func(w http.ResponseWriter, r *http.Request) {
		ip, err := proxy.GetPublicIP()
		if err != nil {
			log.Printf("Error fetching public IP: %v", err)
			http.Error(w, "Failed to retrieve public IP", http.StatusInternalServerError)
			return
		}
		log.Printf("Fetched public IP: %s", ip)
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(ip))
	}).Methods("GET")		

	proxy.RegisterHandleConnectEndpoint(r)
	proxy.RegisterHandleDisconnectEndpoint(r)		

	handlerWithCORS := corsOptions(r)

	server := &http.Server{
		Addr:    ":9378",
		Handler: handlerWithCORS,
	}

	signalChan := make(chan os.Signal, 1)
	signal.Notify(signalChan, syscall.SIGTERM, syscall.SIGINT)
	shutdownComplete := make(chan bool)
	bitcoin.LoadAllWallets()
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