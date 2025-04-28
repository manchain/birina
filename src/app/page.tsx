"use client";

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { ConnectButton } from "thirdweb/react"
import { client } from "./client"
import { toast } from "react-hot-toast"

// Client component that uses search params
function NFTClaimContent() {
  const [timeLeft, setTimeLeft] = useState({
    hours: 28,
    minutes: 16,
    seconds: 21,
  })
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null)

  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token") || "1" // Default to token 1 if none provided

  // Check if wallet is already connected on mount
  useEffect(() => {
    const savedWallet = localStorage.getItem('wallet_connected')
    if (savedWallet) {
      setConnectedWallet(savedWallet)
      // If wallet is connected, redirect immediately to details page
      router.push(`/details/${token}`)
    }
  }, [router, token])

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 }
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 }
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 }
        }
        clearInterval(timer)
        return prev
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Custom handler for post-connection navigation
  const handleSuccess = async (wallet: any) => {
    try {
      let walletAddress = "";

      if (wallet && wallet.address) {
        walletAddress = wallet.address;
      } else if (wallet && typeof wallet === 'string') {
        walletAddress = wallet;
      } else {

        walletAddress = "";
      }
      

      if (walletAddress && !walletAddress.includes('...')) {
        localStorage.setItem('wallet_connected', walletAddress);
        setConnectedWallet(walletAddress);
      } else {
        setConnectedWallet(null);
      }
      

      console.log("Wallet object:", wallet);
      

      if (walletAddress) {
        router.push(`/details/${token}`);
      }
    } catch (err) {
      console.error("Connection error:", err);
      if (err instanceof Error) {
        toast.error(err.message)
      } else {
        toast.error("An unknown error occurred")
      }
    }
  }

  // Format wallet address for display
  const formatAddress = (address: string) => {
    if (!address || address.trim() === '') return "Not connected";
    
    // Always return the full address to avoid validation issues
    return address;
    
    // Uncomment this for UI display purposes only (DO NOT use for transactions)
    // return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FF4545] to-[#FF9C73] flex items-center justify-center p-4">
      <div className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold">
            <span className="text-[#EBA519]">Claim</span>
            <span className="text-white"> Your Birina NFT</span>
          </h1>
          <div className="text-white mt-2">
            Ends in {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 relative z-10">
          <div className="aspect-square w-full mb-6">
            <div className="relative w-full h-full">
              <Image src="/gamusa.png" alt="Birina NFT Pattern" fill className="object-cover rounded-2xl" />
            </div>
          </div>

          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center gap-2">
              <div className="relative w-8 h-8">
                <Image src="/avatar.png" alt="Account Avatar" fill className="rounded-full object-cover" />
              </div>
              <div>
                <div className="font-semibold">Account</div>
                <div className="text-zinc-500 text-sm">
                  {connectedWallet ? formatAddress(connectedWallet) : "Not connected"}
                </div>
              </div>
            </div>
            <div className="ml-auto">
              <div className="text-right">
                <div className="font-semibold">Gamusa ID</div>
                <div className="text-zinc-500 text-sm">#{token || "N/A"}</div>
              </div>
            </div>
          </div>

          <p className="text-zinc-600 text-sm leading-relaxed mb-6">
            This Phoolam Gamusa is a symbol of Assamese culture, adorned with intricate floral patterns that represent
            beauty and tradition. Handwoven in Meghalaya, it carries the essence of...
          </p>

          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="border-b border-dotted border-zinc-900 flex-1"></div>
            <div className="w-6 h-6 rounded-full border-2 border-zinc-300 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-3 h-3 text-zinc-800"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                />
              </svg>
            </div>
            <div className="border-b border-dotted border-zinc-900 flex-1"></div>
          </div>

          {/* Show connected wallet info if connected */}
          {connectedWallet ? (
            <div className="bg-[#eba519] text-white p-4 rounded-xl flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-green-400 flex-shrink-0"></div>
                <div>
                  <div className="font-bold">{formatAddress(connectedWallet)}</div>
                  <div className="text-xs">0.0504 ETH</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="custom-connect-button-wrapper">
              <ConnectButton
                client={client}
                appMetadata={{
                  name: "Birina NFT",
                  url: "https://birina-nft.com",
                }}
                onConnect={handleSuccess}
              />
            </div>
          )}
        </div>

        {/* Card stack effect - adjusted positioning and styling */}
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-3 w-[95%] h-16 bg-white/20 rounded-3xl"></div>
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-6 w-[90%] h-16 bg-white/10 rounded-3xl"></div>
      </div>
    </div>
  )
}

// Loading fallback
function NFTClaimFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FF4545] to-[#FF9C73] flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center text-white">
        <p>Loading...</p>
      </div>
    </div>
  );
}

// Main component with Suspense boundary
export default function NFTClaim() {
  return (
    <Suspense fallback={<NFTClaimFallback />}>
      <NFTClaimContent />
    </Suspense>
  );
}
