import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { bundler, paymaster } from '../config/biconomy'
import { ChainId } from '@biconomy/core-types'

// Base Sepolia chain ID (not in ChainId enum yet, so we cast it)
const BASE_SEPOLIA_CHAIN_ID = 84532 as unknown as ChainId;

export const useBiconomyAccount = () => {
  const [smartAccount, setSmartAccount] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const initSmartAccount = async () => {
    try {
      // Make sure ethereum is available
      if (!window.ethereum) {
        throw new Error("Ethereum provider not available. Please install a wallet.");
      }

      // Safely get the provider and signer
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      
      try {
        // Request accounts
        await provider.send("eth_requestAccounts", []);
      } catch (requestError) {
        console.error("Failed to request accounts:", requestError);
        throw new Error("Failed to connect wallet. Please connect your wallet manually.");
      }
      
      const signer = provider.getSigner();
      
      // Dynamically import Biconomy modules to avoid initialization errors
      const { BiconomySmartAccountV2, DEFAULT_ENTRYPOINT_ADDRESS } = await import('@biconomy/account');

      console.log("Creating Biconomy smart account...");
      
      // Create biconomy smart account instance with type assertions to avoid typing issues
      const biconomySmartAccount = await BiconomySmartAccountV2.create({
        chainId: BASE_SEPOLIA_CHAIN_ID,
        bundler: bundler as any,
        paymaster: paymaster as any,
        entryPointAddress: DEFAULT_ENTRYPOINT_ADDRESS,
        signer: signer
      });
      
      // Verify the account is properly initialized by getting its address
      const address = await biconomySmartAccount.getAddress();
      console.log("Smart account created with address:", address);

      setSmartAccount(biconomySmartAccount);
      setLoading(false);
    } catch (err) {
      console.error('Error initializing smart account:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize smart account');
      setLoading(false);
    }
  };

  useEffect(() => {
    // Delay initialization slightly to ensure all modules are loaded
    const timer = setTimeout(() => {
      initSmartAccount();
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  return { smartAccount, loading, error };
};

export default useBiconomyAccount; 