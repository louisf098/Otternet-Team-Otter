package bitcoin

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
    "Otternet/backend/config"
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

func (bc *BitcoinClient) call(method string, params []interface{}) (map[string]interface{}, error) {
    url := bc.Config.BitcoinRPCURL
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

func (bc *BitcoinClient) GetBalance() (float64, error) {
    response, err := bc.call("getbalance", []interface{}{"*"})
    if err != nil {
        return 0, err
    }
    balance, ok := response["result"].(float64)
    if !ok {
        return 0, fmt.Errorf("unexpected result type")
    }
    return balance, nil
}

func (bc *BitcoinClient) GenerateNewAddress(label string) (string, error) {
    response, err := bc.call("getnewaddress", []interface{}{label})
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

func (bc *BitcoinClient) GetLabelFromAddress(addressStr string) (string, error) {
    // Call the "getaddressinfo" RPC method
    response, err := bc.call("getaddressinfo", []interface{}{addressStr})
    if err != nil {
        return "", fmt.Errorf("failed to retrieve address info: %w", err)
    }

    // Print the full response for debugging
    fmt.Printf("Full response from getaddressinfo: %+v\n", response)


    // Access the "result" field, which should be a nested map
    result, ok := response["result"].(map[string]interface{})
    if !ok {
        return "", fmt.Errorf("unexpected response format from getaddressinfo")
    }
    // fmt.Printf("Full response from result: %+v\n", result["labels"].([]interface{}))

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


