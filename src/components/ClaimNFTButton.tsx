import { useState } from 'react'
import useBiconomyAccount from '../hooks/useBiconomyAccount'
import { mintNFT } from '../services/nftService'

const ClaimNFTButton = () => {
  const { smartAccount, loading: accountLoading, error: accountError } = useBiconomyAccount()
  const [minting, setMinting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleMint = async () => {
    if (!smartAccount) {
      setError('Smart account not initialized')
      return
    }

    try {
      setMinting(true)
      setError(null)
      const result = await mintNFT(smartAccount)
      
      if (result.success) {
        setSuccess(true)
        console.log('NFT minted successfully:', result.hash)
      } else {
        setError(result.error || 'Failed to mint NFT')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mint NFT')
    } finally {
      setMinting(false)
    }
  }

  if (accountLoading) {
    return (
      <button className="bg-gray-400 text-white font-bold py-2 px-4 rounded opacity-50 cursor-not-allowed">
        Loading...
      </button>
    )
  }

  if (accountError || error) {
    return (
      <div className="text-center">
        <button className="bg-red-500 text-white font-bold py-2 px-4 rounded opacity-50 cursor-not-allowed">
          Error
        </button>
        <p className="text-red-500 text-sm mt-2">{accountError || error}</p>
      </div>
    )
  }

  if (success) {
    return (
      <button className="bg-green-500 text-white font-bold py-2 px-4 rounded cursor-not-allowed">
        NFT Claimed!
      </button>
    )
  }

  return (
    <button
      onClick={handleMint}
      disabled={minting}
      className={`bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded ${
        minting ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {minting ? 'Claiming...' : 'CLAIM NFT'}
    </button>
  )
}

export default ClaimNFTButton 