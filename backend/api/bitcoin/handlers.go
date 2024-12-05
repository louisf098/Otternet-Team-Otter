package bitcoin

import (
	"Otternet/backend/config"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
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
    // Mux here for getting query string
    w.Header().Set("Content-Type", "application/json")
	vars := mux.Vars(r)
	labelStr, exists := vars["walletName"]
	if !exists || labelStr == "" {
		http.Error(w, "Invalid wallet name", http.StatusBadRequest)
		return
	}
    fmt.Println("GenerateAddressHandler triggered")
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

func GenerateAddressWithLabelHandler(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
	vars := mux.Vars(r)
	walletName, walletExists := vars["walletName"]
    label, labelExists := vars["label"]
	if !walletExists || walletName == "" {
		http.Error(w, "Invalid wallet name", http.StatusBadRequest)
		return
	}
    if !labelExists || label == "" {
		http.Error(w, "Invalid label name", http.StatusBadRequest)
		return
	}
    fmt.Println("GenerateAddressHandler triggered")
    cfg := config.NewConfig()
    btcClient := NewBitcoinClient(cfg)
    address, err := btcClient.GenerateNewAddressWithLabel(walletName, label)
    if err != nil {
        fmt.Printf("Error generating address: %v\n", err)
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    json.NewEncoder(w).Encode(map[string]string{"address": address})
}

func GenerateWalletHandler(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
	vars := mux.Vars(r)
	labelStr, exists := vars["walletName"]
	if !exists || labelStr == "" {
		http.Error(w, "Invalid wallet name", http.StatusBadRequest)
		return
	}
    fmt.Println("CreateWalletHandler triggered")
    cfg := config.NewConfig()
    btcClient := NewBitcoinClient(cfg)
    response, err := btcClient.CreateNewWallet(labelStr)
    if err != nil {
        fmt.Printf("Error creating wallet: %v\n", err)
    }
    // Respond with the result of the createwallet RPC command
    json.NewEncoder(w).Encode(response)
}

func GetLabelFromAddressHandler(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
	vars := mux.Vars(r)
	walletName, walletExists := vars["walletName"]
    address, addressExists := vars["address"]
	if !walletExists || walletName == "" {
		http.Error(w, "Invalid wallet name", http.StatusBadRequest)
		return
	}
    if !addressExists || address == "" {
		http.Error(w, "Invalid label name", http.StatusBadRequest)
		return
	}
    fmt.Println("GenerateLabelFromAddressHandler triggered")
    // Initialize config and Bitcoin client
    cfg := config.NewConfig()
    btcClient := NewBitcoinClient(cfg)
    // Get the label for the given address
    label, err := btcClient.GetLabelFromAddress(walletName, address)
    if err != nil {
        fmt.Printf("Error generating label: %v\n", err)
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    // Encode the response as JSON
    json.NewEncoder(w).Encode(map[string]string{"label": label})
}

func CreateWalletAndAddressHandler(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
	vars := mux.Vars(r)
	labelStr, exists := vars["walletName"]
	if !exists || labelStr == "" {
		http.Error(w, "Invalid wallet name", http.StatusBadRequest)
		return
	}
    passStr := vars["passphrase"]
    fmt.Println("CreateWalletAndAddressHandler triggered")

    cfg := config.NewConfig()
    btcClient := NewBitcoinClient(cfg)

    // Create wallet
    walletName, err := btcClient.CreateNewWallet(labelStr)
    if err != nil {
        fmt.Printf("Error creating wallet: %v\n", err)
        return
    }

    // Generate address for the new wallet
    address, err := btcClient.GenerateNewAddress(walletName)
    if err != nil {
        fmt.Printf("Error generating public key: %v\n", err)
        return
    }

    _, err = btcClient.SetPassphrase(walletName, passStr)
    if err != nil {
        fmt.Printf("Error setting passphrase: %v\n", err)
    }

    json.NewEncoder(w).Encode(map[string]string{
        "walletName": walletName,
        "address":    address,
        "privkey":      passStr,
    })
}


func TransferCoinsHandler(w http.ResponseWriter, r *http.Request) {
    fmt.Println("TransferCoinsHandler triggered")

    // Parse parameters from path variables
    vars := mux.Vars(r)
    walletName := vars["walletName"]
    toAddress := vars["toAddress"]
    amountStr := vars["amount"]

    // Validate parameters
    if walletName == "" || toAddress == "" || amountStr == "" {
        http.Error(w, "'walletName', 'toAddress', or 'amount' parameter(s) are missing", http.StatusBadRequest)
        return
    }

    // Check if transaction amount is valid
    amount, err := strconv.ParseFloat(amountStr, 64)
    if err != nil || amount <= 0 {
        http.Error(w, "'amount' must be a valid positive number", http.StatusBadRequest)
        return
    }

    // Initialize config and Bitcoin client
    cfg := config.NewConfig()
    btcClient := NewBitcoinClient(cfg)

    // Perform coin transfer using Bitcoin RPC
    transactionID, err := btcClient.TransferCoins(walletName, toAddress, amount)
    if err != nil {
        fmt.Printf("Error with coin transaction: %v\n", err)
        http.Error(w, fmt.Sprintf("Failed to transfer coins: %v\n", err), http.StatusInternalServerError)
        return
    }

    // Encode JSON response with transaction ID
    json.NewEncoder(w).Encode(map[string]string{"transactionID": transactionID})
}
