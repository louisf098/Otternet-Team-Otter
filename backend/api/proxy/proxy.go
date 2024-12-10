package proxy

import (
	"Otternet/backend/global"
	"bufio"
	//"bytes"
	"context"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"log"
	"io/ioutil"
	//"net"
	"net/http"
	"strings"
	"sync"

	"github.com/elazarl/goproxy"
	"github.com/libp2p/go-libp2p/core/network"
	"github.com/libp2p/go-libp2p/core/host"
	//"github.com/libp2p/go-libp2p/core/peer"
	"github.com/libp2p/go-libp2p/core/protocol"
	//"github.com/multiformats/go-multiaddr"
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

// ProxyNode represents a proxy node's details
type ProxyNode struct {
	ID           string  `json:"id"`
	IP           string  `json:"ip"`
	Port         string  `json:"port"`
	PricePerHour float64 `json:"pricePerHour"`
	Status       string  `json:"status"` // "available", "busy"
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

    // Advertise this proxy node on the DHT
    go func() {
        ip, err := getPublicIP()
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

// HandleConnectToProxy adds a client to the authorized list and starts servicing
func HandleConnectToProxy(h host.Host) {
	h.SetStreamHandler(proxyConnectProtocol, func(s network.Stream) {
		defer s.Close()

		// Read client multiaddress
		r := bufio.NewReader(s)
		clientAddr, err := r.ReadString('\n')
		if err != nil {
			log.Printf("Error reading from stream: %v", err)
			return
		}
		clientAddr = strings.TrimSpace(clientAddr)

		// Add client to authorized list
		mu.Lock()
		authorizedClients[clientAddr] = true
		mu.Unlock()

		log.Printf("Client %s connected to proxy", clientAddr)

		// Send positive response
		response := map[string]string{"message": "Connected to proxy"}
		json.NewEncoder(s).Encode(response)
	})
}

// HandleDisconnectFromProxy removes a client from the authorized list
func HandleDisconnectFromProxy(h host.Host) {
	h.SetStreamHandler(proxyDisconnectProtocol, func(s network.Stream) {
		defer s.Close()

		// Read client multiaddress
		r := bufio.NewReader(s)
		clientAddr, err := r.ReadString('\n')
		if err != nil {
			log.Printf("Error reading from stream: %v", err)
			return
		}
		clientAddr = strings.TrimSpace(clientAddr)

		// Remove client from authorized list
		mu.Lock()
		delete(authorizedClients, clientAddr)
		mu.Unlock()

		log.Printf("Client %s disconnected from proxy", clientAddr)

		// Send positive response
		response := map[string]string{"message": "Disconnected from proxy"}
		json.NewEncoder(s).Encode(response)
	})
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

 // Export the mu and map, used in server.go
var Mu = &mu
var AuthorizedClients = authorizedClients