import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import NavbarController from "@/components/NavbarController"; // Impor controller baru
import UniversalFooter from "@/components/Footer"; // Impor footer universal

const geistSans = Geist({
  variable: "--font-geist-sans",
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
    <html lang="en">
      <body className={geistSans.variable}>
        {/* Cukup panggil satu komponen ini */}
        <NavbarController /> 
        <main className="duration-300">{children}</main>
        {/* Anda bisa menambahkan Footer di sini jika ada */}
        <UniversalFooter /> 
      </body>
    </html>
  );
}
