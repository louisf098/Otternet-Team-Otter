import React, { createContext, ReactNode, useState } from "react";

// Update to use an object for walletKeyPair
export interface AuthContextType {
  publicKey: string;
  setPublicKey: (id: string) => void;
  walletName: string;
  setWalletName: (id: string) => void;
}

export const AuthContext = createContext<AuthContextType>({
  publicKey: "",
  setPublicKey: () => {},
  walletName: "",
  setWalletName: () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [publicKey, setPublicKey] = useState<string>("");
  const [walletName, setWalletName] = useState<string>("");

  return (
    <AuthContext.Provider
      value={{
        publicKey,
        setPublicKey,
        walletName,
        setWalletName,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
