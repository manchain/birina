'use client'

import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { CONTRACT_ADDRESS, GAS_CONFIG } from '../config/biconomy'
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
  const [localStatus, setLocalStatus] = useState<string | null>(null)
  
  // Use the updated Biconomy hook with reinitialize function
  const { smartAccount, loading, error, address: smartAccountAddress, reinitialize } = useBiconomyAccount()
  
  // Show any errors from the Biconomy hook
  useEffect(() => {
    if (error) {
      setProviderError(error);
      console.error("Biconomy error:", error);
    }
  }, [error]);

  // Helper function to validate and format the contract address
  const validateContractAddress = (address: string): string => {
    try {
      return ethers.utils.getAddress(address);
    } catch (error) {
      console.error("Invalid contract address:", address);
      return FALLBACK_CONTRACT_ADDRESS;
    }
  }

  // Reset all errors and reinitialize the Biconomy account
  const handleReset = () => {
    setProviderError(null);
    setLocalStatus("Reinitializing smart account...");
    reinitialize();
  };

  const handleTransaction = async () => {
    // Reset state
    setProviderError(null);
    setLocalStatus(null);
    
    try {
      setIsProcessing(true);
      setLocalStatus("Connecting wallet...");
      
      // Connect wallet and validate addresses
      await ensureWalletConnected();
      const { provider } = await getProviderAndSigner();
      
      // Validate addresses
      const validatedAddress = validateAddress(address) || CORRECT_WALLET_ADDRESS;
      if (!validatedAddress) {
        throw new Error("Invalid wallet address");
      }
      
      // Check if Biconomy account is ready
      if (!smartAccount) {
        throw new Error("Smart account not initialized. Please try again.");
      }

      setLocalStatus("Preparing transaction...");
      
      // Get contract instance
      const contractAddress = validateContractAddress(CONTRACT_ADDRESS);
      const contract = new ethers.Contract(contractAddress, NFT_ABI, provider);
      
      // Create mint transaction
      const mintTx = await contract.populateTransaction.mint(validatedAddress);
      if (!mintTx.data) {
        throw new Error("Failed to generate transaction data");
      }

      // Prepare the transaction
      const tx = {
        to: contractAddress,
        data: mintTx.data,
        value: "0x0"
      };

      console.log("[BiconomyTransactionButton] Preparing transaction:", tx);
      setLocalStatus("Initiating sponsored transaction...");

      try {
        // Build the transaction with proper configuration
        const userOp = await smartAccount.buildUserOp([tx], {
          maxFeePerGas: GAS_CONFIG.maxFeePerGas,
          maxPriorityFeePerGas: GAS_CONFIG.maxPriorityFeePerGas,
          paymasterServiceData: {
            mode: "SPONSORED",
            calculateGasLimits: true
          }
        });
        
        console.log("[BiconomyTransactionButton] Built UserOp:", userOp);
        setLocalStatus("Sending transaction...");

        // Send the transaction
        const userOpResponse = await smartAccount.sendUserOp(userOp);
        console.log("[BiconomyTransactionButton] UserOp Response:", userOpResponse);

        setLocalStatus("Waiting for transaction confirmation...");
        
        // Wait for transaction with timeout
        const transactionDetails = await Promise.race([
          userOpResponse.wait(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Transaction confirmation timeout")), 60000)
          )
        ]);

        console.log("[BiconomyTransactionButton] Transaction confirmed:", transactionDetails);
        setLocalStatus("Transaction successful!");
        
        // Extract transaction hash from the response
        const txHash = transactionDetails?.receipt?.transactionHash || 
                      transactionDetails?.transactionHash || 
                      userOpResponse?.transactionHash;
                      
        if (txHash) {
          onSuccess?.(txHash);
        } else {
          console.warn("[BiconomyTransactionButton] No transaction hash found in response");
        }

      } catch (sponsorError: any) {
        console.error("[BiconomyTransactionButton] Sponsorship error:", sponsorError);
        
        // Log detailed error information
        console.error("Error details:", {
          message: sponsorError.message,
          code: sponsorError.code,
          data: sponsorError.data,
          response: sponsorError.response?.data
        });

        if (sponsorError.message?.includes("initCode") || sponsorError.message?.includes("sender")) {
          // Handle initialization errors
          setProviderError("Smart account not properly initialized. Trying to reinitialize...");
          setTimeout(() => handleReset(), 2000);
        } else if (sponsorError.message?.includes("AA21") || sponsorError.message?.includes("didn't pay prefund")) {
          throw new Error("Paymaster configuration error. Please check your Biconomy dashboard settings.");
        } else if (sponsorError.message?.includes("insufficient balance")) {
          throw new Error("Paymaster has insufficient balance. Please contact support.");
        } else if (sponsorError.message?.includes("not whitelisted")) {
          throw new Error("Contract or function not whitelisted in Biconomy. Please check dashboard configuration.");
        } else if (sponsorError.message?.includes("rate limit")) {
          throw new Error("Transaction rate limit exceeded. Please try again in a few minutes.");
        } else if (sponsorError.message?.includes("user rejected") || sponsorError.message?.includes("User denied")) {
          throw new Error("Transaction was rejected by the user.");
        } else {
          throw new Error(`Transaction failed: ${sponsorError.message || "Unknown error"}`);
        }
      }

    } catch (error: any) {
      console.error("[BiconomyTransactionButton] Error:", error);
      
      // Format error message
      let errorMessage = 'Transaction failed';
      if (typeof error === 'object') {
        if (error.message?.includes("AA21") || error.message?.includes("didn't pay prefund")) {
          errorMessage = "Transaction sponsorship failed. Please try again later.";
        } else if (error.message?.includes("user rejected") || error.message?.includes("User denied")) {
          errorMessage = "Transaction was rejected by the user.";
        } else if (error.message) {
          errorMessage = error.message;
        } else {
          errorMessage = JSON.stringify(error);
        }
      }
      
      setProviderError(errorMessage);
      setLocalStatus(null);
      onError?.(new Error(errorMessage));

      // If it's an initialization error, try to reinitialize
      if (errorMessage.includes("initialization") || errorMessage.includes("not initialized")) {
        setTimeout(() => {
          handleReset();
        }, 2000);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full">
      {providerError && (
        <div className="text-red-500 text-sm mb-2 text-center">
          {providerError}
          {providerError.includes("initialization") && (
            <button 
              onClick={handleReset}
              className="ml-2 text-blue-500 underline"
            >
              Try Again
            </button>
          )}
        </div>
      )}
      {localStatus && !providerError && (
        <div className="text-blue-500 text-sm mb-2 text-center">
          {localStatus}
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
          {isProcessing ? 'Processing...' : children}
        </button>
      )}
    </div>
  )
} 