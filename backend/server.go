package main

import (
	"Otternet/backend/api/bitcoin"
	dhtHandlers "Otternet/backend/api/dht_handlers"
	"Otternet/backend/api/download"
	files "Otternet/backend/api/files"
	"Otternet/backend/api/proxy"
	"Otternet/backend/api/statistics"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/exec"
	"os/signal"
	"syscall"
	"time"

	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
)

var corsOptions = handlers.CORS(
	handlers.AllowedOrigins([]string{"*"}),
	handlers.AllowedMethods([]string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}),
	handlers.AllowedHeaders([]string{"Content-Type", "Authorization"}),
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
		http.Error(w, "Invalid request method.", 405)
	}
}

/*
Test Function using Gorilla Mux (allows for URL parameters)
*/
func nameReader(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	name := vars["name"]
	fmt.Fprintf(w, "Hello %s!\n", name)
}

func jsonResponse(w http.ResponseWriter, r *http.Request) {
	test := TestJSON{Name: "Test"}
	// test := TestJSON{"Test"}
	json.NewEncoder(w).Encode(test)
}

func waitForBitcoind() error {
	for {
		cmd := exec.Command("bitcoin-cli", "getblockchaininfo")
		err := cmd.Run()
		if err == nil {
			return nil
		}
		log.Println("Waiting for bitcoind to start...")
		time.Sleep(2 * time.Second)
	}
}

func main() {
	// Run bitcoind -daemon -fallbackfee=0.0002 on startup
	cmd := exec.Command("bitcoind", "-daemon", "-fallbackfee=0.0002")
	err := cmd.Start()
	if err != nil {
		log.Fatalf("Failed to start bitcoind: %v", err)
	}
	log.Println("bitcoind started successfully")

	// Wait for bitcoind to be ready
	err = waitForBitcoind()
	if err != nil {
		log.Fatalf("bitcoind did not start: %v", err)
	}
	log.Println("bitcoind is ready")

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
	r.HandleFunc("/connectToProxy", proxy.ConnectToProxy).Methods("POST")
	r.HandleFunc("/getProxyHistory/{walletAddr}", proxy.GetProxyHistory).Methods("GET")

	// Peers Routes
	r.HandleFunc("/getPeers", files.GetPeers).Methods("GET")
	r.HandleFunc("/getClosestPeers", files.GetClosestPeers).Methods("GET")
	r.HandleFunc("/getCatalog/{providerID}", files.GetCatalog).Methods("GET")
	r.HandleFunc("/getOtternetPeers", files.GetOtternetPeers).Methods("GET") // get otternet peers that HAVE FILES UPLOADED
	r.HandleFunc("/putPeersInCache", files.PutPeersInCache).Methods("POST")

	// DHT Routes
	r.HandleFunc("/startDHT/{walletAddr}", dhtHandlers.StartDHTHandler).Methods("GET")
	r.HandleFunc("/stopDHT", dhtHandlers.CloseDHTHandler).Methods("GET")

	// Accessing File for bytes uploaded
	r.HandleFunc("/getBytesUploaded", statistics.GetBytesUploadedHandler).Methods("GET")
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
