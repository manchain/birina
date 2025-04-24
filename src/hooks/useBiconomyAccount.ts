import { useState, useEffect } from 'react'
import { BiconomySmartAccountV2, DEFAULT_ENTRYPOINT_ADDRESS } from '@biconomy/account'
import { ethers } from 'ethers'
import { bundler, paymaster } from '../config/biconomy'
import { ChainId } from '@biconomy/core-types'

// Base Sepolia chain ID (not in ChainId enum yet, so we cast it)
const BASE_SEPOLIA_CHAIN_ID = 84532 as unknown as ChainId;

export const useBiconomyAccount = () => {
  const [smartAccount, setSmartAccount] = useState<BiconomySmartAccountV2 | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const initSmartAccount = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()

      // Create biconomy smart account instance
      const biconomySmartAccount = await BiconomySmartAccountV2.create({
        chainId: BASE_SEPOLIA_CHAIN_ID,
        bundler: bundler,
        paymaster: paymaster,
        entryPointAddress: DEFAULT_ENTRYPOINT_ADDRESS,
        signer: signer
      })

      setSmartAccount(biconomySmartAccount)
      setLoading(false)
    } catch (err) {
      console.error('Error initializing smart account:', err)
      setError(err instanceof Error ? err.message : 'Failed to initialize smart account')
      setLoading(false)
    }
  }

  useEffect(() => {
    if (window.ethereum) {
      initSmartAccount()
    } else {
      setError('Ethereum provider not available')
      setLoading(false)
    }
  }, [])

  return { smartAccount, loading, error }
}

export default useBiconomyAccount 