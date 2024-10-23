package main

import (
	"bufio"
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"os"
	"strings"

	"github.com/ipfs/go-cid"
	"github.com/libp2p/go-libp2p"
	dht "github.com/libp2p/go-libp2p-kad-dht"
	record "github.com/libp2p/go-libp2p-record"
	"github.com/libp2p/go-libp2p/core/crypto"
	"github.com/libp2p/go-libp2p/core/host"
	"github.com/libp2p/go-libp2p/core/network"
	"github.com/libp2p/go-libp2p/core/peer"
	"github.com/libp2p/go-libp2p/core/peerstore"
	"github.com/libp2p/go-libp2p/p2p/protocol/circuitv2/client"
	"github.com/libp2p/go-libp2p/p2p/protocol/circuitv2/relay"
	"github.com/multiformats/go-multiaddr"
	"github.com/multiformats/go-multihash"
)

var id = []byte("114295851") // Seed used to generate node's private key & peer ID (Currently this is Andrew's SBU ID)
var relay_node_addr = "/ip4/130.245.173.221/tcp/4001/p2p/12D3KooWDpJ7As7BWAwRMfu1VU2WCqNjvq387JEYKDBj4kx6nXTN"
var bootstrap_node_addr = "/ip4/130.245.173.222/tcp/61000/p2p/12D3KooWQd1K1k8XA9xVEzSAu7HUCodC7LJB6uW5Kw4VwkRdstPE"
var globalCtx context.Context

// creates deterministic private key to mantain identity of node
func generatePrivateKeyFromSeed(seed []byte) (crypto.PrivKey, error) {
	hash := sha256.Sum256(seed)
	privKey, _, err := crypto.GenerateEd25519Key(
		bytes.NewReader(hash[:]),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to generate private key: %w", err)
	}
	return privKey, nil
}

// initializes and configures libp2p host with DHT support
func createLibp2pHost() (host.Host, *dht.IpfsDHT, error) {
	ctx := context.Background()
	seed := []byte(id)

	// configure to listen on any port
	customAddr, err := multiaddr.NewMultiaddr("/ip4/0.0.0.0/tcp/0")
	if err != nil {
		return nil, nil, fmt.Errorf("failed to parse multiaddr: %w", err)
	}

	// generate node identity
	privKey, err := generatePrivateKeyFromSeed(seed)
	if err != nil {
		log.Fatal(err)
	}

	// parse relay address to multiaddress
	relayAddr, err := multiaddr.NewMultiaddr(relay_node_addr)
	if err != nil {
		log.Fatalf("Failed to create relay multiaddr: %v", err)
	}

	// convert the relay multiaddress to peer info
	relayInfo, err := peer.AddrInfoFromP2pAddr(relayAddr)
	if err != nil {
		log.Fatalf("Failed to create AddrInfo from relay multiaddr: %v", err)
	}

	// create libp2p node with configured features
	node, err := libp2p.New(
		libp2p.ListenAddrs(customAddr),
		libp2p.Identity(privKey),
		libp2p.NATPortMap(),
		libp2p.EnableNATService(),
		libp2p.EnableAutoRelayWithStaticRelays([]peer.AddrInfo{*relayInfo}),
		libp2p.EnableRelayService(),
		libp2p.EnableHolePunching(),
	)
	if err != nil {
		return nil, nil, err
	}

	// start relay service
	_, err = relay.New(node)
	if err != nil {
		log.Printf("Failed to instantiate the relay: %v", err)
	}

	// start DHT client mode
	kadDHT, err := dht.New(ctx, node, dht.Mode(dht.ModeClient))
	if err != nil {
		return nil, nil, err
	}

	// create validator for DHT
	namespacedValidator := record.NamespacedValidator{
		"orcanet": &CustomValidator{},
	}
	kadDHT.Validator = namespacedValidator

	// bootstrap DHT
	err = kadDHT.Bootstrap(ctx)
	if err != nil {
		return nil, nil, err
	}
	fmt.Println("DHT bootstrap complete.")

	// set up notifications for new connections
	node.Network().Notify(&network.NotifyBundle{
		ConnectedF: func(n network.Network, conn network.Conn) {
			fmt.Printf("Notification: New peer connected %s\n", conn.RemotePeer().String())
		},
	})

	return node, kadDHT, nil
}

// establishes direct connection to peer given their address
func connectToPeer(node host.Host, peerAddr string) {

	// convert string address to multiaddress
	addr, err := multiaddr.NewMultiaddr(peerAddr)
	if err != nil {
		log.Printf("Failed to parse peer address: %s", err)
		return
	}

	// get peer info from multiaddress
	info, err := peer.AddrInfoFromP2pAddr(addr)
	if err != nil {
		log.Printf("Failed to get AddrInfo from Multiaddr: %s", err)
		return
	}

	// attempt peer connection
	err = node.Connect(context.Background(), *info)
	if err != nil {
		log.Printf("Failed to connect to peer: %s", err)
		return
	}

	// store peer information permanently
	node.Peerstore().AddAddrs(info.ID, info.Addrs, peerstore.PermanentAddrTTL)
	fmt.Println("Connected to:", info.ID)
}

// establish connection to peer through relay node (use when direct connection not possible (e.g, NAT))
func connectToPeerUsingRelay(node host.Host, targetPeerID string) {
	ctx := globalCtx
	targetPeerID = strings.TrimSpace(targetPeerID)
	relayAddr, err := multiaddr.NewMultiaddr(relay_node_addr)
	if err != nil {
		log.Printf("Failed to create relay multiaddr: %v", err)
	}
	peerMultiaddr := relayAddr.Encapsulate(multiaddr.StringCast("/p2p-circuit/p2p/" + targetPeerID))

	relayedAddrInfo, err := peer.AddrInfoFromP2pAddr(peerMultiaddr)
	if err != nil {
		log.Println("Failed to get relayed AddrInfo: %w", err)
		return
	}
	// Connect to the peer through the relay
	err = node.Connect(ctx, *relayedAddrInfo)
	if err != nil {
		log.Println("Failed to connect to peer through relay: %w", err)
		return
	}

	fmt.Printf("Connected to peer via relay: %s\n", targetPeerID)
}

// process user-input commands for DHT interaction
func handleInput(ctx context.Context, dht *dht.IpfsDHT) {
	reader := bufio.NewReader(os.Stdin)
	fmt.Print("User Input \n ")
	for {
		fmt.Print("> ")
		input, _ := reader.ReadString('\n') // Read input from keyboard
		input = strings.TrimSpace(input)    // Trim any trailing newline or spaces
		args := strings.Split(input, " ")
		if len(args) < 1 {
			fmt.Println("No command provided")
			continue
		}
		command := args[0]
		command = strings.ToUpper(command)
		switch command {
		case "GET":
			if len(args) < 2 {
				fmt.Println("Expected key")
				continue
			}
			key := args[1]
			dhtKey := "/orcanet/" + key
			res, err := dht.GetValue(ctx, dhtKey)
			if err != nil {
				fmt.Printf("Failed to get record: %v\n", err)
				continue
			}
			fmt.Printf("Record: %s\n", res)

		case "GET_PROVIDERS":
			if len(args) < 2 {
				fmt.Println("Expected key")
				continue
			}
			key := args[1]
			data := []byte(key)
			hash := sha256.Sum256(data)
			mh, err := multihash.EncodeName(hash[:], "sha2-256")
			if err != nil {
				fmt.Printf("Error encoding multihash: %v\n", err)
				continue
			}
			c := cid.NewCidV1(cid.Raw, mh)
			providers := dht.FindProvidersAsync(ctx, c, 20)

			fmt.Println("Searching for providers...")
			for p := range providers {
				if p.ID == peer.ID("") {
					break
				}
				fmt.Printf("Found provider: %s\n", p.ID.String())
				for _, addr := range p.Addrs {
					fmt.Printf(" - Address: %s\n", addr.String())
				}
			}

		case "PUT":
			if len(args) < 3 {
				fmt.Println("Expected key and value")
				continue
			}
			key := args[1]
			value := args[2]
			dhtKey := "/orcanet/" + key
			log.Println(dhtKey)
			err := dht.PutValue(ctx, dhtKey, []byte(value))
			if err != nil {
				fmt.Printf("Failed to put record: %v\n", err)
				continue
			}
			// provideKey(ctx, dht, key)
			fmt.Println("Record stored successfully")

		case "PUT_PROVIDER":
			if len(args) < 2 {
				fmt.Println("Expected key")
				continue
			}
			key := args[1]
			provideKey(ctx, dht, key)
		default:
			fmt.Println("Expected GET, GET_PROVIDERS, PUT or PUT_PROVIDER")
		}
	}
}

// announce that this node can provide specific key
func provideKey(ctx context.Context, dht *dht.IpfsDHT, key string) error {
	data := []byte(key)
	hash := sha256.Sum256(data)
	mh, err := multihash.EncodeName(hash[:], "sha2-256")
	if err != nil {
		return fmt.Errorf("error encoding multihash: %v", err)
	}
	c := cid.NewCidV1(cid.Raw, mh)

	// Start providing the key
	err = dht.Provide(ctx, c, true)
	if err != nil {
		return fmt.Errorf("failed to start providing key: %v", err)
	}
	return nil
}

// allows node to share information about known peers
func handlePeerExchange(node host.Host) {
	relayInfo, _ := peer.AddrInfoFromString(relay_node_addr)
	node.SetStreamHandler("/orcanet/p2p", func(s network.Stream) {
		defer s.Close()

		buf := bufio.NewReader(s)
		peerAddr, err := buf.ReadString('\n')
		if err != nil {
			if err != io.EOF {
				fmt.Printf("error reading from stream: %v", err)
			}
		}
		peerAddr = strings.TrimSpace(peerAddr)
		var data map[string]interface{}
		err = json.Unmarshal([]byte(peerAddr), &data)
		if err != nil {
			fmt.Printf("error unmarshaling JSON: %v", err)
		}
		if knownPeers, ok := data["known_peers"].([]interface{}); ok {
			for _, peer := range knownPeers {
				fmt.Println("Peer:")
				if peerMap, ok := peer.(map[string]interface{}); ok {
					if peerID, ok := peerMap["peer_id"].(string); ok {
						if string(peerID) != string(relayInfo.ID) {
							connectToPeerUsingRelay(node, peerID)
						}
					}
				}
			}
		}
	})
}

func makeReservation(node host.Host) {
	ctx := globalCtx
	relayInfo, err := peer.AddrInfoFromString(relay_node_addr)
	if err != nil {
		log.Fatalf("Failed to create addrInfo from string representation of relay multiaddr: %v", err)
	}
	_, err = client.Reserve(ctx, node, *relayInfo)
	if err != nil {
		log.Fatalf("Failed to make reservation on relay: %v", err)
	}
	fmt.Printf("Reservation successfull \n")
}

func main() {
	node, dht, err := createLibp2pHost()
	if err != nil {
		log.Fatalf("Failed to create node: %s", err)
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	globalCtx = ctx

	fmt.Println("Node multiaddresses:", node.Addrs())
	fmt.Println("Node Peer ID:", node.ID())

	connectToPeer(node, relay_node_addr)     // connect to relay node
	makeReservation(node)                    // make reservation on realy node
	connectToPeer(node, bootstrap_node_addr) // connect to bootstrap node
	go handlePeerExchange(node)
	go handleInput(ctx, dht)

	defer node.Close()

	select {}
}
