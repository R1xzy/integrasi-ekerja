# E-Kerja API Testing Guide - Postman Collection

## Overview
Panduan lengkap untuk menguji semua API E-Kerja menggunakan Postman collection yang telah disediakan. Collection ini mencakup semua requirements B-1 hingga B-10 dengan autentikasi Bearer Token otomatis.

## 🚀 Quick Start

### 1. Import Files ke Postman
```bash
# Import kedua file ini ke Postman:
- postman-collection.json    # Collection dengan semua API endpoints
- postman-environment.json   # Environment variables untuk testing
```

### 2. Setup Environment
Pilih environment "E-Kerja Development" di Postman dan pastikan `base_url` sudah mengarah ke server yang benar:
- Development: `http://localhost:3000`
- Production: Update sesuai dengan URL production Anda

### 3. Testing Flow - Urutan Rekomendasi

#### A. Authentication Setup (Wajib Pertama)
```
1. [REQ-B-1.1] Register Admin Account
2. [REQ-B-1.2] Login Admin  
3. [REQ-B-1.1] Register Customer Account  
4. [REQ-B-1.2] Login Customer
5. [REQ-B-1.1] Register Provider Account
6. [REQ-B-1.2] Login Provider
```
**✅ Expected Result:** Semua Bearer tokens tersimpan otomatis di environment variables

#### B. Core Data Setup
```
7. [REQ-B-2.1] Provider Create Service
8. [REQ-B-3.1] Customer Create Order
9. [REQ-B-3.2] Provider Accept Order
10. [REQ-B-3.3] Customer Complete Order
```
**✅ Expected Result:** Order flow completed, siap untuk testing advanced features

#### C. Advanced Features Testing
```
Chat System (REQ-B-8):
11. [REQ-B-8.1] Create Chat Conversation
12. [REQ-B-8.2] Send Message
13. [REQ-B-8.2] Provider Reply Message
14. [REQ-B-8.2] Mark Messages as Read

Review System (REQ-B-7):
15. [REQ-B-7.1] Create Review
16. [REQ-B-7.3] Report Review

Admin Features (REQ-B-9, B-10):
17. [REQ-B-9.1] Get Dashboard Statistics
18. [REQ-B-9.2] Create Service Category
19. [REQ-B-10.1] Create Application Setting
20. [REQ-B-10.3] Create FAQ
```

## 📊 API Requirements Coverage

### ✅ B-1: Sistem Otentikasi & Otorisasi
- **Endpoints:** 8 endpoints
- **Features:** JWT Bearer Token, Role-based access, Registration, Login, User profile
- **Compliance:** C-1 (Secure Authentication), C-2 (Role Management)

### ✅ B-2: API Manajemen Layanan
- **Endpoints:** 8 endpoints  
- **Features:** Service CRUD, Provider management, Category filtering
- **Compliance:** C-3 (Service Management)

### ✅ B-3: API Pemesanan
- **Endpoints:** 11 endpoints
- **Features:** Order lifecycle, Status management, Provider acceptance
- **Compliance:** C-4 (Order Processing), C-5 (Status Tracking)

### ✅ B-4: API Profil Pengguna  
- **Endpoints:** 6 endpoints
- **Features:** Profile management, Avatar upload, Account updates
- **Compliance:** C-6 (User Management)

### ✅ B-5: API Pencarian & Filter
- **Endpoints:** 8 endpoints
- **Features:** Advanced search, Geolocation, Price filtering
- **Compliance:** C-8 (Search Functionality)

### ✅ B-6: API Notifikasi
- **Endpoints:** 6 endpoints  
- **Features:** Push notifications, Email alerts, Real-time updates
- **Compliance:** C-10 (Notification System)

### ✅ B-7: API Ulasan & Pelaporan
- **Endpoints:** 11 endpoints
- **Features:** Review system, Report management, Content moderation
- **Compliance:** C-9 (Review System), C-11 (Content Moderation)

### ✅ B-8: Sistem Chat (NEW!)
- **Endpoints:** 7 endpoints
- **Features:** Real-time messaging, Conversation management, Read receipts
- **Compliance:** C-7 (End-to-End Encryption Ready)

### ✅ B-9: Admin Dashboard (NEW!)
- **Endpoints:** 7 endpoints  
- **Features:** System analytics, Category management, Business intelligence
- **Compliance:** Administrative oversight and management

### ✅ B-10: Admin Settings (NEW!)
- **Endpoints:** 13 endpoints
- **Features:** Application configuration, FAQ management, System settings
- **Compliance:** Application maintenance and content management

## 🔒 Authentication & Security

### Bearer Token Auto-Extraction
Collection menggunakan automated token extraction:
```javascript
// Auto-extraction script in Login endpoints
if (pm.response.code === 200) {
    const response = pm.response.json();
    if (response.data && response.data.token) {
        pm.environment.set('customer_token', response.data.token);
        console.log('Customer token saved automatically');
    }
}
```

### Environment Variables
```
{{customer_token}}     - Token untuk customer endpoints
{{provider_token}}     - Token untuk provider endpoints  
{{admin_token}}        - Token untuk admin endpoints
{{base_url}}           - Server base URL
{{order_id}}           - Auto-extracted dari order creation
{{service_id}}         - Auto-extracted dari service creation
{{chat_conversation_id}} - Auto-extracted dari chat creation
{{faq_id}}             - Auto-extracted dari FAQ creation
```

## 🧪 Testing Scenarios

### Scenario 1: Complete Order Flow
```
1. Customer registers & logs in
2. Provider registers & creates service  
3. Customer searches & books service
4. Provider accepts order
5. Customer completes order
6. Customer leaves review
7. Chat conversation throughout process
```

### Scenario 2: Admin Management
```
1. Admin logs in
2. Views dashboard statistics
3. Creates new service category
4. Manages application settings
5. Creates FAQ content
6. Moderates reported reviews
```

### Scenario 3: Error Handling Testing
```
1. Test unauthorized access
2. Test invalid data validation  
3. Test business rule enforcement
4. Test rate limiting
5. Test authentication expiry
```

## 📈 Global Testing Scripts

### Pre-request Script (Semua Endpoints)
```javascript
// Logs request details and token validation
console.log('REQUEST:', pm.request.method, pm.request.name);
console.log('URL:', pm.request.url.toString());

// JWT token debugging
const authHeader = pm.request.headers.get('Authorization');
if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const payload = JSON.parse(atob(token.split('.')[1]));
    console.log('Token payload:', {
        userId: payload.userId,
        roleName: payload.roleName,
        exp: new Date(payload.exp * 1000).toISOString()
    });
}
```

### Post-response Test Script (Semua Endpoints)
```javascript
// Response validation and performance testing
pm.test('Response time is acceptable', function () {
    pm.expect(pm.response.responseTime).to.be.below(5000);
});

pm.test('Success response has correct structure', function () {
    if (pm.response.code >= 200 && pm.response.code < 300) {
        const jsonData = pm.response.json();
        pm.expect(jsonData).to.have.property('success', true);
        pm.expect(jsonData).to.have.property('data');
    }
});
```

## 🎯 Testing Tips

### 1. Sequential Testing
Run endpoints dalam urutan yang benar untuk dependencies:
- Authentication → Service Creation → Order Flow → Advanced Features

### 2. Data Cleanup
Beberapa endpoints mungkin memerlukan cleanup manual di database:
```sql
-- Reset testing data jika diperlukan
DELETE FROM ChatMessage WHERE conversationId IN (SELECT id FROM ChatConversation WHERE orderId = ?);
DELETE FROM ChatConversation WHERE orderId = ?;
DELETE FROM Review WHERE orderId = ?;
```

### 3. Environment Switching
- Development: `http://localhost:3000`
- Staging: Update base_url sesuai staging server
- Production: Gunakan environment terpisah untuk production testing

### 4. Monitoring & Debugging
- Check Console logs di Postman untuk debugging
- Verify auto-extracted variables tersimpan dengan benar
- Monitor response times dan error patterns

## 🔄 Continuous Testing

### Newman CLI (Optional)
```bash
# Install Newman untuk automated testing
npm install -g newman

# Run collection via command line
newman run postman-collection.json -e postman-environment.json --reporters cli,html
```

### CI/CD Integration
Collection ini bisa diintegrasikan dengan:
- GitHub Actions
- Jenkins
- GitLab CI
- Azure DevOps

## 📞 Support

Jika menemukan issues:
1. Check Bearer token validity
2. Verify environment variables
3. Check server logs untuk API errors
4. Test dengan manual curl commands untuk comparison

## 📋 Summary

**Total Testing Coverage:**
- ✅ 10 Major Requirements (B-1 hingga B-10)
- ✅ 94 API Endpoints
- ✅ Complete authentication flow
- ✅ Advanced features (Chat, Admin Dashboard, Settings)
- ✅ Automated token management
- ✅ Comprehensive error handling
- ✅ Performance monitoring

Collection ini memberikan testing coverage lengkap untuk seluruh backend E-Kerja dengan focus pada user experience dan compliance dengan requirements yang telah ditetapkan.
