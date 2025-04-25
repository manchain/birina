import { useState, useEffect, useCallback } from 'react'
import { ethers } from 'ethers'
import { bundler, paymaster } from '../config/biconomy'
import { ChainId } from '@biconomy/core-types'
import { DEFAULT_ENTRYPOINT_ADDRESS } from '@biconomy/account'
import { ECDSAOwnershipValidationModule, DEFAULT_ECDSA_OWNERSHIP_MODULE } from "@biconomy/modules";

// Base Sepolia chain ID
const BASE_SEPOLIA_CHAIN_ID = 84532 as unknown as ChainId;

export const useBiconomyAccount = () => {
  const [smartAccount, setSmartAccount] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [address, setAddress] = useState<string | null>(null)

  const initSmartAccount = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Make sure ethereum is available
      if (!window.ethereum) {
        throw new Error("Ethereum provider not available. Please install a wallet.");
      }

      // Get provider and signer
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      
      try {
        await provider.send("eth_requestAccounts", []);
      } catch (requestError) {
        console.error("Failed to request accounts:", requestError);
        throw new Error("Failed to connect wallet. Please connect your wallet manually.");
      }
      
      const signer = provider.getSigner();
      const walletAddress = await signer.getAddress();
      console.log("Wallet address:", walletAddress);

      try {
        // Import BiconomySmartAccountV2 dynamically
        const { BiconomySmartAccountV2 } = await import('@biconomy/account').catch(e => {
          console.error("Failed to import BiconomySmartAccountV2:", e);
          throw new Error("Failed to load Biconomy SDK. Please refresh the page.");
        });

        // Create validation module
        const module = await ECDSAOwnershipValidationModule.create({
          signer: signer,
          moduleAddress: DEFAULT_ECDSA_OWNERSHIP_MODULE
        });

        // Create smart account
        const biconomyAccount = await BiconomySmartAccountV2.create({
          chainId: BASE_SEPOLIA_CHAIN_ID,
          bundler,
          paymaster,
          entryPointAddress: DEFAULT_ENTRYPOINT_ADDRESS,
          defaultValidationModule: module,
          activeValidationModule: module
        });

        console.log("Smart account created:", biconomyAccount);

        // Get the address
        const address = await biconomyAccount.getAccountAddress();
        console.log("Smart account address:", address);

        setSmartAccount(biconomyAccount);
        setAddress(address);
        
        return { account: biconomyAccount, address };
      } catch (createError: any) {
        console.error("Smart account creation error:", createError);
        throw new Error(`Failed to create smart account: ${createError.message}`);
      }
    } catch (err: any) {
      console.error('Error in initSmartAccount:', err);
      const errorMsg = err?.message || "Failed to initialize smart account";
      setError(errorMsg);
      return { error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Only initialize if not already initialized
    if (!smartAccount && !loading && !error) {
      initSmartAccount();
    }
  }, [smartAccount, loading, error, initSmartAccount]);

  const reinitialize = useCallback(() => {
    setLoading(true);
    setError(null);
    setSmartAccount(null);
    setAddress(null);
    
    // Add a small delay before reinitializing
    setTimeout(() => {
      initSmartAccount();
    }, 500);
  }, [initSmartAccount]);

  return { 
    smartAccount, 
    loading, 
    error, 
    address,
    reinitialize
  };
};

export default useBiconomyAccount; 