# E-Kerja Karawang

Platform digital yang menghubungkan masyarakat Karawang dengan penyedia jasa profesional dan terpercaya untuk berbagai kebutuhan rumah tangga dan bisnis.

## 🚀 Fitur Utama

- **Dashboard Admin Lengkap**: Kelola pengguna, penyedia jasa, pesanan, dan layanan
- **Manajemen Layanan**: Dashboard untuk mengelola semua layanan dengan filter dan search
- **Manajemen Pelanggan**: Dashboard untuk mengelola data pelanggan dan riwayat transaksi
- **Manajemen Penyedia**: Verifikasi dan kelola penyedia jasa dengan sistem rating
- **Sistem Pesanan**: Lacak dan kelola pesanan layanan dengan status tracking
- **Kategori Layanan**: Berbagai kategori jasa seperti AC, kebersihan, konstruksi, dll
- **Sistem Login & Authentication**: Login dengan role-based access (admin, customer, provider)
- **Sistem Rating & Review**: Penilaian kualitas layanan dari pelanggan
- **Responsive Design**: Optimized untuk desktop dan mobile

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MariaDB dengan Prisma ORM
- **Authentication**: JWT Bearer Token
- **UI Components**: Radix UI, Lucide Icons
- **Styling**: Tailwind CSS

## 📋 Prerequisites

Pastikan Anda telah menginstall:
- Node.js (versi 18 atau lebih baru)
- npm atau yarn
- MariaDB Server
- Git

## 🔧 Instalasi

### 1. Clone Repository

```bash
git clone https://github.com/kyeiki/next-ekerja.git
cd next-ekerja
```

### 2. Install Dependencies

```bash
npm install
# atau
yarn install
```

### 3. Setup MariaDB Database

Pastikan MariaDB sudah terinstall dan berjalan:

```bash
# macOS (menggunakan Homebrew)
brew install mariadb
brew services start mariadb

# Ubuntu/Debian
sudo apt install mariadb-server mariadb-client
sudo systemctl start mariadb
```

Buat database dan user untuk aplikasi:

```bash
# Login ke MariaDB sebagai root
sudo mysql -u root

# Atau jalankan script setup yang disediakan
mysql -u root -p < setup-mariadb.sql
```

**SQL Commands untuk setup manual:**
```sql
-- Buat database
CREATE DATABASE ekerja_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Buat user
CREATE USER 'ekerja_user'@'localhost' IDENTIFIED BY 'ekerja_password_123';

-- Berikan privileges
GRANT ALL PRIVILEGES ON ekerja_db.* TO 'ekerja_user'@'localhost';
FLUSH PRIVILEGES;
```

### 4. Setup Environment Variables

Buat file `.env` di root directory:

```env
# Database - MariaDB
DATABASE_URL="mysql://ekerja_user:ekerja_password_123@localhost:3306/ekerja_db"

# JWT Secret
JWT_SECRET="your-jwt-secret-key-here"

# Development
NODE_ENV="development"
```

### 5. Setup Database Schema

Generate Prisma client dan push schema ke MariaDB:

```bash
npx prisma generate
npx prisma db push
```

**Test koneksi database:**
```bash
# Test koneksi ke MariaDB
node test-mariadb-connection.js
```

### 6. Seed Database

Isi database dengan data awal:

```bash
npx prisma db seed
```

### 7. Jalankan Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

> **Note**: Jika port 3000 sudah digunakan, Next.js akan otomatis menggunakan port 3001 atau port lain yang tersedia.

## 👥 Akun Default

Setelah menjalankan seed, Anda dapat login dengan akun berikut:

### Admin
- **Email**: `admin@ekerjakarawang.com`
- **Password**: `admin123`
- **Dashboard**: [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
- **Akses**: Dashboard lengkap dengan manajemen layanan, pelanggan, penyedia, dan pesanan

### Customer
- **Email**: `customer@example.com`
- **Password**: `customer123`

### Provider
- **Email**: `provider@example.com`
- **Password**: `provider123`

## 📁 Struktur Project

```
next-ekerja/
├── src/
│   ├── app/                         # Next.js App Router
│   │   ├── (auth)/                  # Halaman login & register (route-group)
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (dev)/                   # Halaman debugging (diabaikan URL)
│   │   │   └── test-auth/
│   │   ├── dashboard/               # Admin dashboard (protected)
│   │   ├── provider/                # Provider dashboard (protected)
│   │   ├── customer/                # Namespace customer (orders)
│   │   ├── services/                # Halaman layanan publik
│   │   ├── providers/               # Halaman penyedia publik
│   │   ├── about/                   # Halaman tentang
│   │   ├── orders/                  # Halaman pesanan customer
│   │   ├── layout.tsx               # Root layout (MainNavbar)
│   │   ├── page.tsx                 # Home page
│   │   └── api/                     # API routes
│   │       └── auth/                # Authentication endpoints
│   ├── components/                  # Reusable components (MainNavbar, DashboardNavbar, dll.)
│   └── lib/                         # Utilities dan helpers
├── prisma/                          # Skema & seeder database
├── public/                          # Static assets
└── ...
```

## 🗄️ Database Schema

Database menggunakan MariaDB dengan Prisma ORM. Schema utama:

- **Users**: Pengguna (admin, customer, provider)
- **Roles**: Role pengguna  
- **ServiceCategories**: Kategori layanan
- **ProviderServices**: Layanan yang ditawarkan provider
- **Orders**: Pesanan layanan dengan status tracking
- **OrderDetails**: Detail item dalam pesanan dengan approval workflow
- **Reviews**: Review dan rating dengan C-9 compliance
- **ReviewReports**: Sistem pelaporan review untuk moderasi
- **Portfolios**: Portfolio provider
- **ProviderDocuments**: Dokumen verifikasi provider

**Fitur Database:**
- ✅ **Order Management**: Complete order lifecycle dengan status transitions
- ✅ **Order Details**: Dynamic itemization dengan customer approval
- ✅ **Review System**: C-9 compliant reviews untuk completed orders only
- ✅ **Admin Moderation**: Review reporting dan resolution system
- ✅ **Document Management**: Provider verification documents
- ✅ **Role-based Access**: Proper authorization untuk setiap endpoint

## 📊 Halaman Dashboard Admin

Dashboard admin telah dilengkapi dengan halaman-halaman berikut:

### 1. Dashboard Utama (`/dashboard`)
- Overview statistik platform
- Grafik dan metrics penting
- Quick actions untuk admin

### 2. Manajemen Layanan (`/dashboard/services`)
- Tabel lengkap semua layanan
- Filter berdasarkan kategori dan status
- Search layanan, penyedia, atau kategori
- Stats: Total layanan, aktif, pending, tidak aktif
- Aksi: View, Edit, Delete layanan

### 3. Manajemen Pelanggan (`/dashboard/customers`)
- Tabel lengkap data pelanggan
- Search berdasarkan nama, email, telepon
- Filter berdasarkan status akun
- Stats: Total pelanggan, aktif, total transaksi, rating rata-rata
- Riwayat transaksi dan informasi kontak

### 4. Manajemen Penyedia (`/dashboard/providers`)
- Tabel penyedia jasa terdaftar
- Verifikasi dan approval penyedia
- Manajemen status dan rating

### 5. Manajemen Pesanan (`/dashboard/orders`)
- Tracking semua pesanan
- Update status pesanan
- Laporan transaksi

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
# Test koneksi MariaDB
node test-mariadb-connection.js

# Reset database (hati-hati!)
npx prisma db push --force-reset

# View database dengan GUI
npx prisma studio

# Generate client setelah perubahan schema
npx prisma generate

# Seed database dengan data awal
npx prisma db seed

# Manual database operations
mysql -u ekerja_user -p ekerja_db
```

### API Testing

```bash
# Test semua endpoints dengan Postman Collection
# Import file: postman-collection.json
# Import environment: postman-environment.json

# Atau test manual:
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ekerjakarawang.com","password":"admin123"}'
```

## 📱 Halaman & API Endpoints

### Frontend Pages
- **/** - Homepage dengan hero section dan kategori layanan
- **/services** - Daftar semua layanan dengan filter
- **/services/[id]** - Detail layanan
- **/providers** - Daftar penyedia jasa
- **/providers/[id]** - Profile penyedia jasa
- **/about** - Tentang E-Kerja Karawang
- **/login** - Halaman login
- **/register** - Halaman registrasi
- **/dashboard** - Admin dashboard (requires admin login)
- **/orders** - Customer orders management
- **/provider/dashboard** - Provider dashboard

### API Endpoints (Bearer Token Protected)

**Authentication:**
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration  
- `GET /api/auth/me` - Get current user profile

**Order Management (REQ-B-5):**
- `POST /api/orders` - Create new order (Customer)
- `GET /api/orders` - Get orders (role-based filtering)
- `PUT /api/orders/[id]` - Update order status (Provider)
- `GET /api/orders/[id]` - Get order details

**Order Details (REQ-B-6):**
- `POST /api/orders/[id]/details` - Add order item (Provider)
- `GET /api/orders/[id]/details` - Get order details
- `PUT /api/orders/[id]/details/[detailId]` - Approve/reject item (Customer)
- `DELETE /api/orders/[id]/details/[detailId]` - Remove item (Provider)

**Review System (REQ-B-7):**
- `POST /api/reviews` - Create review (Customer, C-9 compliant)
- `GET /api/reviews` - Get reviews dengan filtering
- `POST /api/review-reports` - Report review
- `GET /api/review-reports` - Admin get reports
- `PUT /api/review-reports/[id]` - Admin resolve report

**Service Management:**
- `GET /api/services/search` - Search services dengan filters
- `GET /api/service-categories` - Get all categories
- `POST /api/provider/services` - Create service (Provider)
- `GET /api/provider/services` - Get provider services

**Admin Functions:**
- `GET /api/admin/verification` - Get pending verifications
- `PUT /api/admin/verification` - Approve/reject provider

## 🔐 Authentication & Authorization

Project menggunakan JWT Bearer Token authentication dengan role-based access control:

### Authentication Flow
1. **Login**: POST `/api/auth/login` → Returns Bearer token
2. **Protected Routes**: Include `Authorization: Bearer <token>` header
3. **Role Validation**: Automatic role checking pada setiap endpoint

### User Roles & Permissions
- **Admin**: Full access ke semua endpoints dan dashboard
- **Provider**: Manage own services, orders, dan portfolio
- **Customer**: Create orders, reviews, dan view services

### Security Features
- ✅ **JWT Token Validation**: Secure token-based authentication
- ✅ **Role-based Access Control**: Endpoint protection berdasarkan role
- ✅ **Input Validation**: Comprehensive validation pada semua inputs
- ✅ **Business Rule Enforcement**: C-9 compliance, status validation, dll
- ✅ **CORS Protection**: Proper cross-origin resource sharing
- ✅ **SQL Injection Prevention**: Prisma ORM provides automatic protection

## � Testing & Development Tools

### Postman Collection
Project menyediakan comprehensive Postman collection untuk testing semua endpoints:

```bash
# Files yang tersedia:
├── postman-collection.json      # 50+ test cases untuk semua API endpoints
├── postman-environment.json     # Environment variables dengan auto-token extraction
├── POSTMAN_TESTING_GUIDE.md     # Panduan lengkap testing dengan Postman
└── test-mariadb-connection.js   # Script test koneksi database
```

**Import ke Postman:**
1. Import `postman-collection.json` 
2. Import `postman-environment.json`
3. Ikuti panduan di `POSTMAN_TESTING_GUIDE.md`

### Database Testing
```bash
# Test koneksi MariaDB
node test-mariadb-connection.js

# View data di database
npx prisma studio
# Buka: http://localhost:5555
```

### Requirements Coverage
- ✅ **[REQ-B-1]** API Pengguna dan Autentikasi
- ✅ **[REQ-B-2]** API Manajemen Profil dan Verifikasi  
- ✅ **[REQ-B-3]** API Manajemen Layanan dan Portofolio
- ✅ **[REQ-B-4]** API Penemuan dan Detail Layanan
- ✅ **[REQ-B-5]** API Proses Pemesanan
- ✅ **[REQ-B-6]** API Rincian Pesanan dan Biaya
- ✅ **[REQ-B-7]** API Ulasan dan Pelaporan

## 🔧 Troubleshooting

### Database Issues
```bash
# MariaDB tidak bisa connect
sudo systemctl status mariadb      # Check service status
sudo systemctl start mariadb       # Start service

# Reset database schema
npx prisma db push --force-reset
npx prisma generate
npx prisma db seed

# Check database connection
node test-mariadb-connection.js
```

### Development Issues
```bash
# Port 3000 sudah digunakan
lsof -ti:3000 | xargs kill -9

# Clear Next.js cache
rm -rf .next
npm run dev

# Prisma client issues
rm -rf node_modules/@prisma
npx prisma generate
```

### Common Errors
1. **P1001: Can't reach database server** 
   → Check MariaDB service running: `brew services start mariadb`

2. **P1003: Database does not exist**
   → Run setup script: `mysql -u root -p < setup-mariadb.sql`

3. **401 Unauthorized**
   → Check Bearer token in Authorization header

4. **403 Forbidden**
   → Verify user role permissions untuk endpoint

## �🤝 Contributing

1. Fork repository
2. Buat feature branch (`git checkout -b feature/amazing-feature`)
3. Commit perubahan (`git commit -m 'Add amazing feature'`)
4. Push ke branch (`git push origin feature/amazing-feature`)
5. Buat Pull Request

## 📄 License

Project ini menggunakan MIT License. Lihat file `LICENSE` untuk detail.

## 🆘 Support

Jika Anda mengalami masalah atau memiliki pertanyaan:

1. Cek [Issues](https://github.com/kyeiki/next-ekerja/issues) yang sudah ada
2. Buat issue baru jika diperlukan
3. Hubungi tim development

## 🏢 Mitra

- **Politeknik Negeri Bandung** - Mitra Pendidikan
- **Dinas Tenaga Kerja dan Transmigrasi Kabupaten Karawang** - Mitra Pemerintah

---

**E-Kerja Karawang** - Menghubungkan Kebutuhan dengan Solusi Terbaik di Karawang
