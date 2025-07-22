# 📚 Comprehensive Guide: E-Kerja Bearer Token Implementation & Testing

## 📋 Table of Contents
1. [Bearer Token Implementation Status](#bearer-token-implementation-status)
2. [Testing Guide](#testing-guide)
3. [Bearer Token & Role Mapping](#bearer-token--role-mapping)
4. [Testing Credentials](#testing-credentials)
5. [Postman Collection & Environment](#postman-collection--environment)
6. [Troubleshooting Guide](#troubleshooting-guide)

---

## 🎯 Bearer Token Implementation Status

### ✅ **Status: COMPLETE** 

#### ✅ [REQ-B-1.2] API Login - **IMPLEMENTED** ✅

**Bearer Token Response Format:**
```json
{
  "success": true,
  "data": {
    "user": { /* user data */ },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": "2h"
  },
  "message": "Login successful"
}
```

#### ✅ [REQ-B-1.4] Session Management - **IMPLEMENTED** ✅

**JWT Token Features:**
- ✅ **Token Generation:** JWT dengan payload user data
- ✅ **Token Validation:** Middleware untuk verify token
- ✅ **Role-based Access:** Provider/Customer/Admin access control  
- ✅ **Expiry Enforcement:** 2 jam sesuai [C-19]
- ✅ **Security Headers:** Bearer token dalam Authorization header

### 🔐 **Security Implementation:**

**JWT Configuration:**
- **Algorithm:** HMAC SHA256  
- **Issuer:** `e-kerja-api`
- **Audience:** `e-kerja-app`
- **Expires:** 2 hours sesuai [C-19]
- **Secret:** Environment variable (production ready)

**Payload Structure:**
```typescript
{
  userId: string,
  email: string, 
  roleId: string,
  roleName: string,
  isActive: boolean,
  iat: number,
  exp: number
}
```

**Middleware Features:**
- ✅ **Token Extraction:** Bearer token dari Authorization header
- ✅ **Token Verification:** JWT signature validation
- ✅ **Expiry Check:** Automatic token expiry enforcement
- ✅ **Role Validation:** Access control berdasarkan role
- ✅ **User Status:** Check isActive status dari token

---

## 🧪 Testing Guide

### 📥 Import ke Postman

1. **Import Collection:**
   - Buka Postman
   - Klik "Import" 
   - Pilih file `postman-collection.json`

2. **Import Environment:**
   - Klik "Import"
   - Pilih file `postman-environment.json`
   - Set environment ke "E-Kerja Development Environment"

### 🚀 Menjalankan Development Server

Sebelum testing, pastikan server berjalan:

```bash
cd /path/to/next-ekerja
npm run dev
```

Server akan berjalan di `http://localhost:3000`

### 📋 Urutan Testing yang Disarankan

#### 1. **[REQ-B-1] Testing Autentikasi** 

**Langkah 1: Register Users**
- `[REQ-B-1.1] Register Customer` ✅ Buat customer baru
- `[REQ-B-1.1] Register Provider` ✅ Buat provider baru  
- `[REQ-B-1.1] Register Admin` ✅ Buat admin baru
- `[REQ-B-1.1] Register - Duplicate Email Test` ❌ Test validasi keunikan

**Langkah 2: Login dan Simpan Token**
- `[REQ-B-1.2] Login Customer` → Simpan response token ke `{{customer_token}}`
- `[REQ-B-1.2] Login Provider` → Simpan response token ke `{{provider_token}}`
- `[REQ-B-1.2] Login Admin` → Simpan response token ke `{{admin_token}}`

**Langkah 3: Test Security**
- `[REQ-B-1.2] Login - Invalid Credentials` ❌ Test login gagal
- `[REQ-B-1.3] Reset Password` ✅ Test reset password
- `[REQ-B-1.4] Get User Profile (Protected)` ✅ Test protected endpoint

#### 2. **[REQ-B-2] Testing Manajemen Profil & Verifikasi**

**Login sebagai Provider:**
- Set Authorization: `Bearer {{provider_token}}`

**Test Upload & Profile:**
- `[REQ-B-2.1] Update Provider Profile` ✅ Update profil provider
- `[REQ-B-2.2] Upload Image File` ✅ Upload gambar (gunakan file jpg/png)
- `[REQ-B-2.2] Upload Document File` ✅ Upload dokumen (gunakan file pdf)
- `[REQ-B-2.1] Add Provider Document - KTP` ✅ Tambah dokumen KTP
- `[REQ-B-2.1] Add Provider Document - Sertifikat` ✅ Tambah sertifikat
- `[REQ-B-2.1] Get Provider Documents` ✅ Lihat dokumen sendiri

**Login sebagai Admin:**
- Set Authorization: `Bearer {{admin_token}}`

**Test Verifikasi:**
- `[REQ-B-2.3] Admin - Get Pending Verifications` ✅ Lihat provider pending
- `[REQ-B-2.3] Admin - Verify Provider` ✅ Verifikasi provider (set `{{provider_id}}`)
- `[REQ-B-2.3] Admin - Reject Provider` ❌ Tolak verifikasi provider

#### 3. **[REQ-B-3] Testing Layanan & Portfolio**

**Login sebagai Provider:**
- Set Authorization: `Bearer {{provider_token}}`

**Test Services:**
- `[REQ-B-3.1] Create Provider Service` ✅ Buat layanan baru
- `[REQ-B-3.1] Get Provider Services` ✅ Lihat layanan sendiri
- `[REQ-B-3.1] Update Provider Service` ✅ Update layanan (set `{{service_id}}`)
- `[REQ-B-3.1] Get Single Service` ✅ Lihat detail layanan

**Test Portfolio:**
- `[REQ-B-3.1] Create Portfolio` ✅ Buat portfolio baru
- `[REQ-B-3.1] Get Provider Portfolio` ✅ Lihat portfolio sendiri

**Login sebagai Customer:**
- Set Authorization: `Bearer {{customer_token}}`

**Test Customer Access:**
- `[REQ-B-3.1] Get Single Service` ✅ Customer lihat layanan
- `[REQ-B-3.1] Get Portfolio by Provider ID` ✅ Customer lihat portfolio

**Test Delete (Optional):**
- `[REQ-B-3.1] Delete Provider Service` ✅ Hapus layanan

#### 4. **[REQ-B-4] Testing Service Discovery**

**No Authentication Required:**

**Test Search & Discovery:**
- `[REQ-B-4.1] Search Services - Basic` ✅ Search dasar dengan pagination
- `[REQ-B-4.1] Search Services - With Filters` ✅ Search dengan filter
- `[REQ-B-4.1] Search Services - By Location` ✅ Search berdasarkan lokasi
- `[REQ-B-4.1] Search Services - By Keyword` ✅ Search dengan kata kunci

### 🧪 **Testing Results:**

#### **Login API Tests:**
```bash
# ✅ Customer Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "customer@example.com", "password": "customer123"}'

# ✅ Provider Login  
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "provider@example.com", "password": "provider123"}'

# ✅ Admin Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@ekerjakarawang.com", "password": "admin123"}'
```

#### **Bearer Token Validation Tests:**
```bash
# ✅ Protected Endpoint with Valid Token
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer <valid_token>"
# Response: 200 OK with user data

# ✅ Protected Endpoint without Token  
curl -X GET http://localhost:3001/api/providers/services
# Response: 401 "Authorization token required"

# ✅ Role-based Access Control
curl -X GET http://localhost:3001/api/providers/services \
  -H "Authorization: Bearer <customer_token>"
# Response: 403 "Access denied. Required roles: provider"
```

---

## 🔐 Bearer Token & Role Mapping

### **Available Roles:**
1. **Customer** → `{{customer_token}}` 
2. **Provider** → `{{provider_token}}`
3. **Admin** → `{{admin_token}}`

### **[REQ-B-2] API Manajemen Profil dan Verifikasi**

#### **[REQ-B-2.1] Provider Profile Management**

**✅ GET/PUT `/api/providers/profile`**
- **Bearer Token:** `{{provider_token}}` 🛠️
- **Role Required:** `provider`
- **Access Control:** 
  - ✅ Provider dapat mengakses profil sendiri
  - ❌ Customer tidak dapat mengakses (`403 Access denied`)
  - ❌ Admin tidak dapat mengakses (`403 Access denied`)

**✅ GET/POST `/api/providers/documents`**
- **Bearer Token:** `{{provider_token}}` 🛠️  
- **Role Required:** `provider`
- **Access Control:**
  - ✅ Provider dapat CRUD dokumen sendiri
  - ❌ Customer/Admin tidak dapat mengakses

#### **[REQ-B-2.2] File Upload**

**✅ POST `/api/upload`**
- **Bearer Token:** `{{provider_token}}` atau `{{customer_token}}` atau `{{admin_token}}` 🔄
- **Role Required:** `any authenticated user`
- **Access Control:**
  - ✅ Semua role dapat upload file
  - ❌ Anonymous user tidak dapat upload (`401 Authentication required`)

#### **[REQ-B-2.3] Admin Verification**

**✅ GET/PUT `/api/admin/providers/[id]/verification`**
- **Bearer Token:** `{{admin_token}}` 👑
- **Role Required:** `admin` (sesuai [C-2])
- **Access Control:**
  - ✅ Admin dapat verifikasi provider
  - ❌ Provider tidak dapat verifikasi diri sendiri (`403 Access denied`)
  - ❌ Customer tidak dapat verifikasi (`403 Access denied`)

### **[REQ-B-3] API Manajemen Layanan dan Portofolio**

#### **[REQ-B-3.1] CRUD Layanan Provider**

**✅ GET/POST `/api/providers/services`**
- **Bearer Token:** `{{provider_token}}` 🛠️
- **Role Required:** `provider`
- **Access Control:**
  - ✅ Provider dapat CRUD layanan sendiri
  - ❌ Customer/Admin tidak dapat mengakses

**✅ PUT/DELETE `/api/providers/services/[id]`**
- **Bearer Token:** `{{provider_token}}` 🛠️
- **Role Required:** `provider`
- **Ownership Check:** Provider hanya dapat edit/delete layanan milik sendiri

**✅ GET/POST `/api/providers/portfolio`**
- **Bearer Token:** `{{provider_token}}` 🛠️
- **Role Required:** `provider`
- **Access Control:**
  - ✅ Provider dapat CRUD portfolio sendiri
  - ❌ Customer/Admin tidak dapat mengakses

#### **Customer Access untuk View Services**

**✅ GET `/api/services/[id]` (View Service Detail)**
- **Bearer Token:** `{{customer_token}}` atau `{{provider_token}}` 👤🛠️
- **Role Required:** `customer` atau `provider`
- **Access Control:**
  - ✅ Customer dapat lihat detail layanan
  - ✅ Provider dapat lihat layanan lain
  - ❌ Anonymous tidak dapat akses

**✅ GET `/api/providers/[id]/portfolio` (View Portfolio)**
- **Bearer Token:** `{{customer_token}}` atau `{{provider_token}}` 👤🛠️
- **Role Required:** `customer` atau `provider`
- **Access Control:**
  - ✅ Customer dapat lihat portfolio provider
  - ✅ Provider dapat lihat portfolio provider lain

### **[REQ-B-4] API Service Discovery**

#### **[REQ-B-4.1] Service Discovery & Search**

**✅ GET `/api/services/search`**
- **Bearer Token:** ❌ **NO AUTH REQUIRED** 🌐
- **Role Required:** `public endpoint`
- **Access Control:**
  - ✅ Anonymous users dapat search services
  - ✅ Semua roles dapat search services
  - ✅ Public access untuk service discovery

---

## 📋 Testing Credentials

### Default Seeded Users untuk Testing:

#### 🔧 **Admin:**
- **Email:** `admin@ekerjakarawang.com`
- **Password:** `admin123`
- **Role:** admin

#### 👤 **Customer:**
- **Email:** `customer@example.com`
- **Password:** `customer123`
- **Role:** customer

#### 🛠️ **Provider:**
- **Email:** `provider@example.com`
- **Password:** `provider123`
- **Role:** provider
- **Status:** VERIFIED (sudah diverifikasi)

### 📡 Login Response Format:
```json
{
  "success": true,
  "data": {
    "user": { /* user data */ },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": "2h"
  },
  "message": "Login successful"
}
```

### 🔐 Usage di Postman:
1. **Login** dengan credentials di atas
2. **Copy token** dari response `data.token`
3. **Set Authorization** di requests lain:
   - Type: `Bearer Token`
   - Token: `paste token here`

### 🕐 Token Expiry:
- **Duration:** 2 jam sesuai [C-19]
- **Auto-refresh:** Perlu login ulang setelah expired

---

## 📦 Postman Collection & Environment

### 📋 **Files yang Telah Diupdate:**

#### 1. **`postman-collection.json`** ✅ UPDATED
- ✅ **Auto-extract Bearer token** dari login responses
- ✅ **Kredensial seeded users** yang benar
- ✅ **Global debugging scripts** untuk Bearer token
- ✅ **Enhanced descriptions** dengan status indicators

#### 2. **`postman-environment.json`** ✅ UPDATED  
- ✅ **Port 3001** sesuai development server
- ✅ **Bearer token variables** dengan descriptions
- ✅ **Auto-extraction ready** untuk login responses
- ✅ **Default category ID** untuk testing

### **Login Endpoints dengan Auto-Token Extraction:**
```javascript
// Auto-extract Bearer token dari login response
if (pm.response.code === 200) {
    const response = pm.response.json();
    if (response.success && response.data.token) {
        pm.environment.set('customer_token', response.data.token);
        pm.environment.set('customer_id', response.data.user.id);
        console.log('Bearer token saved:', response.data.token.substring(0, 20) + '...');
    }
}
```

### **Global Pre-request Script:**
- ✅ **Bearer token debugging** dengan JWT payload decode
- ✅ **Request logging** untuk troubleshooting
- ✅ **Token expiry information** dalam console

### **Global Test Script:**
- ✅ **Response structure validation** untuk success/error
- ✅ **Bearer token detection** dalam responses
- ✅ **Performance monitoring** dengan response time

### 🚀 **Testing Flow dengan Collection:**

#### **Step 1: Import Files ke Postman**
```bash
1. Import postman-collection.json
2. Import postman-environment.json  
3. Set environment ke "E-Kerja Development Environment - Bearer Token Ready"
```

#### **Step 2: Login untuk Mendapatkan Bearer Tokens**
```bash
# Jalankan dalam urutan:
1. [REQ-B-1.2] Login Customer - Get Bearer Token
   → Auto-save ke {{customer_token}}
2. [REQ-B-1.2] Login Provider - Get Bearer Token  
   → Auto-save ke {{provider_token}}
3. [REQ-B-1.2] Login Admin - Get Bearer Token
   → Auto-save ke {{admin_token}}
```

#### **Step 3: Test Protected Endpoints**
```bash
# Bearer tokens sudah tersimpan otomatis, test:
1. [REQ-B-1.4] Get User Profile - Bearer Token Protected
2. Provider Services endpoints dengan {{provider_token}}
3. Admin endpoints dengan {{admin_token}}
```

---

## 🔧 Troubleshooting Guide

### 🎯 **Token Valid tapi Error di Postman - ROOT CAUSES:**

#### **Token Verification (Sudah Dicek):**
- ✅ Token belum expired (valid sampai 05:24:37)
- ✅ Payload benar: userId=3, role=provider
- ✅ Endpoint bekerja di curl

### 🔍 **Checklist Troubleshooting Postman:**

#### **1. ✅ Base URL Check**
**Pastikan base_url di environment:**
```
{{base_url}} = http://localhost:3001
```
**BUKAN** `http://localhost:3000` (server berjalan di port 3001)

#### **2. ✅ Authorization Header Format**
**Di Postman, pastikan:**
- Type: `Bearer Token`
- Token: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIzIiwiZW1haWwiOiJwcm92aWRlckBleGFtcGxlLmNvbSIsInJvbGVJZCI6IjIiLCJyb2xlTmFtZSI6InByb3ZpZGVyIiwiaXNBY3RpdmUiOnRydWUsImlhdCI6MTc1MzE1NDY3NywiZXhwIjoxNzUzMTYxODc3LCJhdWQiOiJlLWtlcmphLWFwcCIsImlzcyI6ImUta2VyamEtYXBpIn0.4_0tBhUj0mMQ3UCqi5-wCT2nsAW_82dbloVSAksnxdg`

**Atau di Headers tab:**
```
Key: Authorization
Value: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIzIiwiZW1haWwiOiJwcm92aWRlckBleGFtcGxlLmNvbSIsInJvbGVJZCI6IjIiLCJyb2xlTmFtZSI6InByb3ZpZGVyIiwiaXNBY3RpdmUiOnRydWUsImlhdCI6MTc1MzE1NDY3NywiZXhwIjoxNzUzMTYxODc3LCJhdWQiOiJlLWtlcmphLWFwcCIsImlzcyI6ImUta2VyamEtYXBpIn0.4_0tBhUj0mMQ3UCqi5-wCT2nsAW_82dbloVSAksnxdg
```

#### **3. ✅ Request URL Check**
**Pastikan URL request:**
```
PUT {{base_url}}/api/providers/profile
```
**Resolves ke:**
```
PUT http://localhost:3001/api/providers/profile
```

#### **4. ✅ Content-Type Header**
**Pastikan header:**
```
Content-Type: application/json
```

#### **5. ✅ Environment Variables**
**Check di Postman Environment:**
- `base_url`: `http://localhost:3001` ✅
- `provider_token`: (token dari login response) ✅

### 🚀 **Quick Fix Steps:**

#### **Step 1: Update Environment**
1. Buka Environment di Postman
2. Set `base_url` ke `http://localhost:3001`
3. Save environment

#### **Step 2: Fresh Login untuk Token Baru**
```bash
Request: [REQ-B-1.2] Login Provider - Get Bearer Token
Body: {
  "email": "provider@example.com",
  "password": "provider123"
}
```

#### **Step 3: Copy Fresh Token**
Dari response login, copy `data.token` ke:
- `{{provider_token}}` di environment, ATAU
- Langsung paste di Authorization header

#### **Step 4: Test dengan Fresh Token**
```bash
Request: [REQ-B-2.1] Update Provider Profile
Authorization: Bearer {{provider_token}}
URL: {{base_url}}/api/providers/profile
Body: {
  "fullName": "Siti Nurhaliza Provider Updated",
  "phoneNumber": "081234567899",
  "address": "Jl. Provider Baru No. 123, Karawang",
  "providerBio": "Teknisi AC berpengalaman 15 tahun dengan sertifikat BNSP."
}
```

### 🐛 **Common Postman Issues:**

#### **Issue 1: Wrong Port**
- Environment: `http://localhost:3000` ❌
- Fix: `http://localhost:3001` ✅

#### **Issue 2: Token Copy Error**
- Extra spaces di awal/akhir token
- Token ter-truncate saat copy
- Fix: Copy ulang token dari response JSON

#### **Issue 3: Wrong Endpoint**
- Using: `/api/profile` (generic endpoint) ❌
- Should use: `/api/providers/profile` (provider-specific) ✅

---

## ✅ Requirements Completion Summary

### **[REQ-B-1.2] API Login** - ✅ IMPLEMENTED ✅
- ✅ Bearer token dikembalikan
- ✅ User data termasuk role
- ✅ Token expiry 2 jam [C-19]
- ✅ Password validation [C-15]

### **[REQ-B-1.4] Session Management** - ✅ IMPLEMENTED ✅
- ✅ JWT validation middleware
- ✅ Protected endpoints require Bearer token
- ✅ Role-based access control
- ✅ Token expiry enforcement

### **[REQ-B-2] Profile & Verification** - ✅ IMPLEMENTED ✅
- ✅ Provider profile management with Bearer auth
- ✅ Document upload with Bearer auth
- ✅ Admin verification endpoints with Bearer auth

### **[REQ-B-3] Services & Portfolio** - ✅ IMPLEMENTED ✅
- ✅ Provider service CRUD with Bearer auth
- ✅ Portfolio management with Bearer auth
- ✅ Customer access to view services

### **[REQ-B-4] Service Discovery** - ✅ IMPLEMENTED ✅
- ✅ Public search endpoints (no auth required)
- ✅ Filter and pagination support

**🚀 All Bearer Token Requirements Successfully Implemented! 🚀**
