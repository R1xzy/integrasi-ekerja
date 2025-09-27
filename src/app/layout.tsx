
'use client'; 

import type { Metadata } from "next";
import { Inter } from "next/font/google";
// @ts-ignore
import "./globals.css";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// PERBAIKAN: Impor menggunakan default import untuk kompatibilitas yang lebih luas
// Beberapa bundler (termasuk Next.js) memproses paket CJS lama dengan cara ini


import NavbarController from "@/components/NavbarController"; 
import UniversalFooter from "@/components/Footer"; 

const interSans = Inter({
  variable: "--font-inter-sans",
  subsets: ["latin"],
});


const getCookie = (name: string): string | null => {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        // Ambil bagian setelah nama cookie, lalu ambil bagian sebelum semicolon (end of cookie)
        return parts.pop()?.split(';').shift() || null;
    }
    return null;
};

/**
 * Helper: Mendecode JWT payload (base64) secara manual untuk mendapatkan klaim 'exp'.
 * Menggantikan jwtDecode().
 */
const decodeTokenPayloadManually = (token: string): { exp: number } | null => {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) {
            return null;
        }
        // Payload adalah bagian kedua, decode dari Base64URL ke JSON
        const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const payloadJson = atob(payloadBase64);
        const payload = JSON.parse(payloadJson);
        
        if (typeof payload.exp !== 'number') {
            return null;
        }
        return payload as { exp: number };
    } catch (e) {
        console.error("Manual token decode failed:", e);
        return null;
    }
};

// --- Komponen Timer Logout ---
const AutoLogoutTimer = () => {
    const router = useRouter();
    const [timeRemaining, setTimeRemaining] = useState(0);

    const handleLogout = useCallback(async () => {
        // Bersihkan state client
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        
        // Panggil endpoint logout Anda
        try {
            await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }); 
        } catch (error) {
            console.error("Logout API failed:", error);
        }
        router.push('/login');
    }, [router]);

    useEffect(() => {
        // PERBAIKAN: Menggunakan getCookie()
        const token = getCookie('auth-token'); 
        
        if (!token) {
            return;
        }

        let interval: NodeJS.Timeout | null = null;
        
        try {
            // PERBAIKAN: Menggunakan decodeTokenPayloadManually()
            const decodedToken = decodeTokenPayloadManually(token);
            
            if (!decodedToken) {
                // Token tidak valid atau rusak
                handleLogout();
                return;
            }

            const expiryTimeMs = decodedToken.exp * 1000; // Konversi ke milidetik
            const currentTimeMs = Date.now();
            
            let initialTimeRemaining = expiryTimeMs - currentTimeMs;
            
            if (initialTimeRemaining <= 0) {
                handleLogout();
                return;
            }

            setTimeRemaining(initialTimeRemaining);

            interval = setInterval(() => {
                setTimeRemaining(prevTime => {
                    const newTime = prevTime - 1000;
                    if (newTime <= 0) {
                        if (interval) clearInterval(interval);
                        handleLogout();
                        return 0;
                    }
                    return newTime;
                });
            }, 1000);

        } catch (error) {
            console.error("Error decoding token or setting timer:", error);
            if (interval) clearInterval(interval);
            handleLogout(); 
        }
        
        return () => { 
            if (interval) clearInterval(interval);
        };
    }, [handleLogout]);

    return null; 
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <title>E-Kerja Karawang - Platform Jasa Terpercaya</title>
        <meta name="description" content="Platform terpercaya untuk menemukan dan menyediakan berbagai layanan jasa profesional di Karawang, di Indonesia" />
      </head>
      <body className={interSans.variable}>
        {/* Cukup panggil satu komponen ini */}
        <NavbarController /> 
        <main className="duration-300">{children}</main>
        {/* Anda bisa menambahkan Footer di sini jika ada */}
        <UniversalFooter /> 
      </body>
    </html>
  );
}
