# DEBUG: Review Report Submission Error

## Masalah
User mengalami error "Gagal mengirim laporan: Unknown error" ketika submit laporan review.

## Debugging Steps Yang Telah Dilakukan

### 1. Enhanced Error Logging ✅
- Added detailed console logging di `submitReport()` function
- Added response status, headers, dan body logging
- Added request data validation

### 2. Created Debug API Endpoint ✅
- Created `/api/review-reports-debug/route.ts` untuk testing
- Simple endpoint yang hanya log data dan return success
- Temporarily switched frontend to use debug endpoint

### 3. Enhanced Modal UI ✅
- Added debug info showing Review ID di modal
- Added validation untuk reviewId sebelum submit
- Improved error handling dan user feedback

## Testing Instructions

### Step 1: Test dengan Debug Endpoint
1. Buka http://localhost:3000/provider/profile
2. Login sebagai provider
3. Klik tombol "Laporkan" pada ulasan
4. Perhatikan Review ID di modal (should not be undefined)
5. Isi reason dan submit
6. Check browser console untuk detailed logs

### Step 2: Monitor Backend Logs
Ketika submit report, perhatikan terminal output untuk:
```
=== DEBUG: review-reports endpoint called ===
Headers: { authorization: 'Bearer [token]', contentType: 'application/json' }
Request body: { reviewId: X, reason: 'test reason' }
=== DEBUG: Would submit report for review X with reason: test reason ===
```

### Expected Error Sources

#### A. Frontend Issues:
- `selectedReview.id` undefined atau null
- `reportReason` empty setelah trim
- Invalid JSON serialization

#### B. Authentication Issues:
- Missing atau invalid JWT token
- Token expired
- Wrong user role

#### C. API Issues:
- Endpoint tidak ada atau salah route
- Prisma connection error
- Database constraint violation

## Current Status

### Files Modified:
- ✅ `/src/app/provider/profile/page.tsx` - Enhanced error handling
- ✅ `/src/app/api/review-reports-debug/route.ts` - Debug endpoint

### Next Steps:
1. Test dengan debug endpoint untuk isolate issue
2. Jika debug endpoint work, investigate original endpoint
3. Check database connection dan Prisma setup
4. Verify JWT authentication working

### Rollback Plan:
Jika debugging selesai, kembalikan ke original endpoint:
```typescript
const response = await authenticatedFetch('/api/review-reports', {
```

Dan hapus debug endpoint dan temporary UI elements.