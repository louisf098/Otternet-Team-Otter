package proxy

import (
	"Otternet/backend/global"
	//"bufio"
	//"bytes"
	"context"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	//"net"
	"net/http"
	"strings"
	"sync"

	"github.com/elazarl/goproxy"
	"github.com/libp2p/go-libp2p/core/network"
	"github.com/libp2p/go-libp2p/core/protocol"
	//"github.com/multiformats/go-multiaddr"
    "github.com/libp2p/go-libp2p/core/host"
    "github.com/libp2p/go-libp2p/core/peer"
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
var ProxyProviderHash = "proxy-louis-x4"
var proxyConnectProtocol = protocol.ID("/proxy/connect/1.0.0")
var proxyDisconnectProtocol = protocol.ID("/proxy/disconnect/1.0.0")

// ProxyNode represents a proxy node's details
type ProxyNode struct {
	ID           string  `json:"id"`
	IP           string  `json:"ip"`
	Port         string  `json:"port"`
	PricePerHour float64 `json:"pricePerHour"`
	Status       string  `json:"status"` // "available", "busy"
}

// Registers proxy handlers for libp2p
func RegisterProxyHandlers(h host.Host) {
	HandleProxyConnectRequests(h)
	HandleProxyDisconnectRequests(h)
	log.Println("Proxy handlers registered.")
}

// Handles proxy connection requests
func HandleProxyConnectRequests(h host.Host) {
	h.SetStreamHandler(proxyConnectProtocol, func(s network.Stream) {
		defer s.Close()

		var req struct {
			ClientAddr string `json:"clientAddr"`
		}

		// Decode the request from the stream
		if err := json.NewDecoder(s).Decode(&req); err != nil {
			log.Printf("Failed to decode connection request: %v", err)
			return
		}

		// Validate the client address
		if req.ClientAddr == "" {
			log.Println("Received empty client address; ignoring request.")
			return
		}

		// Update the authorized clients list
		mu.Lock()
		authorizedClients[req.ClientAddr] = true
		mu.Unlock()

		log.Printf("Client %s authorized via proxy connect stream.", req.ClientAddr)

		// Send a response back to the client
		response := map[string]string{"message": "Client authorized successfully"}
		if err := json.NewEncoder(s).Encode(response); err != nil {
			log.Printf("Failed to send response to client: %v", err)
		}
	})
}

// Handles proxy disconnection requests
func HandleProxyDisconnectRequests(h host.Host) {
	h.SetStreamHandler(proxyDisconnectProtocol, func(s network.Stream) {
		defer s.Close()

		var req struct {
			ClientAddr string `json:"clientAddr"`
		}

		// Decode the disconnection request from the stream
		if err := json.NewDecoder(s).Decode(&req); err != nil {
			log.Printf("Failed to decode disconnection request: %v", err)
			return
		}

		// Validate the client address
		if req.ClientAddr == "" {
			log.Println("Received empty client address; ignoring request.")
			return
		}

		// Remove the client from the authorized clients list
		mu.Lock()
		if _, exists := authorizedClients[req.ClientAddr]; exists {
			delete(authorizedClients, req.ClientAddr)
			log.Printf("Client %s disconnected and removed from authorized list.", req.ClientAddr)
		} else {
			log.Printf("Client %s not found in authorized list; ignoring request.", req.ClientAddr)
		}
		mu.Unlock()

		// Send a response back to the client
		response := map[string]string{"message": "Client disconnected successfully"}
		if err := json.NewEncoder(s).Encode(response); err != nil {
			log.Printf("Failed to send response to client: %v", err)
		}
	})
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

    // Add or update the proxy node in the local list
    mu.Lock()
    defer mu.Unlock()

    nodeUpdated := false
    for i, node := range proxyNodes {
        if node.ID == global.DHTNode.Host.ID().String() {
            proxyNodes[i].Status = "available"
            proxyNodes[i].IP = ip
            proxyNodes[i].Port = port
            proxyNodes[i].PricePerHour = pricePerHour
            nodeUpdated = true
            log.Printf("Updated proxy node %s to available", node.ID)
            break
        }
    }

    if !nodeUpdated {
        proxyNodes = append(proxyNodes, ProxyNode{
            ID:           global.DHTNode.Host.ID().String(),
            IP:           ip,
            Port:         port,
            PricePerHour: pricePerHour,
            Status:       "available",
        })
        log.Printf("Added new proxy node %s as available", global.DHTNode.Host.ID().String())
    }

    return nil
}

func GetPublicIP() (string, error) {
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

    // Add custom authorization logic for HTTP traffic
    proxy.OnRequest().DoFunc(func(req *http.Request, ctx *goproxy.ProxyCtx) (*http.Request, *http.Response) {
        clientAddr := req.RemoteAddr
        log.Printf("Raw client address for HTTP request: %s", clientAddr)

        if clientAddr == "" {
            log.Println("Empty client address in HTTP request; rejecting.")
            return req, goproxy.NewResponse(req, goproxy.ContentTypeText, http.StatusForbidden, "Unauthorized client")
        }

        normalizedAddr := normalizeAddress(clientAddr)
        log.Printf("Normalized client address for HTTP request: %s", normalizedAddr)

        mu.Lock()
        authorized := authorizedClients[normalizedAddr]
        mu.Unlock()

        if !authorized {
            log.Printf("Unauthorized HTTP client attempted to connect: %s", normalizedAddr)
            return req, goproxy.NewResponse(req, goproxy.ContentTypeText, http.StatusForbidden, "Unauthorized client")
        }

        log.Printf("Authorized HTTP request from: %s", normalizedAddr)
        return req, nil
    })

    // Add custom authorization logic for HTTPS traffic
    proxy.OnRequest().HandleConnectFunc(func(host string, ctx *goproxy.ProxyCtx) (*goproxy.ConnectAction, string) {
        clientAddr := ctx.Req.RemoteAddr
        log.Printf("Raw client address for HTTPS request: %s", clientAddr)

        if clientAddr == "" {
            log.Println("Empty client address in HTTPS request; rejecting.")
            return goproxy.RejectConnect, ""
        }

        normalizedAddr := normalizeAddress(clientAddr)
        log.Printf("Normalized client address for HTTPS request: %s", normalizedAddr)

        mu.Lock()
        authorized := authorizedClients[normalizedAddr]
        mu.Unlock()

        if !authorized {
            log.Printf("Unauthorized HTTPS client attempted to connect: %s", normalizedAddr)
            return goproxy.RejectConnect, ""
        }

        log.Printf("Authorized HTTPS request from: %s", normalizedAddr)
        return goproxy.OkConnect, host
    })

	if global.DHTNode == nil {
        log.Println("DHT node is not initialized. Skipping proxy advertisement.")
        return fmt.Errorf("DHT node is not initialized")
    } else {
        StartLibp2pStreamHandler(global.DHTNode.Host)
        RegisterProxyHandlers(global.DHTNode.Host)
    }

    // Update the proxy node status to "available"
    mu.Lock()
    for i, node := range proxyNodes {
        if node.ID == global.DHTNode.Host.ID().String() {
            proxyNodes[i].Status = "available"
            log.Printf("Proxy node %s marked as available", node.ID)
        }
    }
    mu.Unlock()

    // Advertise this proxy node on the DHT
    go func() {
        ip, err := GetPublicIP()
        if err != nil {
            log.Printf("Failed to fetch public IP: %v. Falling back to 127.0.0.1", err)
            ip = "127.0.0.1" // Fallback to localhost if public IP cannot be fetched
        }

        err = AdvertiseSelfAsNode(global.DHTNode.Ctx, ip, port, 0.01) // Adjust pricePerHour as needed
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

            // Assume all nodes fetched from the DHT are available unless filtered
            proxyList = append(proxyList, ProxyNode{
                ID:     provider.ID.String(),
                IP:     ip,
                Port:   port,
                Status: "available", // Default to available
            })
        }
    }

    // Optionally filter out unavailable nodes from the local list
    mu.Lock()
    for i := 0; i < len(proxyList); i++ {
        for _, node := range proxyNodes {
            if proxyList[i].ID == node.ID && node.Status != "available" {
                // Remove this node from the proxyList if marked as unavailable
                proxyList = append(proxyList[:i], proxyList[i+1:]...)
                i-- // Adjust index after removal
                break
            }
        }
    }
    mu.Unlock()

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

func StopServingAsProxy(ctx context.Context) error {
    mu.Lock()
    defer mu.Unlock()

    // Step 1: Stop the proxy server if it's running
    if proxyServer != nil {
        log.Println("Stopping the proxy server...")
        if err := proxyServer.Shutdown(ctx); err != nil {
            log.Printf("Error while shutting down the proxy server: %v", err)
            return err
        }
        proxyServer = nil
        log.Println("Proxy server stopped successfully.")
    } else {
        log.Println("Proxy server is not running.")
    }

    // Step 2: Mark the proxy node as unavailable
    log.Println("Marking proxy node as unavailable...")
    for i, node := range proxyNodes {
        if node.ID == global.DHTNode.Host.ID().String() {
            proxyNodes[i].Status = "unavailable" // Update the status to "unavailable"
            log.Printf("Proxy node %s marked as unavailable.", node.ID)
            break
        }
    }

    // Step 3: Clear the authorized clients list
    log.Println("Clearing authorized clients...")
    authorizedClients = make(map[string]bool)
    log.Println("Authorized clients cleared.")

    return nil
}

// endpoint for stop serving as a proxy
func RegisterHandleStopServingEndpoint(router *mux.Router) {
	router.HandleFunc("/stopServingAsProxy", func(w http.ResponseWriter, r *http.Request) {
		log.Println("Received request to stop serving as a proxy...")
		if err := StopServingAsProxy(context.Background()); err != nil {
			log.Printf("Failed to stop serving as a proxy: %v", err)
			http.Error(w, "Failed to stop serving as a proxy", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"message": "Stopped serving as a proxy successfully"})
	}).Methods("POST")
}

// Endpoint function to connect
func RegisterHandleConnectEndpoint(router *mux.Router) {
    router.HandleFunc("/connectToProxy", func(w http.ResponseWriter, r *http.Request) {
        if r.Method != http.MethodPost {
            http.Error(w, "Invalid request method. Use POST.", http.StatusMethodNotAllowed)
            return
        }
        w.Header().Set("Content-Type", "application/json")

        // Parse the request body
        var req struct {
            ClientAddr string `json:"clientAddr"`
            ProviderID string `json:"providerID"`
        }
        if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
            http.Error(w, "Invalid request body", http.StatusBadRequest)
            return
        }

        if req.ClientAddr == "" || req.ProviderID == "" {
            http.Error(w, "Both client address and provider ID are required", http.StatusBadRequest)
            return
        }

        // Decode the provider ID into a libp2p Peer ID
        peerID, err := peer.Decode(req.ProviderID)
        if err != nil {
            http.Error(w, "Invalid provider ID", http.StatusBadRequest)
            return
        }

        // Use the DHT to find the peer information
        peerInfo, err := global.DHTNode.DHT.FindPeer(global.DHTNode.Ctx, peerID)
        if err != nil {
            http.Error(w, fmt.Sprintf("Failed to find provider in DHT: %v", err), http.StatusInternalServerError)
            return
        }

        // Open a stream to the provider using the proxyConnectProtocol
        stream, err := global.DHTNode.Host.NewStream(global.DHTNode.Ctx, peerInfo.ID, proxyConnectProtocol)
        if err != nil {
            http.Error(w, fmt.Sprintf("Failed to open stream: %v", err), http.StatusInternalServerError)
            return
        }
        defer stream.Close()

        // Send the connection request to the provider
        connectionRequest := map[string]string{
            "clientAddr": req.ClientAddr,
        }
        if err := json.NewEncoder(stream).Encode(connectionRequest); err != nil {
            http.Error(w, fmt.Sprintf("Failed to send connection request: %v", err), http.StatusInternalServerError)
            return
        }

        // Read the provider's response
        var response map[string]string
        if err := json.NewDecoder(stream).Decode(&response); err != nil {
            http.Error(w, fmt.Sprintf("Failed to decode response: %v", err), http.StatusInternalServerError)
            return
        }

        log.Printf("Connect Response from Provider: %v", response)
        w.WriteHeader(http.StatusOK)
        json.NewEncoder(w).Encode(map[string]string{
            "message": "Client connected to proxy successfully",
            "providerResponse": fmt.Sprintf("%v", response),
        })
    }).Methods("POST")
}

// endpoint function for disconnect to proxy
func RegisterHandleDisconnectEndpoint(router *mux.Router) {
    router.HandleFunc("/disconnectFromProxy", func(w http.ResponseWriter, r *http.Request) {
        var req struct {
            ClientAddr string `json:"clientAddr"`
        }
        
        // Decode the request body
        if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
            log.Println("Invalid request body for disconnect:", err)
            http.Error(w, "Invalid request body", http.StatusBadRequest)
            return
        }

        if req.ClientAddr == "" {
            log.Println("No client address provided for disconnect")
            http.Error(w, "Client address is required", http.StatusBadRequest)
            return
        }

        // Log current authorized clients for debugging
        mu.Lock()
        //log.Printf("Authorized clients map before disconnect: %v", authorizedClients)
        if _, exists := authorizedClients[req.ClientAddr]; exists {
            delete(authorizedClients, req.ClientAddr)
            log.Printf("Client %s successfully disconnected", req.ClientAddr)
            mu.Unlock()

            w.WriteHeader(http.StatusOK)
            json.NewEncoder(w).Encode(map[string]string{"message": "Client disconnected successfully"})
        } else {
            log.Printf("Client address not found: %s", req.ClientAddr)
            mu.Unlock()

            http.Error(w, fmt.Sprintf("Client address %s not found", req.ClientAddr), http.StatusNotFound)
        }
    }).Methods("POST")
}

// GetAuthorizedClients returns the current list of authorized clients.
func GetAuthorizedClients(w http.ResponseWriter, r *http.Request) {
    mu.Lock()
    defer mu.Unlock()

    // Convert the map keys into a slice of strings
    clients := make([]string, 0, len(authorizedClients))
    for client := range authorizedClients {
        clients = append(clients, client)
    }

    // Respond with the list of authorized clients
    w.Header().Set("Content-Type", "application/json")
    if err := json.NewEncoder(w).Encode(clients); err != nil {
        log.Printf("Failed to encode authorized clients: %v", err)
        http.Error(w, "Failed to retrieve authorized clients", http.StatusInternalServerError)
    }
}

// LIBP2P SECTION
func StartLibp2pStreamHandler(host host.Host) {
    host.SetStreamHandler(proxyConnectProtocol, func(s network.Stream) {
        defer s.Close()

        var req struct {
            ClientAddr string `json:"clientAddr"`
        }

        // Decode the request metadata from the stream
        if err := json.NewDecoder(s).Decode(&req); err != nil {
            log.Printf("Failed to decode client metadata: %v", err)
            return
        }

        if req.ClientAddr == "" {
            log.Println("Received empty client address in metadata; ignoring.")
            return
        }

        // Update the authorized clients list
        mu.Lock()
        authorizedClients[req.ClientAddr] = true
        mu.Unlock()

        log.Printf("Authorized client %s via libp2p stream", req.ClientAddr)

        // Respond back to the client
        response := map[string]string{"message": "Client authorized successfully"}
        if err := json.NewEncoder(s).Encode(response); err != nil {
            log.Printf("Failed to send response to client: %v", err)
        }
    })
}

func SendConnectionRequestToHost(host host.Host, peerID peer.ID, clientAddr string) error {
    // Open a stream to the host
    stream, err := host.NewStream(context.Background(), peerID, proxyConnectProtocol)
    if err != nil {
        return fmt.Errorf("failed to open stream: %w", err)
    }
    defer stream.Close()

    // Send the connection request
    req := struct {
        ClientAddr string `json:"clientAddr"`
    }{
        ClientAddr: clientAddr,
    }
    if err := json.NewEncoder(stream).Encode(req); err != nil {
        return fmt.Errorf("failed to send connection request: %w", err)
    }

    // Read the response from the host
    var response map[string]string
    if err := json.NewDecoder(stream).Decode(&response); err != nil {
        return fmt.Errorf("failed to read response: %w", err)
    }

    log.Printf("Response from host: %v", response)
    return nil
}

 // Export the mu and map, used in server.go
var Mu = &mu
var AuthorizedClients = authorizedClients