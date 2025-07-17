# Folder `orders`

Halaman khusus customer untuk melihat daftar pesanan dan detail tiap pesanan.

```
orders/
├─ page.tsx   # List pesanan customer
└─ [id]/page.tsx  # Detail pesanan
```

Proteksi:
* Middleware mengarahkan ke `/login` bila user belum login atau bukan role `customer`.

Kontributor:
* Pastikan GET/POST API di `/api/orders`.
* Komponen UI siap pakai ada di `src/components/customer/`.
