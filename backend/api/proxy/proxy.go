package proxy

import (
	"Otternet/backend/global"
	// "bufio"

	//"bytes"
	"context"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"

	//"net"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/elazarl/goproxy"
	// "github.com/libp2p/go-libp2p/core/host"
	// "github.com/libp2p/go-libp2p/core/network"

	//"github.com/libp2p/go-libp2p/core/peer"
	"github.com/libp2p/go-libp2p/core/protocol"
	//"github.com/multiformats/go-multiaddr"
	"github.com/gorilla/mux"
	"github.com/ipfs/go-cid"
	"github.com/multiformats/go-multihash"
)

var (
	// In-memory data stores
	proxyNodes        = []ProxyNode{}
	authorizedClients = make(map[string]bool) // Multiaddress of authorized clients
	mu                sync.Mutex
	proxyServer       *http.Server
)

// Constants
var ProxyProviderHash = "proxy-louis-test1"
var proxyConnectProtocol = protocol.ID("/proxy/connect/1.0.0")
var proxyDisconnectProtocol = protocol.ID("/proxy/disconnect/1.0.0")
var proxyHistory = []ProxyHistory{}
var proxyHistoryMu sync.Mutex
const proxyHistoryFile = "api/proxy/proxyHistory.json"

// ProxyNode represents a proxy node's details
type ProxyNode struct {
	ID           string  `json:"id"`
	IP           string  `json:"ip"`
	Port         string  `json:"port"`
	PricePerHour float64 `json:"pricePerHour"`
	Status       string  `json:"status"` // "available", "busy"
}

// ProxyHistory stores details of proxy session
type ProxyHistory struct {
	ConnectTime      string  `json:"ConnectTime"`
	DisconnectTime   string  `json:"DisconnectTime"`
	IPAddr     string  `json:"IPAddr"`
	Price      float64 `json:"Price"`
	ProxyWalletID string `json:"ProxyWalletID"`
}

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

func getPublicIP() (string, error) {
	resp, err := http.Get("https://api.ipify.org?format=text") // API to fetch public IP
	if err != nil {
		return "", fmt.Errorf("failed to fetch public IP: %w", err)
	}
	defer resp.Body.Close()

	ip, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read public IP response: %w", err)
	}

	return strings.TrimSpace(string(ip)), nil
}

// StartProxyServer starts the proxy server and advertises it as a provider on the DHT
func StartProxyServer(port string) error {
	proxy := goproxy.NewProxyHttpServer()
	proxy.Verbose = true

	// Automatically add the server itself as an authorized client (IPv4 and IPv6 loopback addresses)
	mu.Lock()
	authorizedClients["127.0.0.1"] = true // IPv4 loopback
	authorizedClients["::1"] = true      // IPv6 loopback
	mu.Unlock()
	log.Printf("Server added as an authorized client for addresses: 127.0.0.1 and ::1")

	// Add custom authorization logic for HTTP and HTTPS traffic
	proxy.OnRequest().HandleConnectFunc(func(host string, ctx *goproxy.ProxyCtx) (*goproxy.ConnectAction, string) {
		clientAddr := ctx.Req.RemoteAddr
		log.Printf("Raw client address: %s", clientAddr)

		// Ensure RemoteAddr is valid
		if clientAddr == "" {
			log.Println("Empty client address in request; rejecting.")
			return goproxy.RejectConnect, ""
		}

		normalizedAddr := normalizeAddress(clientAddr)
		log.Printf("Normalized client address: %s", normalizedAddr)

		mu.Lock()
		authorized := authorizedClients[normalizedAddr]
		mu.Unlock()

		if !authorized {
			log.Printf("Unauthorized client attempted to connect: %s", normalizedAddr)
			return goproxy.RejectConnect, ""
		}

		log.Printf("Authorized client request from: %s", normalizedAddr)
		return goproxy.OkConnect, host
	})

	// Allow HTTPS traffic by intercepting CONNECT requests
	proxy.OnRequest().HandleConnect(goproxy.AlwaysMitm)

	// Advertise this proxy node on the DHT
	go func() {
		ip, err := getPublicIP()
		if err != nil {
			log.Printf("Failed to fetch public IP: %v. Falling back to 127.0.0.1", err)
			ip = "127.0.0.1" // Fallback to localhost if public IP cannot be fetched
		}

		err = AdvertiseSelfAsNode(global.DHTNode.Ctx, ip, port, 0.01) // Adjust pricePerHour as needed - change later to bytes?
		if err != nil {
			log.Printf("Failed to advertise self as a proxy node: %v", err)
		} else {
			log.Printf("Successfully advertised proxy node on the DHT: IP=%s, Port=%s", ip, port)
		}
	}()

	// Start the HTTP proxy server
	server := &http.Server{
		Addr:    ":" + port,
		Handler: proxy,
	}
	proxyServer = server

	log.Printf("Starting proxy server on port %s...", port)
	return server.ListenAndServe()
}

func normalizeAddress(addr string) string {
    // Split the address into host and port
    if strings.Contains(addr, "]") { // IPv6 literal with port
        // Extract the IPv6 literal by trimming brackets
        addr = strings.Split(addr, "]")[0]
        addr = strings.TrimPrefix(addr, "[")
    } else if strings.Contains(addr, ":") { // IPv4 or IPv6 without brackets
        addr = strings.Split(addr, ":")[0]
    }

    // Normalize the IPv6 to IPv4 consistenticy and less bugs
    if addr == "::1" {
        return "127.0.0.1"
    }

    return addr
}

// Endpoint function to connect
func RegisterHandleConnectEndpoint(router *mux.Router) {
    router.HandleFunc("/connectToProxy", func(w http.ResponseWriter, r *http.Request) {
        var req struct {
			Rate 	   float64 `json:"price"`
			WalletName string `json:"walletName"`
        }
        if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
            http.Error(w, "Invalid request body", http.StatusBadRequest)
            return
        }

        if req.Rate < 0 || req.WalletName == "" {
            http.Error(w, "Missing or invalid 'price', or 'walletName' fields", http.StatusBadRequest)
            return
        }

		clientAddr, err := getPublicIP()
        if err != nil {
            http.Error(w, "Failed to fetch client IP address", http.StatusInternalServerError)
            log.Printf("Error fetching client IP: %v", err)
            return
        }

        // Authorize the client
        mu.Lock() // Ensure thread-safe access
        authorizedClients[clientAddr] = true
        mu.Unlock()

        log.Printf("Client %s connected to proxy via API", clientAddr)
		RecordProxyHistory(clientAddr, req.Rate, req.WalletName)

        w.WriteHeader(http.StatusOK)
        json.NewEncoder(w).Encode(map[string]string{
			"message": "Client authorized successfully",
			"ConnectTime": time.Now().Format(time.RFC3339),
		})
    }).Methods("POST")
}

// endpoint function for disconnect to proxy
func RegisterHandleDisconnectEndpoint(router *mux.Router) {
    router.HandleFunc("/disconnectFromProxy", func(w http.ResponseWriter, r *http.Request) {
		clientAddr, err := getPublicIP()
		if err != nil {
			http.Error(w, "Failed to fetch client IP address", http.StatusInternalServerError)
            log.Printf("Error fetching client IP: %v", err)
            return
		}

        // Remove client from authorized list
        mu.Lock()
        delete(authorizedClients, clientAddr)
        mu.Unlock()

		// Update disconnect time for proxy history and save to json
		proxyHistoryMu.Lock()
		for i, record := range proxyHistory {
			if record.IPAddr == clientAddr && record.DisconnectTime == "Still connected" {
				proxyHistory[i].DisconnectTime = time.Now().Format(time.RFC3339)
			}
		}
		proxyHistoryMu.Unlock()
		
		err = SaveProxyHistory()
		if err != nil {
			log.Printf("Failed to save proxy history to file: %v", err)
		}

        log.Printf("Client %s disconnected from proxy via API", clientAddr)
        w.WriteHeader(http.StatusOK)
        json.NewEncoder(w).Encode(map[string]string{
			"message": "Client disconnected successfully",
			"DisconnectTime": time.Now().Format(time.RFC3339),
		})
    }).Methods("POST")
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

	// Transform providers into ProxyNode objects
	proxyList := []ProxyNode{}
	for _, provider := range providers {
		for _, addr := range provider.Addrs {
			// Parse the multiaddress to extract IP and Port
			ip, port, err := parseMultiAddr(addr.String())
			if err != nil {
				log.Printf("Failed to parse address %s: %v\n", addr.String(), err)
				continue
			}

			proxyList = append(proxyList, ProxyNode{
				ID:     provider.ID.String(),
				IP:     ip,
				Port:   port,
				Status: "available",
			})
		}
	}

	return proxyList, nil
}

func parseMultiAddr(multiAddr string) (string, string, error) {
	parts := strings.Split(multiAddr, "/")
	if len(parts) < 5 {
		return "", "", fmt.Errorf("invalid multiaddress format")
	}

	ip := parts[2]
	port := parts[4]
	return ip, port, nil
}

// RecordProxyHistory adds a new proxy session to the history
func RecordProxyHistory(ipAddr string, price float64, srcID string) {
	proxyHistoryMu.Lock()
	defer proxyHistoryMu.Unlock()

	proxyHistory = append(proxyHistory, ProxyHistory{
		ConnectTime:   time.Now().Format(time.RFC3339),
		DisconnectTime:	"Still connected",
		IPAddr:      ipAddr,
		Price:       price,
		ProxyWalletID: srcID,
	})

	err := SaveProxyHistory()
	if err != nil {
		log.Printf("Failed to save proxy history to file: %v", err)
	}
}

// FetchProxyHistoryHandler fetches the proxy history
func FetchProxyHistoryHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	proxyHistoryMu.Lock()
	defer proxyHistoryMu.Unlock()

	if len(proxyHistory) == 0 {
		http.Error(w, "No proxy history found", http.StatusNotFound)
		return
	}

	if err := json.NewEncoder(w).Encode(proxyHistory); err != nil {
		http.Error(w, "Failed to encode proxy history", http.StatusInternalServerError)
	}
}

func LoadProxyHistory() error {
	file, err := os.Open(proxyHistoryFile)
	if err != nil {
		// If file doesn't exist, initialize with an empty slice
		if os.IsNotExist(err) {
			proxyHistory = []ProxyHistory{}
			return nil
		}
		return err
	}
	defer file.Close()

	err = json.NewDecoder(file).Decode(&proxyHistory)
	if err != nil {
		return err
	}
	log.Println("Proxy history loaded from file")
	return nil
}

func SaveProxyHistory() error {
	file, err := os.Create(proxyHistoryFile)
	if err != nil {
		return err
	}
	defer file.Close()

	err = json.NewEncoder(file).Encode(proxyHistory)
	if err != nil {
		return err
	}
	log.Println("Proxy history saved to file")
	return nil
}

 // Export the mu and map, used in server.go
var Mu = &mu
var AuthorizedClients = authorizedClients