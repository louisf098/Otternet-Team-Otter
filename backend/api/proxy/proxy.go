package proxy

import (
	"Otternet/backend/global"
	"context"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/http/httptest"
	"sync"
	"bytes"

	"github.com/libp2p/go-libp2p/core/peer"
	"github.com/elazarl/goproxy"
	"github.com/ipfs/go-cid"  // Correct import for CID
	"github.com/multiformats/go-multihash"
)

// ProxyNode represents a proxy node's details
type ProxyNode struct {
	ID           string  `json:"id"`
	IP           string  `json:"ip"`
	Port         string  `json:"port"`
	PricePerHour float64 `json:"pricePerHour"`
	Status       string  `json:"status"` // "available", "busy"
}

// In-memory data stores (replace with database in production)
var (
	proxyNodes     = []ProxyNode{}
	activeSessions = map[string]bool{} // Tracks active sessions by user ID
	mu             sync.Mutex
	proxyServer    *http.Server
)

var ProxyProviderHash = "fixed-proxy-hash"

// AdvertiseSelfAsNode advertises the current server as a provider for the ProxyProviderHash
func AdvertiseSelfAsNode(ctx context.Context, ip, port string, pricePerHour float64) error {
    if global.DHTNode == nil {
        return fmt.Errorf("DHT node is not initialized")
    }

    // Hash the ProxyProviderHash to create a CID
    hash := sha256.Sum256([]byte(ProxyProviderHash))
    mh, err := multihash.EncodeName(hash[:], "sha2-256")
    if err != nil {
        return fmt.Errorf("failed to create multihash: %v", err)
    }
    c := cid.NewCidV1(cid.Raw, mh)

    // Announce this node as a provider for the CID in the DHT
    err = global.DHTNode.ProvideKey(c.String())
    if err != nil {
        return fmt.Errorf("failed to advertise proxy node in DHT: %v", err)
    }

    log.Printf("Advertised as a provider for hash: %s (CID: %s)\n", ProxyProviderHash, c)

    // Add the proxy node to the local list with metadata
    mu.Lock()
    defer mu.Unlock()
    proxyNodes = append(proxyNodes, ProxyNode{
        ID:           global.DHTNode.Host.ID().String(), // Use the libp2p peer ID
        IP:           ip,
        Port:         port,
        PricePerHour: pricePerHour,
        Status:       "available",
    })

    return nil
}

// FetchAvailableProxies retrieves a list of proxy nodes currently providing the ProxyProviderHash
func FetchAvailableProxies(ctx context.Context) ([]ProxyNode, error) {
	if global.DHTNode == nil {
		return nil, fmt.Errorf("DHT node is not initialized")
	}

	// Hash the ProxyProviderHash to create a CID
	hash := sha256.Sum256([]byte(ProxyProviderHash))
	mh, err := multihash.EncodeName(hash[:], "sha2-256")
	if err != nil {
		return nil, fmt.Errorf("failed to create multihash: %v", err)
	}
	c := cid.NewCidV1(cid.Raw, mh)

	// Find providers for the CID
	providers, err := global.DHTNode.FindProviders(c.String())
	if err != nil {
		return nil, fmt.Errorf("failed to fetch providers: %v", err)
	}

	log.Printf("Found %d providers for hash: %s\n", len(providers), ProxyProviderHash)

	// Transform providers into proxy nodes (assumes metadata retrieval later)
	proxyList := []ProxyNode{}
	for _, provider := range providers {
		proxyList = append(proxyList, ProxyNode{
			ID:     provider.ID.String(),
			Status: "available", // Status retrieval depends on the system's metadata protocol
		})
	}

	return proxyList, nil
}

// StartServer starts the proxy server on the specified port
func StartServer(w http.ResponseWriter, r *http.Request) {
	type StartRequest struct {
		Port string `json:"port"`
	}

	var req StartRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Port == "" {
		http.Error(w, "Invalid port provided", http.StatusBadRequest)
		return
	}

	// Prevent multiple server instances
	if proxyServer != nil {
		http.Error(w, "Proxy server is already running", http.StatusConflict)
		return
	}

	// Start the proxy server
	proxy := goproxy.NewProxyHttpServer()
	proxy.Verbose = true

	proxyServer = &http.Server{
		Addr:    ":" + req.Port,
		Handler: proxy,
	}

	go func() {
		log.Printf("Starting proxy server on port %s...\n", req.Port)
		if err := proxyServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Proxy server error: %v\n", err)
		}
	}()

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Proxy server started"})
}

// ShutdownServer gracefully shuts down the proxy server
func ShutdownServer(w http.ResponseWriter, r *http.Request) {
	if proxyServer == nil {
		http.Error(w, "Proxy server is not running", http.StatusConflict)
		return
	}

	log.Println("Shutting down proxy server...")
	if err := proxyServer.Close(); err != nil {
		log.Fatalf("Error shutting down proxy server: %v\n", err)
	}

	proxyServer = nil
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Proxy server shut down"})
}

// ConnectToProxy handles user connection to a proxy node
func ConnectToProxy(w http.ResponseWriter, r *http.Request) {
	type ConnectRequest struct {
		UserID string `json:"userId"`
		NodeID string `json:"nodeId"`
	}

	var req ConnectRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	mu.Lock()
	defer mu.Unlock()

	// Validate that the node exists and is available
	var node *ProxyNode
	for i, n := range proxyNodes {
		if n.ID == req.NodeID {
			node = &proxyNodes[i]
			break
		}
	}

	if node == nil || node.Status != "available" {
		http.Error(w, "Proxy node is not available", http.StatusBadRequest)
		return
	}
	
    // Convert NodeID (string) to peer.ID
    peerID, err := peer.Decode(req.NodeID)
    if err != nil {
        http.Error(w, fmt.Sprintf("Invalid peer ID: %v", err), http.StatusBadRequest)
        return
    }

	// Open a libp2p stream to the node
	stream, err := global.DHTNode.Host.NewStream(context.Background(), peerID, "/proxy/connect/1.0.0")
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to establish stream: %v", err), http.StatusInternalServerError)
		return
	}
	defer stream.Close()

	// Send a connection request message over the stream
	requestMessage := struct {
		UserID string `json:"userId"`
		Action string `json:"action"` // e.g., "connect"
	}{
		UserID: req.UserID,
		Action: "connect",
	}
	if err := json.NewEncoder(stream).Encode(requestMessage); err != nil {
		http.Error(w, fmt.Sprintf("Failed to send connection request: %v", err), http.StatusInternalServerError)
		return
	}

	// Read the response from the proxy node
	responseMessage := struct {
		Status  int    `json:"status"` // 1 for success, 0 for failure
		Message string `json:"message"`
	}{}
	if err := json.NewDecoder(stream).Decode(&responseMessage); err != nil {
		http.Error(w, fmt.Sprintf("Failed to read response: %v", err), http.StatusInternalServerError)
		return
	}

	// Respond to the client based on the proxy node's response
	if responseMessage.Status == 1 {
		node.Status = "busy" // Mark the node as busy
		activeSessions[req.UserID] = true
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(responseMessage)
	} else {
		http.Error(w, responseMessage.Message, http.StatusServiceUnavailable)
	}
}

// GetProxyHistory fetches active session details
func GetProxyHistory(w http.ResponseWriter, r *http.Request) {
	mu.Lock()
	defer mu.Unlock()

	sessionDetails := []string{}
	for userID := range activeSessions {
		sessionDetails = append(sessionDetails, userID)
	}

	json.NewEncoder(w).Encode(sessionDetails)
}

// HandleRequest processes proxy-specific HTTP requests
func HandleRequest(w http.ResponseWriter, r *http.Request) {
	log.Printf("Handling request: %s %s\n", r.Method, r.URL.Path)
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Request handled"})
}

// GetStatus returns the current status of the proxy server
func GetStatus(w http.ResponseWriter, r *http.Request) {
	mu.Lock()
	defer mu.Unlock()

	status := "stopped"
	if proxyServer != nil {
		status = "running"
	}

	json.NewEncoder(w).Encode(map[string]string{"status": status})
}

// GetNodesHandler retrieves a list of available proxy nodes
func GetNodesHandler(w http.ResponseWriter, r *http.Request) {
    // Fetch the list of proxies from the DHT
    proxies, err := FetchAvailableProxies(global.DHTNode.Ctx)
    if err != nil {
        log.Printf("Failed to fetch available proxies: %v", err)
        http.Error(w, "Failed to fetch available proxies", http.StatusInternalServerError)
        return
    }

    // Match fetched providers with local metadata
    enrichedProxies := []ProxyNode{}
    for _, proxy := range proxies {
        for _, localProxy := range proxyNodes {
            if proxy.ID == localProxy.ID {
                enrichedProxies = append(enrichedProxies, localProxy)
                break
            }
        }
    }

    // Return the enriched list as JSON
    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(enrichedProxies)
}


// RegisterNodeHandler handles the registration of a new proxy node
func RegisterNodeHandler(w http.ResponseWriter, r *http.Request) {
	var newNode ProxyNode
	if err := json.NewDecoder(r.Body).Decode(&newNode); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	mu.Lock()
	defer mu.Unlock()

	// Check for duplicate node ID
	for _, node := range proxyNodes {
		if node.ID == newNode.ID {
			http.Error(w, "Node with this ID already exists", http.StatusConflict)
			return
		}
	}

	// Add the new node to the list
	proxyNodes = append(proxyNodes, newNode)
	log.Printf("Node registered: %+v\n", newNode)

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": "Node registered successfully"})
}

func StartProxyModeHandler(w http.ResponseWriter, r *http.Request) {
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
		// Start the proxy server
		reqBody, _ := json.Marshal(map[string]string{"port": config.Port})
		req, err := http.NewRequest("POST", "http://localhost/startProxy", bytes.NewBuffer(reqBody))
		if err != nil {
			log.Printf("Failed to create request for starting proxy server: %v\n", err)
			return
		}
		w := httptest.NewRecorder()
		StartServer(w, req)
		resp := w.Result()
		if resp.StatusCode != http.StatusOK {
			log.Printf("Failed to start proxy server: %v\n", resp.Status)
			return
		}

		// Advertise the node as a proxy on the DHT
		err = AdvertiseSelfAsNode(global.DHTNode.Ctx, config.IP, config.Port, config.PricePerHour)
		if err != nil {
			log.Printf("Failed to advertise proxy node: %v\n", err)
			return
		}

		log.Println("Proxy mode started successfully")
	}()

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Proxy mode started"})
}