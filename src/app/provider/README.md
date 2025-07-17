# Folder `provider`

Area dashboard khusus penyedia jasa (provider). Semua halaman di dalam folder ini hanya dapat diakses oleh user dengan peran *provider* (dilindungi oleh `middleware.ts`).

## Struktur

```
provider/
├─ layout.tsx      # (opsional) layout sidebar provider
├─ dashboard/      # Ringkasan performa provider
├─ orders/         # Daftar pesanan yang diterima provider
├─ services/       # Manajemen layanan yang ditawarkan
└─ profile/        # Profil provider & pengaturan akun
```

## Fitur Umum
* Navigasi internal menggunakan Sidebar/Topbar khusus provider
* Komunikasi API ke endpoint `/api/provider/*`
* Proteksi route otomatis oleh middleware

Tambahkan halaman baru di sini bila hanya relevan untuk role *provider*.
