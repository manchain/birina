import { IBundler, Bundler } from '@biconomy/bundler'
import { BiconomySmartAccountV2, DEFAULT_ENTRYPOINT_ADDRESS } from '@biconomy/account'
import { IPaymaster, BiconomyPaymaster } from '@biconomy/paymaster'
import { ChainId } from '@biconomy/core-types'
import { ethers } from 'ethers'
import { baseSepolia } from 'thirdweb/chains'

// Chain ID for Base Sepolia testnet
const BASE_SEPOLIA_CHAIN_ID = baseSepolia.id;

// Create bundler instance
export const bundler: IBundler = new Bundler({
  bundlerUrl: 'https://bundler.biconomy.io/api/v3/84532/bundler_3ZGCs6S8UY7iNcChriDiErXw',
  chainId: BASE_SEPOLIA_CHAIN_ID,
  entryPointAddress: DEFAULT_ENTRYPOINT_ADDRESS
});

// Create paymaster instance with sponsorship configuration
export const paymaster: IPaymaster = new BiconomyPaymaster({
  paymasterUrl: 'https://paymaster.biconomy.io/api/v2/84532/xrMJ2UOhH.b1bc7fb7-66ab-4558-933a-f10dedfe2cfb',
  strictMode: true
});

// NFT contract address on Base Sepolia testnet
export const CONTRACT_ADDRESS = "0xd9145CCE52D386f254917e481eB44e9943F39138";

// Paymaster API key
export const PAYMASTER_API_KEY = "xrMJ2UOhH.b1bc7fb7-66ab-4558-933a-f10dedfe2cfb";

// Gas configuration for Base Sepolia
export const GAS_CONFIG = {
  maxFeePerGas: ethers.utils.parseUnits("100", "gwei").toString(), // 100 Gwei
  maxPriorityFeePerGas: ethers.utils.parseUnits("100", "gwei").toString() // 100 Gwei
}; 