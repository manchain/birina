import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThirdwebProvider } from "thirdweb/react";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Birina NFT - Claim Your Digital Collectible",
  description:
    "Claim your exclusive Birina NFT, a digital collectible representing cultural artifacts of Northeast India.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThirdwebProvider>
          {children}
          <Toaster position="bottom-center" />
        </ThirdwebProvider>
      </body>
    </html>
  );
}
