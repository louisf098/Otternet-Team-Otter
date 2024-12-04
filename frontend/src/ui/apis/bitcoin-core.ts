// Bitcoin Core RPC configuration
const rpcUser = "your_rpc_username";
const rpcPassword = "your_rpc_password";
const rpcHost = "http://127.0.0.1"; // Default Bitcoin Core RPC host
const rpcPort = "8332"; // Default Bitcoin Core RPC port

// Function to create a wallet if it doesn't exist and generate an address
export const createWalletAndGenerateAddress = async (walletName: string, passphrase: string) => {
  try {
    const response = await fetch(
      `http://localhost:9378/createwalletandaddress/${walletName}/${passphrase}`,
      {
        method: "GET",
      }
    );
    if (!response.ok) {
      throw new Error("Failed to create wallet");
    }
    const data = await response.json();
    console.log("Wallet created:", data);
    return data;
  } catch (error) {
    console.error("Error generating wallet:", error);
  }
};

export const generateAddressWithLabel = async (label: string) => {
  try {
    const response = await fetch(`http://localhost:9378/newaddress/${label}`, {
      method: "GET",
    });
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

export const generateAddress = async () => {
  try {
    const response = await fetch(`http://localhost:9378/newaddress`, {
      method: "GET",
    });
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

export const unlockWallet = async(walletName: string, passphrase: string) => {
  try {
    const response = await fetch(
      `http://localhost:9378/unlockwallet/${walletName}/${passphrase}`,
      {
        method: "GET",
      }
    );
    if (!response.ok) {
      throw new Error("Failed to unlock wallet");
    }
    const data = await response.json();
    console.log("Status:", data.status);
    return data.status;
  } catch (error) {
    console.error("Error unlocking wallet:", error);
  }
}
