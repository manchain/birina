'use client'

import { useState } from 'react'
import { ethers } from 'ethers'
import { CONTRACT_ADDRESS } from '../config/biconomy'

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

  // Helper function to validate wallet address
  const validateWalletAddress = (address: string): string | null => {
    console.log("[BiconomyTransactionButton] Validating wallet address:", address);
    
    if (!address || address.trim() === '') {
      console.error("[BiconomyTransactionButton] Empty wallet address provided");
      return null;
    }

    // Check if the address looks like it might be truncated (contains "...")
    if (address.includes('...')) {
      console.error("[BiconomyTransactionButton] Address appears to be truncated:", address);
      return null;
    }

    // Check if address has valid length
    if (address.startsWith('0x') && address.length !== 42) {
      console.error("[BiconomyTransactionButton] Invalid address length:", address.length);
      return null;
    }

    // Check if address is valid Ethereum address
    try {
      // This will throw if address is invalid
      const formattedAddress = ethers.utils.getAddress(address);
      console.log("[BiconomyTransactionButton] Address validated successfully:", formattedAddress);
      return formattedAddress;
    } catch (error) {
      console.error("[BiconomyTransactionButton] Invalid wallet address format:", address, error);
      return null;
    }
  }

  const handleTransaction = async () => {
    // Check for saved wallet address if none provided
    let addressToUse = address;
    if (!addressToUse || addressToUse.trim() === '') {
      // Try getting from localStorage as fallback
      const savedAddress = localStorage.getItem('wallet_connected');
      console.log("[BiconomyTransactionButton] Using saved address from localStorage:", savedAddress);
      addressToUse = savedAddress || '';
    }
    
    // Validate the wallet address
    const validatedAddress = validateWalletAddress(addressToUse);
    if (!validatedAddress) {
      onError?.(new Error(`Invalid wallet address: ${addressToUse || "empty"}`));
      return;
    }

    console.log("[BiconomyTransactionButton] Starting transaction with validated wallet address:", validatedAddress);

    try {
      setIsProcessing(true);
      if (!window.ethereum) throw new Error("Please install MetaMask");
      
      // Regular Web3 provider
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      
      // Get the connected wallet address from signer for comparison
      const connectedAddress = await signer.getAddress();
      console.log("[BiconomyTransactionButton] Connected wallet address:", connectedAddress);
      
      // Validate the contract address
      const contractAddress = validateContractAddress(CONTRACT_ADDRESS);
      console.log("[BiconomyTransactionButton] Using contract address:", contractAddress);

      // Simple direct contract call without Biconomy 
      const contract = new ethers.Contract(
        contractAddress,
        NFT_ABI,
        signer
      );

      console.log(`[BiconomyTransactionButton] Minting NFT for address: ${validatedAddress}`);
      
      // Send transaction directly with gas
      const tx = await contract.mint(validatedAddress, {
        gasLimit: 500000,
      });
      
      console.log("[BiconomyTransactionButton] Transaction submitted:", tx.hash);
      
      // Wait for transaction to be mined
      const receipt = await tx.wait(1);
      console.log("[BiconomyTransactionButton] Transaction confirmed:", receipt.transactionHash);
      
      if (receipt.transactionHash) {
        onSuccess?.(receipt.transactionHash);
      } else {
        throw new Error("Transaction failed");
      }
    } catch (error) {
      console.error("[BiconomyTransactionButton] Transaction error:", error);
      onError?.(error instanceof Error ? error : new Error('Transaction failed'));
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <button
      onClick={handleTransaction}
      disabled={disabled || isProcessing}
      className={`w-full ${disabled || isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  )
} 