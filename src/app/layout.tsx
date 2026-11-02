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
      <body className={inter.className}>
        <div className="phone-shell">
          {children}
        </div>
      </body>
    </html>
  );
}
