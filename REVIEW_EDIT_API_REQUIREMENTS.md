# API Requirements for Review Edit Feature

## Overview
Fitur edit review memungkinkan customer untuk mengubah ulasan yang sudah diberikan pada pesanan yang telah selesai.

## Required API Endpoints

### 1. Get Customer Review by Order ID
**Endpoint:** `GET /api/reviews/order/{orderId}`
**Purpose:** Mengambil review customer untuk pesanan tertentu

**Request:**
```
GET /api/reviews/order/123
Authorization: Bearer {token}
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "id": 456,
    "orderId": 123,
    "customerId": 789,
    "providerId": 101,
    "rating": 5,
    "comment": "Service sangat memuaskan!",
    "is_show": true,
    "createdAt": "2025-09-26T10:00:00Z",
    "updatedAt": "2025-09-26T10:00:00Z"
  }
}
```

**Response No Review Found (404):**
```json
{
  "success": false,
  "error": "Review not found"
}
```

### 2. Get Single Review by ID
**Endpoint:** `GET /api/reviews/{reviewId}`
**Purpose:** Mengambil detail review tertentu

**Request:**
```
GET /api/reviews/456
Authorization: Bearer {token}
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "id": 456,
    "orderId": 123,
    "customerId": 789,
    "providerId": 101,
    "rating": 5,
    "comment": "Service sangat memuaskan!",
    "is_show": true,
    "createdAt": "2025-09-26T10:00:00Z",
    "updatedAt": "2025-09-26T10:00:00Z"
  }
}
```

### 3. Update Existing Review
**Endpoint:** `PUT /api/reviews/{reviewId}`
**Purpose:** Memperbarui review yang sudah ada

**Request:**
```
PUT /api/reviews/456
Authorization: Bearer {token}
Content-Type: application/json

{
  "rating": 4,
  "comment": "Service cukup baik, ada yang perlu diperbaiki."
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Review updated successfully",
  "data": {
    "id": 456,
    "orderId": 123,
    "customerId": 789,
    "providerId": 101,
    "rating": 4,
    "comment": "Service cukup baik, ada yang perlu diperbaiki.",
    "is_show": false,
    "createdAt": "2025-09-26T10:00:00Z",
    "updatedAt": "2025-09-26T12:00:00Z"
  }
}
```

**Response Error (400):**
```json
{
  "success": false,
  "error": "Invalid input data"
}
```

**Response Unauthorized (403):**
```json
{
  "success": false,
  "error": "You can only edit your own reviews"
}
```

## Frontend Implementation Features

### 1. Order Detail Page Updates (`/orders/[id]`)
✅ **Implemented:**
- Added `customerReview` state to store existing review
- Added `fetchCustomerReview()` function to check if review exists
- Updated button logic:
  - Shows "Beri Ulasan" if no review exists
  - Shows "Edit Ulasan" if review exists
- Button redirects to:
  - `/reviews/new?orderId={id}` for new review
  - `/reviews/new?orderId={id}&reviewId={reviewId}` for edit mode

### 2. Review Form Page Updates (`/reviews/new`)
✅ **Implemented:**
- Added `reviewId` parameter detection from URL
- Added `isEditMode` boolean flag
- Added `existingReview` state for pre-filling form
- Added `fetchExistingReview()` function
- Updated UI elements:
  - Title changes to "Edit Ulasan" in edit mode
  - Button text changes to "Perbarui Ulasan" in edit mode
  - Shows current review info in blue box for edit mode
  - Different success/loading messages
- Updated `handleSubmit()` logic:
  - Uses PUT method for edit mode
  - Uses POST method for new review
  - Different API endpoints based on mode
  - Different request body structure

### 3. User Experience Features
✅ **Implemented:**
- Pre-filled form with existing review data (rating & comment)
- Visual indicator showing current review status (Published/Under Review)
- Contextual messaging for edit vs create mode
- Proper loading states during API calls
- Error handling for both create and edit scenarios

## Business Logic

### Review Status After Edit
When a customer edits their review:
1. The `is_show` field should be set to `false` (requires admin re-approval)
2. Updated review goes through moderation process again
3. Customer sees "Dalam Review" status until admin approves

### Security Considerations
1. ✅ Only review owner can edit their review
2. ✅ Only COMPLETED orders can have reviews
3. ✅ Authentication required for all operations
4. ✅ Input validation for rating (1-5) and comment (max length)

## Testing Checklist

### Create New Review Flow
- [ ] Order status COMPLETED → "Beri Ulasan" button appears
- [ ] Click button → redirects to `/reviews/new?orderId={id}`
- [ ] Fill form → submit successfully
- [ ] After submit → button changes to "Edit Ulasan"

### Edit Existing Review Flow  
- [ ] Existing review → "Edit Ulasan" button appears
- [ ] Click button → redirects to `/reviews/new?orderId={id}&reviewId={reviewId}`
- [ ] Form pre-filled with existing data
- [ ] Shows current review info box
- [ ] Edit and submit → updates successfully
- [ ] Status changes to "Dalam Review" if was previously published

### API Integration Testing
- [ ] GET `/api/reviews/order/{orderId}` returns correct review
- [ ] GET `/api/reviews/{reviewId}` returns review details
- [ ] PUT `/api/reviews/{reviewId}` updates review successfully
- [ ] Proper error handling for all API calls

---

**Status:** ✅ Frontend implementation completed, ready for API integration testing