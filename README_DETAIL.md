# Struktur Kode E-Kerja Karawang

Dokumen ini menjelaskan struktur direktori, arsitektur, dan konvensi penamaan pada proyek **E-Kerja Karawang** (Next.js 14 – App Router). Dibuat agar memudahkan kontributor baru memahami alur kode base ini.

---

## 1. Ringkasan Teknologi

* **Next.js 14** dengan App Router (`src/app`)
* **TypeScript** – tipe di seluruh aplikasi
* **Tailwind CSS** – styling utility–first
* **Lucide-React** – ikon
* **Prisma ORM + SQLite** – lapisan data
* **Cookie-based Auth** – dual-cookie (httpOnly + client)

---

## 2. Layout Direktori Utama

```
sejasa-clone/
├─ prisma/               # Skema & seeder database
├─ public/               # Aset statis
├─ src/
│  ├─ app/               # App Router pages & API routes
│  │  ├─ layout.tsx      # Root layout (font & MainNavbar global)
│  │  ├─ page.tsx        # Home page
│  │  ├─ about/          # Halaman About
│  │  ├─ services/       # List & detail layanan
│  │  ├─ providers/      # List & detail penyedia jasa
│  │  ├─ orders/         # Halaman customer orders & detail
│  │  ├─ customer/       # Namespace customer (re-export orders*)
│  │  ├─ dashboard/      # Namespace admin dashboard
│  │  ├─ provider/       # Namespace provider dashboard
│  │  └─ api/            # API Route handlers (auth, dsb.)
│  │     └─ auth/
│  │        ├─ login/route.ts
│  │        ├─ logout/route.ts
│  │        └─ me/route.ts
│  ├─ components/        # Komponen UI reusable
│  │  ├─ MainNavbar.tsx  # Navbar global adaptif role
│  │  ├─ customer/       # Komponen khusus customer
│  │  └─ dashboard/      # DashboardNavbar & komponen admin
│  ├─ lib/               # Helper & mock data
│  │  ├─ sampleOrders.ts # Contoh data pesanan
│  │  └─ utils.ts        # Helper (formatCurrency, dll.)
│  └─ middleware.ts      # Proteksi route & redirect role
├─ tailwind.config.ts    # Konfigurasi Tailwind
├─ README.md             # Panduan singkat instalasi
└─ README_DETAIL.md      # (dokumen ini)
```
*`/customer/orders` dan `/customer/orders/[id]` hanya meng-re-export modul di `/orders` untuk konsistensi URL.*

---

## 3. Alur Routing & Layout

| Folder | Tipe Komponen | Catatan |
|--------|---------------|---------|
| `src/app/layout.tsx` | **Server Component** | Membungkus seluruh halaman, meng-inject global Tailwind class, dan merender `MainNavbar` di semua halaman publik. |
| `src/app/(route)/page.tsx` | **Client / Server** | Jika memakai state/hook ditandai `"use client"`. |
| `src/app/api/**/route.ts` | **Request Handler** | Mengembalikan Response <https://nextjs.org/docs/app/building-your-application/routing/router-handlers>. |
| `middleware.ts` | Edge Middleware | Mengecek cookie, redirect sesuai role. |

---

## 4. Autentikasi

1. **Login** (`/api/auth/login`)
   * Menetapkan empat cookie: `auth-token` & `user-session` (httpOnly) + varian `*-client` agar bisa dibaca React.
2. **MainNavbar** pada mount:
   * Cek `localStorage.user` → cookie client → fallback API `/api/auth/me`.
   * Menampilkan menu sesuai `role` (admin/provider/customer/guest).
3. **Logout** (`/api/auth/logout`)
   * Menghapus semua cookie & localStorage, lalu reload halaman.
4. **Route Protection** – `middleware.ts`
   * `/dashboard/*` → admin
   * `/provider/*` → provider
   * `/orders` → customer
   * Redirect login jika belum auth.

---

## 5. Komponen Navigasi

| Komponen | Lokasi | Digunakan Di |
|----------|--------|--------------|
| `MainNavbar` | `src/components/MainNavbar.tsx` | Semua halaman publik. Otomatis **disembunyikan** di path dashboard admin (`/dashboard/*`) & provider (`/provider/*`). |
| `DashboardNavbar` | `src/components/dashboard/` | Seluruh halaman admin dashboard. |

---

## 6. Standar Penamaan & Konvensi

* **Client Component** selalu diawali dengan directive `"use client"`.
* File React memakai ekstensi `.tsx`; handler API `.ts`.
* Variabel CSS custom font didefinisikan di `layout.tsx` (`--font-geist-*`).
* Fungsi helper ditempatkan di `src/lib/*` agar tidak membuat `node_modules` bloat.

---

## 7. Cara Menambah Halaman Baru (Contoh)

1. Buat folder di `src/app/my-page/page.tsx`.
2. Jika perlu state → tambahkan `"use client"` di baris pertama.
3. Gunakan komponen siap pakai (`Button`, `MainNavbar`, dll.).
4. Tambah proteksi di `middleware.ts` bila halaman perlu role tertentu.

---

## 8. Skrip Penting

| Perintah | Fungsi |
|----------|--------|
| `npm run dev` | Menjalankan Next.js pada http://localhost:3000 |
| `npx prisma migrate dev` | Migrasi + seeder database (development) |
| `npm run lint` | ESLint + TypeScript check |

---

## 9. Catatan Performa & Produksi

* Aktifkan `secure: true` pada cookie di environment produksi.
* Pertimbangkan mem-split API ke server terpisah jika skala besar.
* Implementasi SSR pada halaman berat untuk SEO (`services`, `providers`).

---

## 10. Kontak

Untuk pertanyaan lebih lanjut, buka *Issues* pada repo GitHub atau hubungi maintainer utama.
