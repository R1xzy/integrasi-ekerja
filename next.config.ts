import type { NextConfig } from "next";


/** @type {import('next').NextConfig} */
const nextConfig = {
  // Konfigurasi lain mungkin sudah ada di sini...

  // ▼▼▼ TAMBAHKAN ATAU MODIFIKASI BAGIAN INI ▼▼▼
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.gravatar.com',
        port: '',
        pathname: '/avatar/**',
      },
      // Jika Anda punya domain lain, tambahkan di sini
      // Contoh:
      // {
      //   protocol: 'https',
      //   hostname: 'nama-domain-lain.com',
      // },
    ],
  },
  // ▲▲▲ SAMPAI DI SINI ▲▲▲
};

export default nextConfig;
