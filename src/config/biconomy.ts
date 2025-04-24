import { IBundler, Bundler } from '@biconomy/bundler'
import { BiconomySmartAccountV2, DEFAULT_ENTRYPOINT_ADDRESS } from '@biconomy/account'
import { IPaymaster, BiconomyPaymaster } from '@biconomy/paymaster'
import { ChainId } from '@biconomy/core-types'

// Chain ID for Base Sepolia testnet (not in ChainId enum yet, so we cast it)
const BASE_SEPOLIA_CHAIN_ID = 84532 as unknown as ChainId;

export const bundler: IBundler = new Bundler({
  bundlerUrl: 'https://bundler.biconomy.io/api/v3/84532/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44',    
  chainId: BASE_SEPOLIA_CHAIN_ID,
  entryPointAddress: DEFAULT_ENTRYPOINT_ADDRESS,
})

export const paymaster: IPaymaster = new BiconomyPaymaster({
  paymasterUrl: 'https://paymaster.biconomy.io/api/v2/84532/xrMJ2UOhH.b1bc7fb7-66ab-4558-933a-f10dedfe2cfb'
})

// NFT contract address on Base Sepolia testnet
export const CONTRACT_ADDRESS = "0xd9145CCE52D386f254917e481eB44e9943F39138" 