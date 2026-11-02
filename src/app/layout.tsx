import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Style AI",
  description: "Your personal AI stylist.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Style AI",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-[#000000]">
      <body className={`${inter.className} antialiased bg-[#000000] text-[#FFFFFF] flex justify-center`}>
        {/* Mobile App Container */}
        <div className="w-full max-w-md bg-[#000000] min-h-screen relative shadow-2xl border-x border-[#222222]">
          {children}
        </div>
      </body>
    </html>
  );
}
