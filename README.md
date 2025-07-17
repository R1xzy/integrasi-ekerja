# E-Kerja Karawang

Platform digital yang menghubungkan masyarakat Karawang dengan penyedia jasa profesional dan terpercaya untuk berbagai kebutuhan rumah tangga dan bisnis.

## 🚀 Fitur Utama

- **Dashboard Admin**: Kelola pengguna, penyedia jasa, dan pesanan
- **Manajemen Penyedia**: Verifikasi dan kelola penyedia jasa
- **Sistem Pesanan**: Lacak dan kelola pesanan layanan
- **Kategori Layanan**: Berbagai kategori jasa seperti AC, kebersihan, konstruksi, dll
- **Sistem Rating & Review**: Penilaian kualitas layanan
- **Responsive Design**: Optimized untuk desktop dan mobile

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: SQLite dengan Prisma ORM
- **Authentication**: NextAuth.js (ready for implementation)
- **UI Components**: Radix UI, Lucide Icons
- **Styling**: Tailwind CSS

## 📋 Prerequisites

Pastikan Anda telah menginstall:
- Node.js (versi 18 atau lebih baru)
- npm atau yarn
- Git

## 🔧 Instalasi

### 1. Clone Repository

```bash
git clone https://github.com/username/e-kerja-karawang.git
cd e-kerja-karawang
```

### 2. Install Dependencies

```bash
npm install
# atau
yarn install
```

### 3. Setup Environment Variables

Buat file `.env` di root directory:

```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth (optional - untuk implementasi authentication)
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Setup Database

Generate Prisma client dan setup database:

```bash
npx prisma generate
npx prisma db push
```

### 5. Seed Database

Isi database dengan data awal:

```bash
npm run db:seed
```

### 6. Jalankan Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

## 👥 Akun Default

Setelah menjalankan seed, Anda dapat login dengan akun berikut:

### Admin
- **Email**: `admin@ekerjakarawang.com`
- **Password**: `admin123`
- **Dashboard**: [http://localhost:3000/dashboard](http://localhost:3000/dashboard)

### Customer
- **Email**: `customer@example.com`
- **Password**: `customer123`

### Provider
- **Email**: `provider@example.com`
- **Password**: `provider123`

## 📁 Struktur Project

```
e-kerja-karawang/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── dashboard/       # Admin dashboard
│   │   ├── services/        # Halaman layanan
│   │   ├── providers/       # Halaman penyedia
│   │   ├── about/          # Halaman tentang
│   │   ├── login/          # Halaman login
│   │   └── register/       # Halaman register
│   ├── components/         # Reusable components
│   └── lib/               # Utilities dan helpers
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts           # Database seeder
├── public/               # Static assets
└── ...
```

## 🗄️ Database Schema

Database menggunakan SQLite dengan Prisma ORM. Schema utama:

- **Users**: Pengguna (admin, customer, provider)
- **Roles**: Role pengguna
- **ServiceCategories**: Kategori layanan
- **ProviderServices**: Layanan yang ditawarkan provider
- **Orders**: Pesanan layanan
- **Reviews**: Review dan rating
- **Portfolios**: Portfolio provider
- **Certifications**: Sertifikat provider

## 🚀 Development

### Menjalankan dalam Development Mode

```bash
npm run dev
```

### Build untuk Production

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

### Database Commands

```bash
# Reset database
npx prisma db push --force-reset

# View database
npx prisma studio

# Generate client setelah perubahan schema
npx prisma generate

# Seed database
npm run db:seed
```

## 📱 Halaman Utama

- **/** - Homepage dengan hero section dan kategori layanan
- **/services** - Daftar semua layanan dengan filter
- **/services/[id]** - Detail layanan
- **/providers** - Daftar penyedia jasa
- **/providers/[id]** - Profile penyedia jasa
- **/about** - Tentang E-Kerja Karawang
- **/login** - Halaman login
- **/register** - Halaman registrasi
- **/dashboard** - Admin dashboard (requires admin login)

## 🔐 Authentication

Project ini sudah disiapkan untuk implementasi authentication dengan NextAuth.js. Untuk mengaktifkan:

1. Uncomment konfigurasi NextAuth di `src/app/api/auth/[...nextauth]/route.ts`
2. Setup provider authentication (Google, GitHub, dll)
3. Implementasikan middleware untuk protected routes

## 🤝 Contributing

1. Fork repository
2. Buat feature branch (`git checkout -b feature/amazing-feature`)
3. Commit perubahan (`git commit -m 'Add amazing feature'`)
4. Push ke branch (`git push origin feature/amazing-feature`)
5. Buat Pull Request

## 📄 License

Project ini menggunakan MIT License. Lihat file `LICENSE` untuk detail.

## 🆘 Support

Jika Anda mengalami masalah atau memiliki pertanyaan:

1. Cek [Issues](https://github.com/username/e-kerja-karawang/issues) yang sudah ada
2. Buat issue baru jika diperlukan
3. Hubungi tim development

## 🏢 Mitra

- **Politeknik Negeri Bandung** - Mitra Pendidikan
- **Dinas Tenaga Kerja dan Transmigrasi Kabupaten Karawang** - Mitra Pemerintah

---

**E-Kerja Karawang** - Menghubungkan Kebutuhan dengan Solusi Terbaik di Karawang
