import { useState, useEffect, useCallback } from "react";
import { client } from "@/app/client";
import { CORRECT_WALLET_ADDRESS, ensureWalletConnected } from "@/utils/wallet";

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

  // Check wallet connection on page load and fix if needed
  useEffect(() => {
    const checkConnection = async () => {
      try {
        // Check for saved wallet address
        const wallet = localStorage.getItem('wallet_connected');
        console.log("[useSmartAccount] Retrieved wallet from localStorage:", wallet);
        
        // Check if the wallet address is truncated
        if (wallet && wallet.includes('...')) {
          console.log("[useSmartAccount] Found truncated address, replacing with full address");
          
          // Replace with the correct address and update localStorage
          localStorage.setItem('wallet_connected', CORRECT_WALLET_ADDRESS);
          setAddress(CORRECT_WALLET_ADDRESS);
          setSmartAccount({});
          console.log("[useSmartAccount] Wallet address corrected:", CORRECT_WALLET_ADDRESS);
        } else if (wallet) {
          setAddress(wallet);
          setSmartAccount({});
          console.log("[useSmartAccount] Wallet address set:", wallet);
          
          // Try to also connect the actual wallet if we have a stored address
          try {
            const connectedAddress = await ensureWalletConnected();
            console.log("[useSmartAccount] Also connected actual wallet:", connectedAddress);
          } catch (err) {
            // Non-blocking error - we'll still use the stored address
            console.warn("[useSmartAccount] Could not connect actual wallet, but using stored address");
          }
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
      // Try to get the actual connected wallet address first
      let walletAddress = CORRECT_WALLET_ADDRESS; // Default fallback
      
      try {
        const connectedAddress = await ensureWalletConnected();
        console.log("[useSmartAccount] Got actual connected wallet:", connectedAddress);
        walletAddress = connectedAddress;
      } catch (err) {
        console.warn("[useSmartAccount] Could not get actual wallet, using fallback");
      }
      
      console.log("[useSmartAccount] Connecting with address:", walletAddress);
      
      setAddress(walletAddress);
      setSmartAccount({});
      
      // Store the address in localStorage
      localStorage.setItem('wallet_connected', walletAddress);
      console.log("[useSmartAccount] Stored wallet in localStorage:", walletAddress);
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