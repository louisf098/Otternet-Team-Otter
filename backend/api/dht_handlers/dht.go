package dht_handlers

import (
	"Otternet/backend/api/dhtnode"
	"Otternet/backend/api/handlers"
	"Otternet/backend/global"
	"Otternet/backend/global_wallet"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/mux"
)

var dhtMutex sync.Mutex
var initErr error

func StartDHTHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	walletAddr := vars["walletAddr"]

	dhtMutex.Lock()
	defer dhtMutex.Unlock()

	if global.DHTNode != nil {
		http.Error(w, "DHT node already started", http.StatusInternalServerError)
		return
	}

	global.DHTNode, initErr = dhtnode.CreateLibp2pHost()
	if initErr != nil {
		log.Fatalf("Failed to instantiate the DHT node: %v", initErr)
		http.Error(w, "Failed to start DHT node", http.StatusInternalServerError)
		return
	}
	global.DHTNode.ConnectToPeer(dhtnode.RelayNodeAddr)
	global.DHTNode.MakeReservation()
	global.DHTNode.ConnectToPeer(dhtnode.BootstrapNodeAddr)
	handlers.HandleCatalogRequests(global.DHTNode.Host)
	handlers.HandleOtternetPeersRequests(global.DHTNode.Host)
	handlers.HandleFileRequests(global.DHTNode.Host)
	handlers.HandlePriceRequests(global.DHTNode.Host)
	go global.DHTNode.HandlePeerExchange()

	if initErr != nil {
		http.Error(w, "Failed to start DHT node", http.StatusInternalServerError)
		return
	}
	if global.DHTNode == nil {
		http.Error(w, "DHT node not initialized", http.StatusInternalServerError)
		return
	}
	global_wallet.WalletAddr = walletAddr
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "DHT node started successfully"})
}

func CloseDHTHandler(w http.ResponseWriter, r *http.Request) {
	if global.DHTNode != nil {
		global.DHTNode.Close()
	}
	fmt.Printf("DHT node closed successfully\n")
	global.DHTNode = nil
	global_wallet.WalletAddr = ""
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "DHT node closed successfully"})
}
