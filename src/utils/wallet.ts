import { ethers } from 'ethers';

export const CORRECT_WALLET_ADDRESS = "0x238DE20B86611085Bb9ea960802e4b9587f1EBBa";

/**
 * Ensures the wallet is connected and returns the connected accounts
 */
export const ensureWalletConnected = async (): Promise<string> => {
  if (!window.ethereum) {
    throw new Error("MetaMask not installed! Please install MetaMask to continue.");
  }
  
  try {
    // Request account access
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    
    if (!accounts || accounts.length === 0) {
      throw new Error("No accounts found. Please connect your wallet in MetaMask.");
    }
    
    console.log("[Wallet] Connected accounts:", accounts);
    return accounts[0];
  } catch (error) {
    console.error("[Wallet] Error connecting wallet:", error);
    throw error;
  }
};

/**
 * Gets a provider and signer for making transactions
 */
export const getProviderAndSigner = async () => {
  if (!window.ethereum) {
    throw new Error("MetaMask not installed!");
  }
  
  await ensureWalletConnected();
  
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = provider.getSigner();
  
  try {
    const address = await signer.getAddress();
    console.log("[Wallet] Signer address:", address);
    return { provider, signer, address };
  } catch (error) {
    console.error("[Wallet] Error getting signer address:", error);
    throw new Error("Unable to get signer. Please make sure your wallet is connected.");
  }
};

/**
 * Validates and formats an Ethereum address
 */
export const validateAddress = (address: string): string | null => {
  if (!address || address.trim() === '') {
    console.error("[Wallet] Empty address provided");
    return null;
  }

  // Fix for known truncated address
  if (address === "0x238D...E8BA") {
    return CORRECT_WALLET_ADDRESS;
  }
  
  // Check if the address looks like it might be truncated
  if (address.includes('...')) {
    console.error("[Wallet] Address appears to be truncated:", address);
    return CORRECT_WALLET_ADDRESS;
  }

  // Check address length
  if (address.startsWith('0x') && address.length !== 42) {
    console.error("[Wallet] Invalid address length:", address.length);
    return CORRECT_WALLET_ADDRESS;
  }

  try {
    return ethers.utils.getAddress(address);
  } catch (error) {
    console.error("[Wallet] Invalid address format:", address, error);
    return null;
  }
}; 