# 📋 **E-Kerja API Testing dengan Postman**

Collection ini berisi comprehensive testing untuk semua requirement backend API E-Kerja, termasuk implementation terbaru REQ-B-5, REQ-B-6, dan REQ-B-7.

## 🚀 **Quick Start**

### 1. **Import Files**
1. Import `postman-collection.json` ke Postman
2. Import `postman-environment.json` sebagai environment
3. Set environment ke "E-Kerja Development Environment - Complete API Testing"

### 2. **Setup Server**
```bash
# Pastikan server berjalan di port 3000
npm run dev
```

### 3. **Testing Flow**
Jalankan collection dalam urutan ini untuk testing lengkap:

## 📁 **Collection Structure**

### **[REQ-B-1] API Pengguna dan Autentikasi**
- ✅ Register Customer/Provider/Admin
- ✅ Login & Bearer Token extraction (otomatis)
- ✅ Reset Password
- ✅ Protected endpoint testing

### **[REQ-B-2] API Manajemen Profil dan Verifikasi**
- ✅ Update provider profile
- ✅ Upload files (image/document)
- ✅ Provider documents management
- ✅ Admin verification workflow

### **[REQ-B-3] API Manajemen Layanan dan Portofolio**
- ✅ CRUD provider services
- ✅ Portfolio management
- ✅ Service discovery

### **[REQ-B-4] API Penemuan dan Detail Layanan**
- ✅ Search services dengan filters
- ✅ Location-based search
- ✅ Rating calculation
- ✅ Provider details

### **[REQ-B-5] API Proses Pemesanan** ⭐ **NEW**
- ✅ Create orders oleh customer
- ✅ Provider accept/reject dengan reason
- ✅ Order status management
- ✅ Order history dengan pagination

### **[REQ-B-6] API Rincian Pesanan dan Biaya** ⭐ **NEW**
- ✅ Add order details oleh provider
- ✅ Customer approve/reject workflow
- ✅ Cost calculation & summary
- ✅ Delete rejected items

### **[REQ-B-7] API Ulasan dan Pelaporan** ⭐ **NEW**
- ✅ Review creation (C-9 compliance)
- ✅ Review reporting system
- ✅ Admin moderation workflow
- ✅ Review visibility control

## 🔑 **Authentication Flow**

Collection ini menggunakan **Bearer Token** authentication dengan auto-extraction:

1. **Login Customer**: Otomatis save `customer_token`
2. **Login Provider**: Otomatis save `provider_token` (Fanza)
3. **Login Admin**: Otomatis save `admin_token`
4. **Login Other Provider**: Otomatis save `other_provider_token` (Budi)

## 🔧 **Perbaikan Terbaru**

### **Field Names yang Benar:**
- **Order Rejection**: Gunakan field `information` (bukan `rejectionReason`)
- **Order Status**: Gunakan `REJECTED_BY_PROVIDER` (bukan `REJECTED`)

### **Contoh Request yang Benar:**
```json
// Provider Reject Order
{
  "status": "REJECTED_BY_PROVIDER",
  "information": "Sorry, I'm fully booked this week. Please reschedule for next week."
}
```

## 🎯 **Testing Scenarios**

### **Scenario 1: Complete Order Workflow**
```
1. Login Customer → Login Provider
2. Create Order → Provider Accept
3. Add Order Details → Customer Approve/Reject
4. Complete Order → Customer Create Review
```

### **Scenario 2: Review Reporting**
```
1. Login Other Provider (Budi)
2. Report Review → Login Admin
3. Admin Resolve Report
```

### **Scenario 3: Business Logic Validation**
```
1. Try create review untuk non-completed order (should fail)
2. Try report own review (should fail)
3. Try add details ke completed order (should fail)
```

## ⚙️ **Environment Variables**

| Variable | Description | Auto-populated |
|----------|-------------|----------------|
| `base_url` | API base URL | Manual |
| `customer_token` | Customer Bearer token | ✅ Auto |
| `provider_token` | Provider Bearer token | ✅ Auto |
| `admin_token` | Admin Bearer token | ✅ Auto |
| `other_provider_token` | Other provider token | ✅ Auto |
| `order_id` | Created order ID | ✅ Auto |
| `review_id` | Created review ID | ✅ Auto |
| `review_report_id` | Created report ID | ✅ Auto |

## 🔍 **C-9 Compliance Testing**

Collection ini secara khusus test **C-9 requirement**:
> "Customer hanya dapat memberikan ulasan untuk pesanan yang telah selesai (status COMPLETED)"

Test cases:
- ✅ Review creation pada completed order (success)
- ❌ Review creation pada non-completed order (failure)
- ✅ Rating validation (1-5)
- ✅ Duplicate review prevention

## 🛡️ **Security Testing**

Semua endpoints ditest untuk:
- ✅ Bearer token validation
- ✅ Role-based access control
- ✅ Cross-user data access prevention
- ✅ Business logic enforcement

## 📊 **Test Results Validation**

Setiap request memiliki built-in tests untuk:
- Response time < 5000ms
- Correct response structure
- Success/error status validation
- Token extraction automation

## 🚀 **Production Ready Features**

Collection ini test semua production-ready features:
- ✅ Comprehensive error handling
- ✅ Proper HTTP status codes
- ✅ Pagination support
- ✅ Data integrity validation
- ✅ Audit trail tracking

---

## 📞 **Support**

Jika ada issues dengan testing:
1. Pastikan server running di port 3000
2. Check environment variables
3. Run authentication flows dulu
4. Check console untuk debug info

**Happy Testing! 🎉**
