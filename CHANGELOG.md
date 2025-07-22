# Changelog

[branch: main] | 22 Juli 2025

- Membuat JWT utility library di `/src/lib/jwt.ts` dengan fungsi generateJWTToken, verifyJWTToken, dan createAuthMiddleware untuk Bearer token authentication.
- Menambahkan API validation schemas di `/src/lib/validations.ts` untuk validasi data profil provider dan dokumen.
- Mengimplementasikan endpoint login `/src/app/api/auth/login/route.ts` dengan Bearer token response format sesuai REQ-B-1.2.
- Membuat endpoint manajemen profil provider di `/src/app/api/providers/profile/route.ts` (GET/PUT) dengan Bearer token authentication.
- Menambahkan endpoint CRUD dokumen provider di `/src/app/api/providers/documents/route.ts` dan `/src/app/api/providers/documents/[id]/route.ts`.
- Mengimplementasikan file upload API di `/src/app/api/upload/route.ts` dengan Bearer token authentication untuk semua authenticated users.
- Membuat endpoint verifikasi admin di `/src/app/api/admin/providers/[id]/verify/route.ts` untuk approve/reject provider verification.
- Memperbaiki endpoint `/src/app/api/profile/route.ts` dengan migrasi dari requireAuth ke Bearer token authentication menggunakan createAuthMiddleware.
- Memperbarui database seeding di `/prisma/seed.ts` dengan user credentials yang benar (admin123, customer123, provider123).
- Membuat Postman collection `postman-collection.json` dengan 25+ requests untuk testing semua endpoints Bearer token.
- Menambahkan Postman environment `postman-environment.json` dengan auto-token extraction scripts dan environment variables.
- Menggabungkan 7 file dokumentasi terpisah menjadi satu file komprehensif `COMPREHENSIVE-GUIDE.md` (500+ baris documentation).

In progress:
- Testing komprehensif role-based access control untuk Provider/Customer/Admin pada semua protected endpoints.
- Validasi JWT token expiry dan refresh mechanism untuk session management REQ-B-1.4.
