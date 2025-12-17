"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { monadTestnet, monadMainnet } from "../contracts";

export type NetworkMode = "dev" | "main";

interface NetworkContextType {
  mode: NetworkMode;
  setMode: (mode: NetworkMode) => void;
  chain: typeof monadTestnet | typeof monadMainnet;
  contractAddress: string;
  usdcAddress: string;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<NetworkMode>("dev");

  const chain = mode === "dev" ? monadTestnet : monadMainnet;
  const contractAddress = mode === "dev" 
    ? "0x5E6658ac6cBC9b0109C28BED00bC4Af0F0A3f1CD" // Testnet
    : "0x5E6658ac6cBC9b0109C28BED00bC4Af0F0A3f1CD"; // Mainnet (update when deployed)
  
  const usdcAddress = mode === "dev"
    ? "0x534b2f3A21130d7a60830c2Df862319e593943A3" // Testnet USDC
    : "0xf817257fed379853cDe0fa4F97AB987181B1E5Ea"; // Mainnet USDC

  return (
    <NetworkContext.Provider value={{ mode, setMode, chain, contractAddress, usdcAddress }}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error("useNetwork must be used within a NetworkProvider");
  }
  return context;
}

