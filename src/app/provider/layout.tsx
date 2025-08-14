import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import ProviderNavbar from "@/components/provider/ProviderNavbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "E-Kerja Karawang - Platform Jasa Terpercaya",
  description: "Platform terpercaya untuk menemukan dan menyediakan berbagai layanan jasa profesional di Karawang, di Indonesia",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className="min-h-screen bg-gray-50 text-gray-600 duration-300">

            {children}
        </div>
        
        
      </body>
    </html>
  );
}
