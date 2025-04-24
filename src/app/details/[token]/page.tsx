"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { useSmartAccount } from "@/hooks/use-smart-account"
import { claimNFT } from "@/services/api"
import { toast } from "react-hot-toast"

export default function NFTDetails() {
  const [timeLeft, setTimeLeft] = useState({
    hours: 28,
    minutes: 16,
    seconds: 21,
  })
  const [isClaiming, setIsClaiming] = useState(false)
  const params = useParams()
  const token = params.token as string
  const router = useRouter()
  const { address, smartAccount, error, disconnectWallet } = useSmartAccount()

  const [activeTab, setActiveTab] = useState("artisan")
  const [isScrolled, setIsScrolled] = useState(false)

  // Redirect to home if not connected
  useEffect(() => {
    if (!address && !localStorage.getItem('wallet_connected')) {
      router.push('/');
    }
  }, [address, router]);

  // Add scroll event listener
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

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

  const handleClaim = async () => {
    if (!token || !address || !smartAccount) {
      toast.error("Please connect your wallet first")
      return
    }

    try {
      setIsClaiming(true)
      await claimNFT(token, address)

      toast.success("NFT claimed successfully!", {
        duration: 4000,
        position: "bottom-center",
        style: {
          background: "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          padding: "16px",
          color: "#1a1a1a",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          borderRadius: "12px",
          fontSize: "15px",
        },
        icon: "🎉",
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to claim NFT")
    } finally {
      setIsClaiming(false)
    }
  }

  // Handle disconnect and redirect
  const handleDisconnect = () => {
    disconnectWallet();
    router.push('/');
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FF4545] to-[#FF9C73]">
      {/* Header - Redesigned */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? "bg-white/90 backdrop-blur-md shadow-sm" : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button
                className={`p-2 rounded-full hover:bg-black/5 transition-all ${
                  isScrolled ? "text-gray-800" : "text-white"
                }`}
                onClick={() => router.push("/")}
              >
                <svg width="22" height="19" viewBox="0 0 22 19" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M8.25 0.779572V5.74786C19.25 5.74786 22 10.8404 22 18.1686C20.57 13.25 16.5 10.7162 11 10.7162H8.25V15.6844L0 7.83454L8.25 0.779572Z"
                    fill={isScrolled ? "#1F2937" : "white"}
                  />
                </svg>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                className={`p-2 rounded-full hover:bg-black/5 transition-all ${
                  isScrolled ? "text-gray-800" : "text-white"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Adjusted padding */}
      <main className="px-4 pb-4 pt-24">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold">
            <span className="text-[#EBA519]">Claim</span>
            <span className="text-white"> Your Birina NFT</span>
          </h1>
          <div className="text-white mt-2">
            Ends in {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6">
          <div className="aspect-square w-full mb-6 relative">
            <Image src="/gamusa.png" alt="Birina NFT Pattern" fill className="object-cover rounded-2xl" />
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="relative w-8 h-8">
                <Image src="/avatar.png" alt="Account Avatar" fill className="rounded-full object-cover" />
              </div>
              <div>
                <div className="font-semibold">Account</div>
                <div className="text-zinc-500 text-sm">
                  {address || localStorage.getItem('wallet_connected') || "Not connected"}
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
            beauty and tradition. Handwoven in Merapani, it embodies the artistry and heritage of Assam, now preserved
            as an authentic NFT.
          </p>

          {/* Tabs */}
          <div className="border-b border-zinc-200 mb-4">
            <div className="flex justify-between px-4">
              <button
                onClick={() => setActiveTab("artisan")}
                className={`pb-2 text-base font-bold w-1/3 ${
                  activeTab === "artisan" ? "border-b-2 border-zinc-900 text-zinc-900" : "text-zinc-500"
                }`}
              >
                Artisan
              </button>
              <button
                onClick={() => setActiveTab("location")}
                className={`pb-2 text-base font-bold w-1/3 ${
                  activeTab === "location" ? "border-b-2 border-zinc-900 text-zinc-900" : "text-zinc-500"
                }`}
              >
                Location
              </button>
              <button
                onClick={() => setActiveTab("details")}
                className={`pb-2 text-base font-bold w-1/3 ${
                  activeTab === "details" ? "border-b-2 border-zinc-900 text-zinc-900" : "text-zinc-500"
                }`}
              >
                Details
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === "artisan" && (
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="relative w-12 h-12">
                  <Image src="/profile.png" alt="John Deka" fill className="rounded-full object-cover" />
                </div>
                <div>
                  <div className="font-semibold">John Deka</div>
                  <div className="text-zinc-500 text-sm">Handloom Artisan</div>
                </div>
              </div>
              <p className="text-zinc-600 text-sm leading-relaxed">
                Crafted by John deka, a master weaver from Sualkuchi, Assam, known for preserving the heritage of
                handwoven gamusas. With over 18 years of experience, they blend tradition and artistry in every
                creation.
              </p>
            </div>
          )}

          {activeTab === "location" && (
            <div className="mb-6">
              <div className="rounded-xl overflow-hidden mb-4 relative h-48">
                <Image src="/map.png" alt="Location Map" fill className="object-cover" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <div className="text-zinc-500 text-sm">DISTRICT</div>
                  <div className="font-medium">Merapati</div>
                </div>
                <div className="flex justify-between">
                  <div className="text-zinc-500 text-sm">CLUSTER</div>
                  <div className="font-medium">Golaghat</div>
                </div>
                <div className="flex justify-between">
                  <div className="text-zinc-500 text-sm">SUB-DIVISION</div>
                  <div className="font-medium">Panikhaiti</div>
                </div>
                <div className="flex justify-between">
                  <div className="text-zinc-500 text-sm">LOCATION</div>
                  <div className="font-medium">26.370425, 94.063504</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "details" && (
            <div className="mb-6 space-y-3">
              <div className="flex items-center gap-2">
                <div className="text-zinc-500 text-sm">Type</div>
                <div className="border-b border-dotted border-zinc-300 flex-1"></div>
                <div className="font-medium">Special Edition</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-zinc-500 text-sm">Material</div>
                <div className="border-b border-dotted border-zinc-300 flex-1"></div>
                <div className="font-medium">Cotton</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-zinc-500 text-sm">Mint Date</div>
                <div className="border-b border-dotted border-zinc-300 flex-1"></div>
                <div className="font-medium">28-05-2023</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-zinc-500 text-sm">Gamusa ID</div>
                <div className="border-b border-dotted border-zinc-300 flex-1"></div>
                <div className="font-medium">GMS127</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-zinc-500 text-sm">Significance</div>
                <div className="border-b border-dotted border-zinc-300 flex-1"></div>
                <div className="font-medium">Blessing Gift</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-zinc-500 text-sm">Design Pattern</div>
                <div className="border-b border-dotted border-zinc-300 flex-1"></div>
                <div className="font-medium">Floral Motif</div>
              </div>
              <div className="text-center text-sm text-zinc-500 mt-4">
                Want to know more about it? Visit{" "}
                <a
                  href="https://www.birina.net/blog"
                  target="_blank"
                  className="text-blue-500 hover:underline"
                  rel="noreferrer"
                >
                  birina.net/blogs
                </a>
              </div>
            </div>
          )}

          {/* Wallet info display similar to the screenshot */}


          <button
            className="w-full bg-[#EBA519] text-white font-bold py-4 rounded-xl hover:bg-[#d4a554] transition-colors disabled:opacity-50"
            onClick={handleClaim}
            disabled={isClaiming}
          >
            {isClaiming ? "Claiming..." : "CLAIM NFT"}
          </button>

          {error && <div className="mt-4 text-red-500 text-sm text-center">{error}</div>}
        </div>
      </main>
    </div>
  )
} 