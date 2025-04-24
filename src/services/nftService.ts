import { BiconomySmartAccountV2 } from '@biconomy/account'
import { ethers } from 'ethers'
import { CONTRACT_ADDRESS } from '../config/biconomy'

const NFT_ABI = [
  'function mint(address to) public',
  'function balanceOf(address owner) external view returns (uint256)',
]

export const mintNFT = async (smartAccount: BiconomySmartAccountV2) => {
  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const contract = new ethers.Contract(CONTRACT_ADDRESS, NFT_ABI, provider)

    // Prepare the mint transaction
    const minTxData = await contract.populateTransaction.mint(
      await smartAccount.getAddress()
    )

    // Build the user operation
    const userOp = await smartAccount.buildUserOp([
      {
        to: CONTRACT_ADDRESS,
        data: minTxData.data,
      },
    ])

    // Send the user operation
    const userOpResponse = await smartAccount.sendUserOp(userOp)
    
    // Wait for transaction
    const transactionDetails = await userOpResponse.wait()

    return {
      success: true,
      hash: transactionDetails.receipt.transactionHash,
    }
  } catch (error) {
    console.error('Error minting NFT:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to mint NFT',
    }
  }
} 