import React, { createContext, ReactNode, useState } from "react";

// Update to use an object for walletKeyPair
export interface AuthContextType {
  walletKeyPair: { [key: string]: string }; // Using an object
  setWalletKeyPair: (walletKeyPair: { [key: string]: string }) => void;
  publicKey: string;
  setPublicKey: (id: string) => void;
}

export const AuthContext = createContext<AuthContextType>({
  walletKeyPair: {},
  setWalletKeyPair: () => {},
  publicKey: "",
  setPublicKey: () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [publicKey, setPublicKey] = useState<string>("");
  const [walletKeyPair, setWalletKeyPair] = useState<{ [key: string]: string }>(
    {}
  );

  return (
    <AuthContext.Provider
      value={{
        walletKeyPair,
        setWalletKeyPair,
        publicKey,
        setPublicKey,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
