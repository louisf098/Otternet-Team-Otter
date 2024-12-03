package bitcoin

import (
    "encoding/json"
    "fmt"
    "net/http"
    "Otternet/backend/config"
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
    fmt.Println("GenerateAddressHandler triggered")
    cfg := config.NewConfig()
    btcClient := NewBitcoinClient(cfg)
    address, err := btcClient.GenerateNewAddress("")
    if err != nil {
        fmt.Printf("Error generating address: %v\n", err)
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    json.NewEncoder(w).Encode(map[string]string{"address": address})
}

func GenerateAddressWithLabelHandler(w http.ResponseWriter, r *http.Request) {
    fmt.Println("GenerateAddressHandler triggered")
    labelStr := r.URL.Query().Get("label")
    if labelStr == "" {
        http.Error(w, "Label parameter is missing", http.StatusBadRequest)
        return
    }
    cfg := config.NewConfig()
    btcClient := NewBitcoinClient(cfg)
    address, err := btcClient.GenerateNewAddressWithLabel(labelStr)
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
        return
    }

    json.NewEncoder(w).Encode(map[string]string{
        "walletName": walletName,
        "address":    address,
        "passphrase": passStr,
    })
}

func UnlockWalletHandler(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
	vars := mux.Vars(r)
	walletName, exists := vars["walletName"]
	if !exists || walletName == "" {
		http.Error(w, "Invalid wallet name", http.StatusBadRequest)
		return
	}
    passphrase := vars["passphrase"]
    fmt.Println("CreateWalletAndAddressHandler triggered")

    cfg := config.NewConfig()
    btcClient := NewBitcoinClient(cfg)

    // load wallet
    walletName, err := btcClient.LoadWallet(walletName)
    if err != nil {
        fmt.Printf("Error loading wallet: %v\n", err)
        return
    }

    // unlock wallet
    err = btcClient.UnlockWallet(walletName, passphrase)
    if err != nil {
        fmt.Printf("Error unlocking wallet: %v\n", err)
        return
    }

    json.NewEncoder(w).Encode(map[string]string{"status": "unlocked"})
}


