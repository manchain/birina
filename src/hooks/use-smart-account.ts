import { useState, useEffect, useCallback } from "react";
import { client } from "@/app/client";

export interface SmartAccountState {
  address: string | null;
  loading: boolean;
  error: string | null;
  smartAccount: any | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

export function useSmartAccount(): SmartAccountState {
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [smartAccount, setSmartAccount] = useState<any | null>(null);

  // Check wallet connection on page load
  useEffect(() => {
    const checkConnection = async () => {
      try {
        // This is a simplified implementation
        // In a real app, you'd use the proper ThirdWeb SDK methods
        const wallet = localStorage.getItem('wallet_connected');
        console.log("[useSmartAccount] Retrieved wallet from localStorage:", wallet);
        
        if (wallet) {
          setAddress(wallet);
          setSmartAccount({});
          console.log("[useSmartAccount] Wallet address set:", wallet);
        }
      } catch (err) {
        console.error("Error checking wallet connection:", err);
      }
    };
    
    checkConnection();
  }, []);

  const connectWallet = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real implementation, we'd use the actual wallet
      // For our demo, we'll use a valid Ethereum address
      const mockAddress = "0x238D638aaC968e787d983ACBE66494a9E8BA1df9";
      console.log("[useSmartAccount] Connecting with address:", mockAddress);
      
      setAddress(mockAddress);
      setSmartAccount({});
      
      // For demo purposes, store in localStorage to persist "connection"
      localStorage.setItem('wallet_connected', mockAddress);
      console.log("[useSmartAccount] Stored wallet in localStorage:", mockAddress);
    } catch (err) {
      console.error("Error connecting wallet:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to connect wallet");
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    // Clear the connected wallet from state
    setAddress(null);
    setSmartAccount(null);
    
    // Remove from localStorage
    localStorage.removeItem('wallet_connected');
    console.log("[useSmartAccount] Wallet disconnected and removed from localStorage");
  }, []);

  return { address, loading, error, smartAccount, connectWallet, disconnectWallet };
} 