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
