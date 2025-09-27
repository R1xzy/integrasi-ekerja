"use client"; 

import Image from 'next/image';
import { getGravatarURL } from '@/lib/utils'; // Impor fungsi yang baru dibuat
import { cn } from '@/lib/utils'; // Utilitas untuk menggabungkan class (opsional tapi bagus)

interface AvatarProps {
  /** URL gambar profil yang ada. Jika null atau undefined, akan menggunakan Gravatar. */
  src: string | null | undefined;
  /** Email pengguna, digunakan untuk fallback ke Gravatar jika src tidak ada. */
  email: string;
  /** Teks alternatif untuk gambar, biasanya nama pengguna. */
  alt: string;
  /** Ukuran gambar dalam piksel (lebar dan tinggi). Default: 96 (untuk 24 di tailwind, w-24 h-24) */
  size?: number;
  /** ClassName tambahan dari Tailwind CSS untuk styling. */
  className?: string;
}

/**
 * Komponen Avatar yang secara cerdas menampilkan gambar profil pengguna.
 * Jika URL gambar tidak tersedia, komponen ini akan otomatis menggunakan
 * Gravatar berdasarkan email sebagai fallback.
 */
export default function Avatar({
  src,
  email,
  alt,
  size = 96,
  className,
}: AvatarProps) {
  // Tentukan URL gambar: gunakan src jika ada, jika tidak, panggil getGravatarURL.
  const imageUrl = src || getGravatarURL(email, size);

  return (
    <Image
      src={imageUrl}
      alt={alt}
      width={size}
      height={size}
      // Gabungkan className default dengan className dari props
      className={cn(
        'bg-gray-200 rounded-full object-cover', // Class default
        className // Class tambahan dari props
      )}
      // Mencegah error jika gambar dari Gravatar gagal dimuat
      onError={(e) => {
        e.currentTarget.src = getGravatarURL('', size); // Fallback ke mystery person jika ada error
      }}
    />
  );
}