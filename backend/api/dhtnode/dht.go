package dhtnode

import (
	"bufio"
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"io"
	"log"
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

var id = []byte("114295851") // Seed used to generate node's private key & peer ID
var RelayNodeAddr = "/ip4/130.245.173.221/tcp/4001/p2p/12D3KooWDpJ7As7BWAwRMfu1VU2WCqNjvq387JEYKDBj4kx6nXTN"
var BootstrapNodeAddr = "/ip4/130.245.173.222/tcp/61000/p2p/12D3KooWQd1K1k8XA9xVEzSAu7HUCodC7LJB6uW5Kw4VwkRdstPE"

// Encapsulates the host and DHT for easy access
type DHTNode struct {
	Host host.Host
	DHT  *dht.IpfsDHT
	Ctx  context.Context
}

// NewDHTNode initializes and configures a libp2p host with DHT support
func CreateLibp2pHost() (*DHTNode, error) {
	ctx := context.Background()
	seed := []byte(id)

	// configure to listen on any port
	customAddr, err := multiaddr.NewMultiaddr("/ip4/0.0.0.0/tcp/0")
	if err != nil {
		return nil, fmt.Errorf("failed to parse multiaddr: %w", err)
	}

	// generate node identity
	privKey, err := GeneratePrivateKeyFromSeed(seed)
	if err != nil {
		log.Fatal(err)
	}

	// parse relay address to multiaddress
	relayAddr, err := multiaddr.NewMultiaddr(RelayNodeAddr)
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
		return nil, err
	}

	// start relay service
	_, err = relay.New(node)
	if err != nil {
		log.Printf("Failed to instantiate the relay: %v", err)
	}

	// start DHT client mode
	kadDHT, err := dht.New(ctx, node, dht.Mode(dht.ModeClient))
	if err != nil {
		return nil, err
	}

	// create validator for DHT
	namespacedValidator := record.NamespacedValidator{
		"orcanet": &CustomValidator{},
	}
	kadDHT.Validator = namespacedValidator

	// bootstrap DHT
	err = kadDHT.Bootstrap(ctx)
	if err != nil {
		return nil, err
	}
	fmt.Println("DHT bootstrap complete.")

	// set up notifications for new connections
	node.Network().Notify(&network.NotifyBundle{
		ConnectedF: func(n network.Network, conn network.Conn) {
			fmt.Printf("Notification: New peer connected %s\n", conn.RemotePeer().String())
		},
	})

	node.Network().Peers()

	dhtNode := &DHTNode{
		Host: node,
		DHT:  kadDHT,
		Ctx:  ctx,
	}

	return dhtNode, nil
}

// creates a deterministic private key to maintain identity of node
func GeneratePrivateKeyFromSeed(seed []byte) (crypto.PrivKey, error) {
	hash := sha256.Sum256(seed)
	privKey, _, err := crypto.GenerateEd25519Key(
		bytes.NewReader(hash[:]),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to generate private key: %w", err)
	}
	return privKey, nil
}

type CustomValidator struct{}

func (v *CustomValidator) Validate(key string, value []byte) error {
	return nil
}

func (v *CustomValidator) Select(key string, vals [][]byte) (int, error) {
	return 0, nil
}

// establishes direct connection to peer given their address
func (dhtNode *DHTNode) ConnectToPeer(peerAddr string) {

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
	err = dhtNode.Host.Connect(context.Background(), *info)
	if err != nil {
		log.Printf("Failed to connect to peer: %s", err)
		return
	}

	// store peer information permanently
	dhtNode.Host.Peerstore().AddAddrs(info.ID, info.Addrs, peerstore.PermanentAddrTTL)
	fmt.Println("Connected to:", info.ID)
}

func (dhtNode *DHTNode) ConnectToPeerUsingRelay(targetPeerID string) {
	ctx := dhtNode.Ctx
	targetPeerID = strings.TrimSpace(targetPeerID)
	relayAddr, err := multiaddr.NewMultiaddr(RelayNodeAddr)
	if err != nil {
		log.Printf("Failed to create relay multiaddr: %v", err)
		return
	}
	peerMultiaddr := relayAddr.Encapsulate(multiaddr.StringCast("/p2p-circuit/p2p/" + targetPeerID))
	relayedAddrInfo, err := peer.AddrInfoFromP2pAddr(peerMultiaddr)
	if err != nil {
		log.Println("Failed to get relayed AddrInfo: %w", err)
		return
	}
	// Connect to the peer through the relay
	err = dhtNode.Host.Connect(ctx, *relayedAddrInfo)
	if err != nil {
		log.Println("Failed to connect to peer through relay: %w", err)
		return
	}
	fmt.Printf("Connected to peer via relay: %s\n", targetPeerID)
}

func (dhtNode *DHTNode) HandlePeerExchange() {
	relayInfo, _ := peer.AddrInfoFromString(RelayNodeAddr)
	dhtNode.Host.SetStreamHandler("/orcanet/p2p", func(s network.Stream) {
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
			fmt.Printf("error unmarshalling data: %v", err)
		}
		if knownPeers, ok := data["known_peers"].([]interface{}); ok {
			for _, peerItem := range knownPeers {
				fmt.Println("Peer:")
				if peerMap, ok := peerItem.(map[string]interface{}); ok {
					if peerID, ok := peerMap["peer_id"].(string); ok {
						if peerID != relayInfo.ID.String() {
							dhtNode.ConnectToPeerUsingRelay(peerID)
						}
					}
				}
			}
		}
	})
}

// makeReservation makes a reservation on the relay node
func (dhtNode *DHTNode) MakeReservation() {
	ctx := dhtNode.Ctx
	relayInfo, err := peer.AddrInfoFromString(RelayNodeAddr)
	if err != nil {
		log.Fatalf("Failed to create addrInfo from string representation of relay multiaddr: %v", err)
	}
	_, err = client.Reserve(ctx, dhtNode.Host, *relayInfo)
	if err != nil {
		log.Fatalf("Failed to make reservation on relay: %v", err)
	}
	fmt.Printf("Reservation successful \n")
}

// announces that this node can provide a specific key
func (dhtNode *DHTNode) ProvideKey(key string) error {
	data := []byte(key)
	hash := sha256.Sum256(data)
	mh, err := multihash.EncodeName(hash[:], "sha2-256")
	if err != nil {
		return fmt.Errorf("error encoding multihash: %v", err)
	}
	c := cid.NewCidV1(cid.Raw, mh)

	// Start providing the key
	err = dhtNode.DHT.Provide(dhtNode.Ctx, c, true)
	if err != nil {
		return fmt.Errorf("failed to start providing key: %v", err)
	}
	fmt.Println("Successfully providing key")
	return nil
}

// stores a value in the DHT under the given key
func (dhtNode *DHTNode) PutValue(key string, value string) error {
	dhtKey := "/orcanet/" + key
	err := dhtNode.DHT.PutValue(dhtNode.Ctx, dhtKey, []byte(value))
	if err != nil {
		return fmt.Errorf("failed to put record: %v", err)
	}
	fmt.Println("Record stored successfully")
	return nil
}

// retrieves a value from the DHT for the given key
func (dhtNode *DHTNode) GetValue(key string) (string, error) {
	dhtKey := "/orcanet/" + key
	res, err := dhtNode.DHT.GetValue(dhtNode.Ctx, dhtKey)
	if err != nil {
		fmt.Printf("GetValue Error: %v", err)
	}
	return string(res), nil
}

// retrieve a list of providers for the given file hash, returns the peer IDs of the providers
func (dhtNode *DHTNode) FindProviders(key string) ([]peer.AddrInfo, error) {
	fileHash := cid.NewCidV1(cid.Raw, []byte(key))
	providers, err := dhtNode.DHT.FindProviders(dhtNode.Ctx, fileHash)
	if err != nil {
		return nil, fmt.Errorf("failed to find providers: %v", err)
	}
	return providers, nil
}

// Shut down DHT Node
func (dhtNode *DHTNode) Close() error {
	return dhtNode.Host.Close()
}
