import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Style AI — Personal Style Intelligence",
  description: "A private style intelligence for your palette, wardrobe, and point of view.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
