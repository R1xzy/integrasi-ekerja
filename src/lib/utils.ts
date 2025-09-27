import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { NextResponse } from "next/server"
import md5 from 'crypto-js/md5';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export function handleApiError(error: any) {
  console.error('API Error:', error);
  
  return NextResponse.json({
    success: false,
    message: error.message || 'Internal server error'
  }, { status: 500 });
}



/**
 * Menghasilkan URL Gravatar dari alamat email.
 * @param email Alamat email pengguna.
 * @param size Ukuran gambar dalam piksel (default: 200).
 * @returns URL lengkap ke gambar Gravatar.
 */
export const getGravatarURL = (email: string, size: number = 200): string => {
  if (!email) {
    // Kembalikan gambar default jika email tidak ada
    return `https://www.gravatar.com/avatar/?d=mp&s=${size}`;
  }
  // 1. Bersihkan dan ubah email menjadi huruf kecil
  const trimmedEmail = email.trim().toLowerCase();
  // 2. Buat hash MD5 dari email
  const hash = md5(trimmedEmail).toString();
  // 3. Kembalikan URL Gravatar lengkap dengan parameter default 'mp' (mystery person)
  return `https://www.gravatar.com/avatar/${hash}?d=mp&s=${size}`;
};