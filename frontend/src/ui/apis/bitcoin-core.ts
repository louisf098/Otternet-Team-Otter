import { Transaction } from "../interfaces/Transactions";

// Function to create a wallet if it doesn't exist and generate an address
export const createWallet = async (walletName: string, passphrase: string) => {
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
    console.log("Wallet created:");
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

export const getBalance = async (walletName: string) => {
  try {
    const response = await fetch(
      `http://localhost:9378/getbalance/${walletName}`,
      {
        method: "GET",
      }
    );
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch balance: ${errorText}`);
    }
    const data = await response.json();
    return data.balance;
  } catch (error) {
    console.error("Error fetching balance:", error);
  }
};

export const unlockWallet = async (address: string, passphrase: string) => {
  try {
    const response = await fetch(
      `http://localhost:9378/unlockwallet/${address}/${passphrase}`,
      {
        method: "GET",
      }
    );
    if (!response.ok) {
      throw new Error("Failed to unlock wallet");
    }
    const data = await response.json();
    console.log("Status:", data.status);
    return data;
  } catch (error) {
    console.error("Error unlocking wallet:", error);
  }
};

export const lockWallet = async (walletName: string) => {
  try {
    const response = await fetch(
      `http://localhost:9378/lockwallet/${walletName}`,
      {
        method: "GET",
      }
    );
    if (!response.ok) {
      throw new Error("Failed to lock wallet");
    }
    const data = await response.json();
    console.log("Status:", data.status);
    return data.status;
  } catch (error) {
    console.error("Error locking wallet:", error);
  }
};

export const getTransactions = async (walletName: string) => {
  try {
    const response = await fetch(
      `http://localhost:9378/gettransactions/${walletName}`,
      {
        method: "GET",
      }
    );
    if (!response.ok) {
      throw new Error("Failed fetching transactions");
    }
    const data = await response.json();
    const transactions: Transaction[] = data.map((tx: any) => ({
      address: tx.address || "N/A", // Default to "N/A" if address is missing
      amount: tx.amount || 0, // Default to 0 if amount is missing
      status: tx.confirmations > 0 ? "completed" : "pending", // Assume category is the status
      timeReceived: new Date(tx.time * 1000), // Convert UNIX timestamp to Date
      category: tx.category || "",
      blockhash: tx.blockhash,
    }));

    console.log("Parsed Transactions:", transactions);
    return transactions;
  } catch (error) {
    console.error("Error fetching transactions:", error);
export const mineCoins = async (address: string, amount: number) => {
  try {
    const response = await fetch(
      `http://localhost:9378/minecoins/${address}/${amount}`,
      {
        method: "GET",
      }
    );
    if (!response.ok) {
      throw new Error("Failed to mine coins");
    }
    const data = await response.json();
    console.log("Mined coins:", data);
    return data
  } catch (error) {
    console.error("Error mining coins:", error);
  }
};
