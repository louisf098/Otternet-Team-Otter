package bitcoin

import (
	"Otternet/backend/config"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strconv"

	"github.com/gorilla/mux"
)

func GetBalanceHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	vars := mux.Vars(r)
	walletName, exists := vars["walletName"]
	if !exists || walletName == "" {
		http.Error(w, "Invalid wallet name", http.StatusBadRequest)
		return
	}

	fmt.Printf("Fetching balance for wallet: %s\n", walletName)

	cfg := config.NewConfig()
	btcClient := NewBitcoinClient(cfg)

	balance, err := btcClient.GetBalance(walletName)
	if err != nil {
		fmt.Printf("Error fetching balance for wallet %s: %v\n", walletName, err)
		http.Error(w, "Failed to fetch balance", http.StatusInternalServerError)
		return
	}

	fmt.Printf("Balance for wallet %s: %f\n", walletName, balance)
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
	address, addressExists := vars["address"]
	if !addressExists || address == "" {
		http.Error(w, "Invalid bitcoin address", http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"status": "Invalid bitcoin address"})
		return
	}
	passphrase, passphraseExists := vars["passphrase"]
	if !passphraseExists || passphrase == "" {
		http.Error(w, "Invalid passphrase", http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"status": "Invalid passphrase"})
		return
	}
	fmt.Println("UnlockWalletHandler triggered")

	cfg := config.NewConfig()
	btcClient := NewBitcoinClient(cfg)

	validAddress, addressErr := btcClient.ValidateBitcoinAddress(address)
	if !validAddress || addressErr != nil {
		fmt.Printf("Error getting all wallets: %v\n", addressErr)
		json.NewEncoder(w).Encode(map[string]string{"status": "Invalid address"})
		return
	}

	// get all wallets
	walletNames, listWalletErr := btcClient.ListWallets()
	if listWalletErr != nil {
		fmt.Printf("Error getting all wallets: %v\n", listWalletErr)
		json.NewEncoder(w).Encode(map[string]string{"status": "error getting all wallets"})
		return
	}

	walletName := ""

	for i := 0; i < len(walletNames); i++ {
		ismywallet, ismywalletErr := btcClient.IsMyWallet(address, walletNames[i])
		if listWalletErr != nil {
			fmt.Printf("Error check if wallet belongs to user: %v\n", ismywalletErr)
			return
		}
		fmt.Printf("ismywallet: %v\n", ismywallet)
		if ismywallet {
			walletName = walletNames[i]
			break
		}
	}

	if walletName == "" {
		fmt.Printf("Wallet not found.\n")
		json.NewEncoder(w).Encode(map[string]string{"error": ""})
		return
	}

	// load wallet
	// walletName, err := btcClient.LoadWallet(walletName)
	// if err != nil {
	//     fmt.Printf("Error loading wallet: %v\n", err)
	//     return
	// }

	// unlock wallet
	unlockWalletErr := btcClient.UnlockWallet(walletName, passphrase)
	if unlockWalletErr != nil {
		fmt.Printf("Error unlocking wallet: %v\n", unlockWalletErr)
		json.NewEncoder(w).Encode(map[string]string{"status": unlockWalletErr.Error()})
		return
	}

	json.NewEncoder(w).Encode(map[string]string{"status": "unlocked", "walletName": walletName})
}
func LockWalletHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	vars := mux.Vars(r)
	walletName, exists := vars["walletName"]
	if !exists || walletName == "" {
		http.Error(w, "Invalid wallet name", http.StatusBadRequest)
		return
	}
	fmt.Println("LockWalletHandler triggered")

	cfg := config.NewConfig()
	btcClient := NewBitcoinClient(cfg)

	// get all wallets
	err := btcClient.LockWallet(walletName)
	if err != nil {
		fmt.Printf("Error locking wallet: %v\n", err)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{"status": "locked"})
}

func LoadAllWallets() error {
	fmt.Println("Loading all wallets...")

	cfg := config.NewConfig()
	btcClient := NewBitcoinClient(cfg)

	// Get all loaded wallets
	walletNames, listWalletErr := btcClient.ListWallets()
	if listWalletErr != nil {
		return fmt.Errorf("Error listing wallets: %v", listWalletErr)
	}

	for _, walletName := range walletNames {
		response, err := btcClient.LoadWallet(walletName)
		if err != nil {
			fmt.Printf("Error loading wallet %s: %v\n", walletName, err)
			continue // Skip this wallet and move to the next
		}

		name, ok := response["name"].(string)
		if !ok || name != walletName {
			fmt.Printf("Warning: Wallet %s not loaded as expected\n", walletName)
			continue
		}
	}

	fmt.Println("All wallets loaded successfully")
	return nil
}

func LoadAllWalletsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	if err := LoadAllWallets(); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{"status": "all wallets loaded"})
}

func GetTransactionsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	vars := mux.Vars(r)
	walletName, exists := vars["walletName"]
	if !exists || walletName == "" {
		http.Error(w, "Invalid wallet name", http.StatusBadRequest)
		return
	}
	fmt.Println("GetTransactionsHandler triggered")

	cfg := config.NewConfig()
	btcClient := NewBitcoinClient(cfg)

	// get all wallets
	transactions, err := btcClient.GetTransactions(walletName)
	if err != nil {
		fmt.Printf("Error fetching transactions: %v\n", err)
		return
	}

	json.NewEncoder(w).Encode(transactions)
}

func TransferCoinsHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Println("TransferCoinsHandler triggered")

	// Parse parameters from path variables
	vars := mux.Vars(r)
	walletName := vars["walletName"]
	toAddress := vars["toAddress"]
	amountStr := vars["amount"]
	label := vars["label"]

	// Validate parameters
	if walletName == "" || toAddress == "" || amountStr == "" || label == "" {
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
	transactionID, err := btcClient.TransferCoins(walletName, toAddress, amount, label)
	if err != nil {
		fmt.Printf("Error with coin transaction: %v\n", err)
		http.Error(w, fmt.Sprintf("Failed to transfer coins: %v\n", err), http.StatusInternalServerError)
		return
	}

	// Encode JSON response with transaction ID
	json.NewEncoder(w).Encode(map[string]string{"transactionID": transactionID})
}

func MineCoinsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	vars := mux.Vars(r)
	address, addressExists := vars["address"]
	if !addressExists || address == "" {
		http.Error(w, "address", http.StatusBadRequest)
		return
	}
	amountStr, amountExists := vars["amount"]
	if !amountExists || amountStr == "" {
		http.Error(w, "Invalid amount to mine", http.StatusBadRequest)
		return
	}
	amount, err := strconv.Atoi(amountStr)
	if err != nil || amount <= 0 {
		http.Error(w, "Amount must be a positive integer", http.StatusBadRequest)
		return
	}
	fmt.Println("MineCoinsHandler triggered")

	cfg := config.NewConfig()
	btcClient := NewBitcoinClient(cfg)

	// get all wallets
	blockHashes, err := btcClient.MineCoins(address, amount)
	if err != nil {
		fmt.Printf("Error mining coins: %v\n", err)
		http.Error(w, "Failed to mine coins: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Respond with the block hashes
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status": "success",
		"blocks": blockHashes,
	})
}

func BackupWalletsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	// Parse request body
	var requestBody struct {
		WalletName  string `json:"walletName"`
		Destination string `json:"destination"`
	}

	if err := json.NewDecoder(r.Body).Decode(&requestBody); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusBadRequest)
		return
	}

	// Validate fields
	if requestBody.WalletName == "" {
		http.Error(w, "Invalid walletName", http.StatusBadRequest)
		return
	}

	if requestBody.Destination == "" {
		http.Error(w, "Invalid destination", http.StatusBadRequest)
		return
	}

	decodeDestination, err := url.QueryUnescape(requestBody.Destination)
	if err != nil {
        json.NewEncoder(w).Encode(map[string]string{"status": "wallet backup failed: " + err.Error()})
		return
	}

	cfg := config.NewConfig()
	btcClient := NewBitcoinClient(cfg)

	if err := btcClient.BackupWallet(requestBody.WalletName, decodeDestination); err != nil {
        json.NewEncoder(w).Encode(map[string]string{"status": err.Error()})
		return
	}

	json.NewEncoder(w).Encode(map[string]string{"status": "wallet backup successful"})
}
