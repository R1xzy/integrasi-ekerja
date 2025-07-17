# Folder `services`

Halaman publik yang menampilkan daftar layanan serta detail tiap layanan.

Struktur:
```
services/
├─ page.tsx   # Daftar layanan dengan filter & pencarian
└─ [id]/page.tsx  # Detail layanan berdasarkan slug/ID
```

Catatan:
* Komponen `MainNavbar` global dipakai.
* Halaman ini bersifat SEO-friendly — pertimbangkan SSR jika data di-fetch dari DB.
* Jangan menaruh logika admin/provider di sini; tetap publik.
