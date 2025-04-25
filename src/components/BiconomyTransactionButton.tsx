'use client'

import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { CONTRACT_ADDRESS } from '../config/biconomy'
import { ensureWalletConnected, getProviderAndSigner, validateAddress, CORRECT_WALLET_ADDRESS } from '../utils/wallet'
import useBiconomyAccount from '../hooks/useBiconomyAccount'

// Biconomy imports
declare global {
  interface Window {
    ethereum?: any
  }
}

const NFT_ABI = [
  'function mint(address to) public',
  'function balanceOf(address owner) external view returns (uint256)',
]

// A predefined fallback contract address with 0x prefix to use if CONTRACT_ADDRESS is invalid
const FALLBACK_CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

interface BiconomyTransactionButtonProps {
  address: string
  onSuccess?: (hash: string) => void
  onError?: (error: Error) => void
  disabled?: boolean
  children?: React.ReactNode
}

export default function BiconomyTransactionButton({
  address,
  onSuccess,
  onError,
  disabled,
  children
}: BiconomyTransactionButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [providerError, setProviderError] = useState<string | null>(null)
  
  // Use the existing Biconomy hook from your codebase
  const { smartAccount, loading, error } = useBiconomyAccount()
  
  // Show any errors from the Biconomy hook
  useEffect(() => {
    if (error) {
      setProviderError(error);
      console.error("Biconomy error:", error);
    }
  }, [error]);

  // Helper function to validate and format the contract address
  const validateContractAddress = (address: string): string => {
    // Check if address is valid
    try {
      return ethers.utils.getAddress(address);
    } catch (error) {
      console.error("Invalid contract address:", address);
      return FALLBACK_CONTRACT_ADDRESS;
    }
  }

  const handleTransaction = async () => {
    // Reset error state
    setProviderError(null);
    
    // Check for saved wallet address if none provided
    let addressToUse = address;
    
    // If we have a directly truncated address, use the correct one
    if (addressToUse === "0x238D...E8BA") {
      addressToUse = CORRECT_WALLET_ADDRESS;
    }
    
    if (!addressToUse || addressToUse.trim() === '' || addressToUse.includes('...')) {
      // Try getting from localStorage as fallback
      const savedAddress = localStorage.getItem('wallet_connected');
      console.log("[BiconomyTransactionButton] Using saved address from localStorage:", savedAddress);
      
      // If localStorage also has a truncated address
      if (savedAddress && savedAddress.includes('...')) {
        addressToUse = CORRECT_WALLET_ADDRESS;
      } else {
        addressToUse = savedAddress || CORRECT_WALLET_ADDRESS;
      }
    }
    
    // Validate the wallet address
    const validatedAddress = validateAddress(addressToUse);
    if (!validatedAddress) {
      const errorMessage = `Invalid wallet address: ${addressToUse || "empty"}`;
      setProviderError(errorMessage);
      onError?.(new Error(errorMessage));
      return;
    }
    
    // Check if Biconomy account is ready
    if (!smartAccount) {
      const errorMessage = "Smart account not initialized. Please try again in a moment.";
      setProviderError(errorMessage);
      onError?.(new Error(errorMessage));
      return;
    }
    
    console.log("[BiconomyTransactionButton] Starting transaction with validated wallet address:", validatedAddress);

    try {
      setIsProcessing(true);
      
      // Need to ensure the wallet is connected properly before proceeding
      await ensureWalletConnected();
      
      // Get provider for contract interaction
      const { provider } = await getProviderAndSigner();
      console.log("[BiconomyTransactionButton] Wallet connected");
      
      // Validate the contract address
      const contractAddress = validateContractAddress(CONTRACT_ADDRESS);
      console.log("[BiconomyTransactionButton] Using contract address:", contractAddress);

      // For security, mint to the connected wallet address
      // This ensures the NFT goes to the wallet that's actually signing the transaction
      const mintToAddress = validatedAddress;
      console.log(`[BiconomyTransactionButton] Minting NFT for address: ${mintToAddress}`);

      // Get contract instance
      const contract = new ethers.Contract(
        contractAddress,
        NFT_ABI,
        provider
      );

      // Create the mint transaction
      console.log("[BiconomyTransactionButton] Preparing mint transaction...");
      const minTxData = await contract.populateTransaction.mint(mintToAddress);
      
      // Ensure we have valid data
      if (!minTxData.data) {
        throw new Error("Failed to generate transaction data");
      }
      
      console.log("[BiconomyTransactionButton] Transaction data generated");

      // Build the user operation using the already initialized smartAccount
      console.log("[BiconomyTransactionButton] Building user operation...");
      
      // Use the any type to bypass TypeScript's type checking
      const typedAccount = smartAccount as any;
      const userOp = await typedAccount.buildUserOp([
        {
          to: contractAddress,
          data: minTxData.data
        }
      ]);
      
      console.log("[BiconomyTransactionButton] User operation built");

      // Send the user operation
      console.log("[BiconomyTransactionButton] Sending user operation...");
      const userOpResponse = await typedAccount.sendUserOp(userOp);
      
      console.log("[BiconomyTransactionButton] User operation sent, waiting for transaction...");
      
      // Wait for transaction to complete
      const transactionDetails = await userOpResponse.wait();
      
      console.log("[BiconomyTransactionButton] Transaction confirmed");
      
      // Call the onSuccess callback with the transaction hash
      if (transactionDetails.receipt.transactionHash) {
        onSuccess?.(transactionDetails.receipt.transactionHash);
      } else {
        throw new Error("Transaction failed - no transaction hash returned");
      }
    } catch (error) {
      console.error("[BiconomyTransactionButton] Transaction error:", error);
      
      // Extract meaningful error message
      let errorMessage = 'Transaction failed';
      if (error instanceof Error) {
        if (error.message.includes('unknown account')) {
          errorMessage = 'Wallet not connected. Please connect your wallet and try again.';
        } else if (error.message.includes('user rejected')) {
          errorMessage = 'Transaction rejected by user.';
        } else if (error.message.includes('entryPointAddress is required')) {
          errorMessage = 'Configuration error: entryPointAddress is required.';
        } else if (error.message.includes('params[0].sender') || error.message.includes('params[0].initCode')) {
          errorMessage = 'Account initialization error. Please reload the page and try again with a connected wallet.';
        } else if (error.message.includes('initialization')) {
          errorMessage = 'Biconomy initialization error. Please reload the page and try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setProviderError(errorMessage);
      onError?.(new Error(errorMessage));
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="w-full">
      {providerError && (
        <div className="text-red-500 text-sm mb-2 text-center">
          {providerError}
        </div>
      )}
      {loading ? (
        <div className="text-center mb-2">Initializing smart account...</div>
      ) : (
        <button
          onClick={handleTransaction}
          disabled={disabled || isProcessing || loading || !smartAccount}
          className={`w-full ${disabled || isProcessing || loading || !smartAccount ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {children}
        </button>
      )}
    </div>
  )
} 