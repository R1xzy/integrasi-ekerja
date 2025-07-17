# Quick Start - E-Kerja Karawang di Ubuntu

## 🚀 Instalasi Cepat (Otomatis)

### 1. Download dan Extract
```bash
# Download ZIP dari GitHub
wget https://github.com/kyeiki/next-ekerja/archive/refs/heads/main.zip -O next-ekerja-main.zip

# Extract
unzip next-ekerja-main.zip
cd next-ekerja-main
```

### 2. Jalankan Script Instalasi
```bash
# Buat script executable
chmod +x install-ubuntu.sh

# Jalankan instalasi otomatis
./install-ubuntu.sh
```

Script akan otomatis:
- ✅ Install Node.js 18.x LTS
- ✅ Install dependencies
- ✅ Setup database
- ✅ Konfigurasi environment
- ✅ Siap dijalankan

### 3. Akses Aplikasi
```bash
# Jika belum otomatis start
npm run dev

# Buka browser: http://localhost:3000
```

---

## 📋 Instalasi Manual (Step by Step)

### Prerequisites
```bash
sudo apt update
sudo apt install -y curl wget unzip sqlite3
```

### 1. Install Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. Setup Project
```bash
# Extract ZIP
unzip next-ekerja-main.zip
cd next-ekerja-main

# Install dependencies
npm install

# Setup database
npx prisma generate
npx prisma db push

# Copy environment
cp .env.example .env
```

### 3. Jalankan Aplikasi
```bash
# Development
npm run dev

# Production
npm run build
npm start
```

---

## 🔑 Default Accounts

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@ekerja.com | admin123 |
| **Customer** | customer@ekerja.com | customer123 |
| **Provider** | provider@ekerja.com | provider123 |

---

## 🛠️ Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm start               # Start production server

# Database
npx prisma studio       # Database GUI
npx prisma db push      # Update schema
npx prisma generate     # Generate client

# Maintenance
npm run lint            # Check code quality
npm install             # Update dependencies
```

---

## 🌐 Access URLs

- **Homepage**: http://localhost:3000
- **Admin Dashboard**: http://localhost:3000/dashboard
- **Services**: http://localhost:3000/services
- **Providers**: http://localhost:3000/providers
- **Database GUI**: http://localhost:5555 (after `npx prisma studio`)

---

## 🔧 Troubleshooting

### Port 3000 sudah digunakan
```bash
# Cek proses
sudo lsof -i :3000

# Kill proses
sudo kill -9 <PID>

# Atau gunakan port lain
npm run dev -- --port 3001
```

### Error npm install
```bash
# Clear cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### Error Prisma
```bash
# Reset database
npx prisma migrate reset
npx prisma generate
npx prisma db push
```

---

## 📁 Struktur Project

```
next-ekerja-main/
├── src/app/                 # Pages (App Router)
├── src/components/          # Reusable components
├── prisma/                  # Database schema & migrations
├── public/                  # Static assets
├── install-ubuntu.sh        # Auto installer
├── INSTALL-UBUNTU.md        # Detailed guide
└── package.json            # Dependencies
```

---

## 🎯 Fitur Utama

- ✅ **Responsive Design** - Mobile & Desktop
- ✅ **Admin Dashboard** - Kelola users, services, orders
- ✅ **Service Filtering** - Kategori, lokasi, harga, rating
- ✅ **Provider Profiles** - Lengkap dengan rating & reviews
- ✅ **Authentication** - Login/Register system
- ✅ **Database Management** - SQLite dengan Prisma ORM

---

## 📞 Support

**Repository**: https://github.com/kyeiki/next-ekerja  
**Issues**: https://github.com/kyeiki/next-ekerja/issues

Jika ada masalah, cek:
1. Node.js version ≥ 16.x
2. Port 3000 tidak digunakan
3. Dependencies terinstall lengkap
4. Database schema up-to-date
