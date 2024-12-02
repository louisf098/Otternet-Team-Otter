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
    labelStr := r.URL.Query().Get("label")
    if labelStr == "" {
        http.Error(w, "Label parameter is missing", http.StatusBadRequest)
        return
    }
    cfg := config.NewConfig()
    btcClient := NewBitcoinClient(cfg)
    address, err := btcClient.GenerateNewAddress(labelStr)
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
    // Respond with the result of the createwallet RPC command
    json.NewEncoder(w).Encode(response)
}

func GetLabelFromAddressHandler(w http.ResponseWriter, r *http.Request) {
    fmt.Println("GenerateLabelFromAddressHandler triggered")
    
    // Get the address from the query parameter
    addressStr := r.URL.Query().Get("address")
    if addressStr == "" {
        http.Error(w, "Address parameter is missing", http.StatusBadRequest)
        return
    }

    // Initialize config and Bitcoin client
    cfg := config.NewConfig()
    btcClient := NewBitcoinClient(cfg)

    // Get the label for the given address
    label, err := btcClient.GetLabelFromAddress(addressStr)
    if err != nil {
        fmt.Printf("Error generating label: %v\n", err)
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    // Encode the response as JSON
    json.NewEncoder(w).Encode(map[string]string{"label": label})
}





