package bitcoin

import (
	"Otternet/backend/config"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
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

func TransferCoinsHandler(w http.ResponseWriter, r *http.Request) {
    fmt.Println("TransferCoinsHandler triggered")

    // Parse transfer query parameters
    fromAddress := r.URL.Query().Get(("from"))
    toAddress := r.URL.Query().Get("to")
    amountStr := r.URL.Query().Get("amount")

    // Validate parameters
    if fromAddress == "" || toAddress == "" || amountStr == "" {
        http.Error(w, "'from', 'to', or 'amount' parameter(s) are missing", http.StatusBadRequest)
        return
    }

    // Check if transaction amount is valid
    amount, err := strconv.ParseFloat(amountStr, 64)
    if err != nil || amount <= 0 {
        http.Error(w, "'amount' transaction must be a valid positive number", http.StatusBadRequest)
        return
    }

    // Initialize config and Bitcoin client
    cfg := config.NewConfig()
    btcClient := NewBitcoinClient(cfg)

    // Perform coin transfer using Bitcoin RPC
    transactionID, err := btcClient.TransferCoins(toAddress, amount)
    if err != nil {
        fmt.Printf("Error with coin transaction: %v\n", err)
        http.Error(w, fmt.Sprintf("Failed to transfer coins: %v\n", err), http.StatusInternalServerError)
        return
    }

    // Encode JSON response with transaction ID
    json.NewEncoder(w).Encode(map[string]string{"transactionID": transactionID})
}
