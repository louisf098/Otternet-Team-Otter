package handlers

import (
	"Otternet/backend/global_wallet"
	"log"

	"github.com/libp2p/go-libp2p/core/host"
	"github.com/libp2p/go-libp2p/core/network"
	"github.com/libp2p/go-libp2p/core/protocol"
)

var WalletAddressReqHandler = protocol.ID("/otternet/walletAddressRequest")

func HandleWalletAddressRequests(h host.Host) {
	h.SetStreamHandler(WalletAddressReqHandler, func(s network.Stream) {
		defer s.Close()
		walletAddr := global_wallet.WalletAddr
		_, err := s.Write([]byte(walletAddr))
		if err != nil {
			log.Printf("Error sending wallet address: %v", err)
		}
	})
}
