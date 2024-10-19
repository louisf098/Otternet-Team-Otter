import React, { createContext, ReactNode, useState } from "react";

export interface AuthContext {
  publicKey: string;
  setPublicKey: (id: string) => void;
}

export const AuthContext = createContext<AuthContext>({
  publicKey: "",
  setPublicKey: () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [publicKey, setPublicKey] = useState<string>("");

  return (
    <AuthContext.Provider
      value={{
        publicKey,
        setPublicKey,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
