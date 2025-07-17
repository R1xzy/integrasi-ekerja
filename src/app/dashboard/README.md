# Folder `dashboard`

Area dashboard **admin**. Semua halaman di sini dilindungi `middleware.ts` dan hanya bisa diakses oleh pengguna dengan role `admin`.

Struktur halaman:
```
dashboard/
├─ page.tsx           # Ringkasan statistik admin
├─ services/
├─ customers/
├─ providers/
└─ orders/
```

Komponen shared:
* `DashboardNavbar` – navbar konsisten di seluruh dashboard.
* Layout khusus bisa dibuat di `dashboard/layout.tsx` jika ingin sidebar/global wrapper.

Instruksi kontributor:
* Tambahkan modul baru di dalam folder ini saja bila eksklusif admin.
* Gunakan server actions / API route admin spesifik di `/api/admin/*`.
