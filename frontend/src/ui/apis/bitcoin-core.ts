// Bitcoin Core RPC configuration
const rpcUser = "your_rpc_username";
const rpcPassword = "your_rpc_password";
const rpcHost = "http://127.0.0.1"; // Default Bitcoin Core RPC host
const rpcPort = "8332"; // Default Bitcoin Core RPC port

// Function to create a wallet if it doesn't exist and generate an address
export const createWalletAndGenerateAddress = async (walletName: string) => {
  try {
    // Define the URL for the Bitcoin Core RPC call
    const url = `${rpcHost}:${rpcPort}`;

    // Step 1: Check if a wallet exists (list wallets)
    const listWallets = {
      jsonrpc: "1.0",
      id: "curltest",
      method: "listwallets",
      params: [],
    };

    // Request to list wallets
    const listResponse = await axios.post(url, listWallets, {
      auth: { username: rpcUser, password: rpcPassword },
      headers: { "Content-Type": "application/json" },
    });

    // If no wallets exist, create a new wallet
    if (listResponse.data.result.length === 0) {
      // Create a new wallet
      const createWalletData = {
        jsonrpc: "1.0",
        id: "curltest",
        method: "createwallet",
        params: [walletName],
      };

      await axios.post(url, createWalletData, {
        auth: { username: rpcUser, password: rpcPassword },
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 2: Generate a new address from the wallet
    const getAddressData = {
      jsonrpc: "1.0",
      id: "curltest",
      method: "getnewaddress",
      params: [],
    };

    const addressResponse = await axios.post(url, getAddressData, {
      auth: { username: rpcUser, password: rpcPassword },
      headers: { "Content-Type": "application/json" },
    });

    const address = addressResponse.data.result;
    console.log("Generated Address:", address);

    return address;
  } catch (error) {
    console.error("Error generating address:", error);
    throw error;
  }
};

export const createWallet = async (walletName: string) => {
  try {
    const response = await fetch("http://localhost:9378/createwallet", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ walletName }),
    });
    if (!response.ok) {
      throw new Error("Failed to create wallet");
    }
    const data = await response.json();
    console.log("Wallet created:", data);
  } catch (error) {
    console.error("Error generating wallet:", error);
  }
};

export const generateAddress = async () => {
  try {
    const response = await fetch("http://localhost:9378/generateaddress");
    if (!response.ok) {
      throw new Error("Failed to generate address");
    }
    const data = await response.json();
    console.log("New Address:", data.address);
    return data.address;
  } catch (error) {
    console.error("Error generating address:", error);
    return "";
  }
};

export const getBalance = async (address: string) => {
  try {
    const response = await fetch("http://localhost:9378/getbalance", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ address }),
    });
    if (!response.ok) {
      throw new Error("Failed to fetch balance");
    }
    const data = await response.json();
    console.log("Balance:", data.balance);
  } catch (error) {
    console.error("Error fetching balance:", error);
  }
};
