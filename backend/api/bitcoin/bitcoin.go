package bitcoin

import (
	"Otternet/backend/config"
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

type BitcoinRPCRequest struct {
    Jsonrpc string        `json:"jsonrpc"`
    Method  string        `json:"method"`
    Params  []interface{} `json:"params"`
    ID      int           `json:"id"`
}

type BitcoinClient struct {
    Config *config.Config
}

func NewBitcoinClient(cfg *config.Config) *BitcoinClient {
    fmt.Printf("Creating BitcoinClient with URL: %s\n", cfg.BitcoinRPCURL)
    fmt.Printf("Bitcoin RPC User: %s\n", cfg.BitcoinRPCUser)
    fmt.Printf("Bitcoin RPC Password: %s\n", cfg.BitcoinRPCPassword)
    return &BitcoinClient{Config: cfg}
}

func (bc *BitcoinClient) call(method string, params []interface{}, walletName string) (map[string]interface{}, error) {
    url := fmt.Sprintf("%s/wallet/%s", bc.Config.BitcoinRPCURL, walletName)
    reqBody := BitcoinRPCRequest{
        Jsonrpc: "1.0",
        Method:  method,
        Params:  params,
        ID:      1,
    }

    jsonReq, err := json.Marshal(reqBody)
    if err != nil {
        return nil, err
    }

    fmt.Printf("Bitcoin RPC Request URL: %s\n", url)
    fmt.Printf("Request Body: %s\n", jsonReq)

    req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonReq))
    if err != nil {
        return nil, err
    }

    req.SetBasicAuth(bc.Config.BitcoinRPCUser, bc.Config.BitcoinRPCPassword)
    req.Header.Set("Content-Type", "application/json")

    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    var result map[string]interface{}
    if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
        return nil, err
    }

    fmt.Printf("Bitcoin RPC Response: %+v\n", result)

    return result, nil
}

func (bc *BitcoinClient) ValidateBitcoinAddress(address string) (bool, error) {
	response, err := bc.call("validateaddress", []interface{}{address}, "")
    if err != nil {
        return false, fmt.Errorf("error validating address: %w", err)
    }

    result, ok := response["result"].(map[string]interface{})
    if !ok {
        return false, fmt.Errorf("unexpected result type: %T", response["result"])
    }

    isValid, _ := result["isvalid"].(bool)
    return isValid, nil
}

func (bc *BitcoinClient) IsMyWallet(addressStr string, walletName string) (bool, error) {
    // Call the "getaddressinfo" RPC method
    response, err := bc.call("getaddressinfo", []interface{}{addressStr}, walletName)
    if err != nil {
        return false, fmt.Errorf("failed to retrieve address info: %w", err)
    }

    // Extract the "ismine" field from the result map
    ismine, ok := response["result"].(map[string]interface{})["ismine"].(bool)
    if !ok {
        return false, fmt.Errorf("address does not belong to wallet")
    }

    return ismine, nil
}

func (bc *BitcoinClient) GetBalance(walletName string) (float64, error) {
    response, err := bc.call("getbalance", []interface{}{"*"}, walletName)
    if err != nil {
        return 0, err
    }
    balance, ok := response["result"].(float64)
    if !ok {
        return 0, fmt.Errorf("unexpected result type")
    }
    return balance, nil
}

func (bc *BitcoinClient) GenerateNewAddress(walletName string) (string, error) {
    response, err := bc.call("getnewaddress", []interface{}{}, walletName)
    if err != nil {
        return "", err
    }
    address, ok := response["result"].(string)
    if !ok {
        return "", fmt.Errorf("unexpected result type")
    }
    return address, nil
}

func (bc *BitcoinClient) GenerateNewAddressWithLabel(walletName string, label string) (string, error) {
    response, err := bc.call("getnewaddress", []interface{}{label}, walletName)
    if err != nil {
        return "", fmt.Errorf("failed to generate new address: %w", err)
    }

    // Extract the "result" field containing the address
    address, ok := response["result"].(string)
    if !ok {
        return "", fmt.Errorf("unexpected result type; expected string")
    }

    return address, nil
}

func (bc *BitcoinClient) CreateNewWallet(walletName string) (string, error) {
    // Call the "createwallet" RPC with the wallet name
    response, err := bc.call("createwallet", []interface{}{walletName}, "")
    if err != nil {
        return "", err
    }

    // Extract the "result" field safely
    result, ok := response["result"].(map[string]interface{})
    if !ok {
        return "", fmt.Errorf("unexpected type for 'result': expected map[string]interface{}, got %T", response["result"])
    }

    return result["name"].(string), nil
}

func (bc *BitcoinClient) MineCoins(address string, amount int) ([]string, error) {
    // Call the "generatetoaddress" RPC
    response, err := bc.call("generatetoaddress", []interface{}{amount, address}, "")
    if err != nil {
        return nil, fmt.Errorf("failed to mine coins: %w", err)
    }

    // Extract the "result" field as a slice of strings (block hashes)
    blockHashes, ok := response["result"].([]interface{})
    if !ok {
        return nil, fmt.Errorf("unexpected type for 'result': expected []interface{}, got %T", response["result"])
    }

    // Convert []interface{} to []string
    hashes := make([]string, len(blockHashes))
    for i, hash := range blockHashes {
        hashes[i], ok = hash.(string)
        if !ok {
            return nil, fmt.Errorf("unexpected type in block hashes: expected string, got %T", hash)
        }
    }

    return hashes, nil
}

// func (bc *BitcoinClient) GetLabelFromAddress(addressStr string) (string, error) {
//     // Call the "getaddressinfo" RPC method
//     response, err := bc.call("getaddressinfo", []interface{}{addressStr})
//     if err != nil {
//         return "", fmt.Errorf("failed to retrieve address info: %w", err)
//     }

//     // Extract the "label" field from the result map
//     label, ok := response["label"].(string)
//     if !ok {
//         return "", fmt.Errorf("label not found for address")
//     }

//     return label, nil
// }

func (bc *BitcoinClient) GetLabelFromAddress(walletName string, addressStr string) (string, error) {
    // Call the "getaddressinfo" RPC method
    response, err := bc.call("getaddressinfo", []interface{}{addressStr}, walletName)
    if err != nil {
        return "", fmt.Errorf("failed to retrieve address info: %w", err)
    }

    // Access the "result" field, which should be a nested map
    result, ok := response["result"].(map[string]interface{})
    if !ok {
        return "", fmt.Errorf("unexpected response format from getaddressinfo")
    }

    // Access the "labels" field within "result", expecting an array
    labels, ok := result["labels"].([]interface{})
    if !ok || len(labels) == 0 {
        return "", fmt.Errorf("label not found for address")
    }
    // Extract the first label in the array and assert it as a string
    label, ok := labels[0].(string)
    if !ok {
        return "", fmt.Errorf("unexpected label format")
    }

    return label, nil
}

func (bc *BitcoinClient) SetPassphrase(walletName string, passphrase string) (string, error) {
    response, err := bc.call("encryptwallet", []interface{}{passphrase}, walletName)
    if err != nil {
        return "", err
    }
    result, ok := response["result"].(string)
    if !ok {
        return "", fmt.Errorf("Failed to set passphrase.")
    }
    return result, nil
}

func (bc *BitcoinClient) LoadWallet(walletName string) (map[string]interface{}, error) {
    response, err := bc.call("loadwallet", []interface{}{walletName}, walletName)
    if err != nil {
        return nil, err
    }
    // Type assertion for result
    result, ok := response["result"].(map[string]interface{})
    if !ok {
        return nil, fmt.Errorf("unexpected result format for wallet: %v", response["result"])
    }

    return result, nil
}

func (bc *BitcoinClient) UnlockWallet(walletName string, passphrase string) error  {
    response, err := bc.call("walletpassphrase", []interface{}{passphrase, 600}, walletName)
    if err != nil {
        return fmt.Errorf("Failed to unlock wallet: %w", err)
    }
    if response != nil {
        if response["error"]!= nil {
            return fmt.Errorf(response["error"].(map[string]interface{})["message"].(string))
        }
    }
    return nil
}

func (bc *BitcoinClient) ListWallets() ([]string, error)   {
    response, err := bc.call("listwallets", []interface{}{}, "")
    if err != nil {
        return nil, fmt.Errorf("failed to list all wallets: %w", err)
    }

    // parse the result from the response
    result, ok := response["result"].([]interface{})
    if !ok {
        return nil, fmt.Errorf("unexpected result type: %T", response["result"])
    }

    // convert []interface{} to []string
    wallets := make([]string, len(result))
    for i, wallet := range result {
        wallets[i], ok = wallet.(string)
        if !ok {
            return nil, fmt.Errorf("unexpected wallet name type: %T", wallet)
        }
    }

    return wallets, nil
}

func (bc *BitcoinClient) LockWallet(walletName string) error   {
    _, err := bc.call("walletlock", []interface{}{}, walletName)
    if err != nil {
        return fmt.Errorf("Failed to lock wallet: %w", err)
    }
    return nil
}

func (bc *BitcoinClient) GetTransactions(walletName string) ([]map[string]interface{}, error) {
    response, err := bc.call("listtransactions", []interface{}{}, walletName)
    if err != nil {
        return nil, fmt.Errorf("failed to get transactions: %w", err)
    }

    // Parse the result from the response
    result, ok := response["result"].([]interface{})
    if !ok {
        return nil, fmt.Errorf("unexpected result type: expected []interface{}, got %T", response["result"])
    }

    // Convert []interface{} to []map[string]interface{} for better type safety
    transactions := make([]map[string]interface{}, len(result))
    for i, tx := range result {
        transaction, ok := tx.(map[string]interface{})
        if !ok {
            return nil, fmt.Errorf("unexpected transaction format: expected map[string]interface{}, got %T", tx)
        }
        transactions[i] = transaction
    }

    return transactions, nil
}

func (bc *BitcoinClient) TransferCoins(walletName string, toAddress string, amount float64, label string) (string, error) {
    // label for determining whether transaction is file or proxy related
    response, err := bc.call("sendtoaddress", []interface{}{toAddress, amount, "", label}, walletName)
    if err != nil {
        return "", fmt.Errorf("failed to send coins: %w", err)
    }

    // Extract Transaction ID
    transactionID, ok := response["result"].(string)
    if !ok {
        return "", fmt.Errorf("unexpected response format; no transaction ID found")
    }

    return transactionID, nil
}
