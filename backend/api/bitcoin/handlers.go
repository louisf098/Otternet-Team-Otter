package bitcoin

import (
    "encoding/json"
    "fmt"
    "net/http"
    "Otternet/backend/config"
)

func GetBalanceHandler(w http.ResponseWriter, r *http.Request) {
    fmt.Println("GetBalanceHandler triggered")

    cfg := config.NewConfig()
    btcClient := NewBitcoinClient(cfg)
    balance, err := btcClient.GetBalance()
    if err != nil {
        fmt.Printf("Error fetching balance: %v\n", err)
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    json.NewEncoder(w).Encode(map[string]float64{"balance": balance})
}

func GenerateAddressHandler(w http.ResponseWriter, r *http.Request) {
    fmt.Println("GenerateAddressHandler triggered")

    cfg := config.NewConfig()
    btcClient := NewBitcoinClient(cfg)
    address, err := btcClient.GenerateNewAddress()
    if err != nil {
        fmt.Printf("Error generating address: %v\n", err)
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    json.NewEncoder(w).Encode(map[string]string{"address": address})
}

func GenerateWalletHandler(w http.ResponseWriter, r *http.Request) {
    fmt.Println("CreateWalletHandler triggered")

    cfg := config.NewConfig()
    btcClient := NewBitcoinClient(cfg)
    response, err := btcClient.CreateNewWallet()
    if err != nil {
        fmt.Printf("Error creating wallet: %v\n", err)
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    // Respond with the result of the createwallet RPC command
    json.NewEncoder(w).Encode(response)
}

