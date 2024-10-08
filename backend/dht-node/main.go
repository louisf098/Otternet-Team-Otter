package main

import (
	"bytes"
	"context"
	"crypto/sha256"
	"fmt"
	"log"

	"github.com/libp2p/go-libp2p"
	dht "github.com/libp2p/go-libp2p-kad-dht"
	record "github.com/libp2p/go-libp2p-record"
	"github.com/libp2p/go-libp2p/core/crypto"
	"github.com/libp2p/go-libp2p/core/host"
	"github.com/libp2p/go-libp2p/core/peer"
	"github.com/libp2p/go-libp2p/core/peerstore"
	"github.com/libp2p/go-libp2p/p2p/protocol/circuitv2/client"
	"github.com/multiformats/go-multiaddr"
)

var id = []byte("114295851") // This is used as a seed to generate a unique private key, which then generates our node's peer ID. Currently this is Andrew's SBU ID.
var relay_node_addr = "/ip4/130.245.173.221/tcp/4001/p2p/12D3KooWDpJ7As7BWAwRMfu1VU2WCqNjvq387JEYKDBj4kx6nXTN"
var bootstrap_node_addr = "/ip4/130.245.173.222/tcp/61000/p2p/12D3KooWQd1K1k8XA9xVEzSAu7HUCodC7LJB6uW5Kw4VwkRdstPE"

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

func createLibp2pHost() host.Host {
	privKey, err := generatePrivateKeyFromSeed(id)
	if err != nil {
		log.Fatal(err)
	}
	customAddr, err := multiaddr.NewMultiaddr("/ip4/0.0.0.0/tcp/0")
	if err != nil {
		log.Fatal(err)
	}
	relayInfo, err := peer.AddrInfoFromString(relay_node_addr) // converts multiaddr string to peer.addrInfo
	if err != nil {
		log.Fatal(err)
	}
	node, err := libp2p.New(
		libp2p.ListenAddrs(customAddr),
		libp2p.Identity(privKey),
		libp2p.EnableAutoRelayWithStaticRelays([]peer.AddrInfo{*relayInfo}),
		libp2p.EnableRelayService(),
	)
	if err != nil {
		log.Fatal(err)
	}
	return node
}

func setupDHT(ctx context.Context, h host.Host) *dht.IpfsDHT {
	// Set up the DHT instance
	kadDHT, err := dht.New(ctx, h, dht.Mode(dht.ModeClient))
	if err != nil {
		log.Fatal(err)
	}

	// Configure the DHT to use the custom validator
	kadDHT.Validator = record.NamespacedValidator{
		"orcanet": &CustomValidator{}, // Add a custom validator for the "orcanet" namespace
	}

	// Bootstrap the DHT (connect to other peers to join the DHT network)
	err = kadDHT.Bootstrap(ctx)
	if err != nil {
		log.Fatal(err)
	}

	return kadDHT
}

func connectToPeer(node host.Host, peerAddr string) {

	addr, err := multiaddr.NewMultiaddr(peerAddr) // convert string to Multiaddr
	if err != nil {
		log.Printf("Failed to parse peer address: %s", err)
		return
	}

	info, err := peer.AddrInfoFromP2pAddr(addr) // returns a peer.AddrInfo, containing the multiaddress and ID of the node.
	if err != nil {
		log.Printf("Failed to get AddrInfo from Multiaddr: %s", err)
		return
	}

	err = node.Connect(context.Background(), *info)
	if err != nil {
		log.Printf("Failed to connect to peer: %s", err)
		return
	}
	// after successful connection to the peer, add it to the peerstore
	// Peerstore is a local storage of the host(peer) where it stores the other peers
	node.Peerstore().AddAddrs(info.ID, info.Addrs, peerstore.PermanentAddrTTL)

	fmt.Println("Connected to:", info.ID)
}

func makeReservation(node host.Host) {
	ctx := context.Background()
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
