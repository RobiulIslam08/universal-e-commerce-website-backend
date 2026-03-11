# Order Tracking System - Complete API Guide

## 📁 নতুন ফাইল গুলো

```
src/app/modules/Order/
├── order.interface.ts     ← TypeScript types & enums
├── order.model.ts         ← MongoDB schema & model
├── order.validation.ts    ← Zod request validation
├── order.service.ts       ← Business logic (সব কাজ এখানে)
├── order.controller.ts    ← HTTP request handlers
└── order.routes.ts        ← Express routes

src/app/utils/
├── courierService.ts      ← Carrier API integration (DHL, FedEx, UPS, etc.)
└── sendEmail.ts           ← Order email templates যোগ করা হয়েছে
```

---

## 🔄 Order Status Flow (Life Cycle)

```
pending → confirmed → processing → shipped → out_for_delivery → delivered
                                                              → returned → refunded
    ↓
cancelled
```

---

## 🌐 API Endpoints

**Base URL:** `/api/v1/orders`

---

### 👤 USER ENDPOINTS

#### 1. Create Order (Checkout এর পরে)

```
POST /api/v1/orders
Authorization: Bearer <token>

Body:
{
  "userId": "64abc...",
  "userEmail": "user@email.com",
  "userName": "John Doe",
  "paymentIntentId": "pi_xxx",       // Stripe payment intent (optional for COD)
  "paymentMethod": "stripe",          // "stripe" | "cod" | "other"
  "paymentStatus": "paid",            // "pending" | "paid" | "failed"
  "items": [
    {
      "productId": "64xyz...",
      "productName": "iPhone 15",
      "quantity": 1,
      "price": 999.99,
      "image": "https://..."
    }
  ],
  "shippingAddress": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "1234567890",
    "address": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "US"
  },
  "subtotal": 999.99,
  "discountAmount": 0,
  "shippingCost": 9.99,
  "taxAmount": 50.00,
  "totalAmount": 1059.98,
  "currency": "usd",
  "customerNotes": "Please leave at door"
}

Response:
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "orderId": "ORD-1764594022323-A7B2",
    "orderStatus": "confirmed",
    ...
  }
}
```

> ⚠️ **Important:** Payment service থেকে automatic order create হয়। তারপরও frontend থেকে সরাসরি call করা যাবে।

---

#### 2. My Orders (User এর সব অর্ডার)

```
GET /api/v1/orders/my/:userId
Authorization: Bearer <token>

Query Parameters (all optional):
?page=1&limit=10
?status=shipped          // pending|confirmed|processing|shipped|out_for_delivery|delivered|cancelled
?startDate=2025-01-01&endDate=2025-12-31
?sortBy=createdAt&sortOrder=desc

Response:
{
  "data": {
    "orders": [...],
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3
  }
}
```

---

#### 3. Single Order Details

```
GET /api/v1/orders/:orderId
Authorization: Bearer <token>

Example: GET /api/v1/orders/ORD-1764594022323-A7B2

Response:
{
  "data": {
    "orderId": "ORD-1764594022323-A7B2",
    "orderStatus": "shipped",
    "carrier": {
      "name": "DHL",
      "trackingNumber": "DHL1234567890",
      "trackingUrl": "https://www.dhl.com/track?id=DHL1234567890",
      "estimatedDelivery": "2025-12-05T00:00:00.000Z"
    },
    "trackingHistory": [
      {
        "status": "confirmed",
        "title": "Order Confirmed",
        "description": "Your payment was successful! Your order has been confirmed.",
        "timestamp": "2025-11-28T10:00:00.000Z",
        "isVisible": true
      },
      {
        "status": "processing",
        "title": "Order Processing",
        "description": "Your order is being packed at our warehouse.",
        "location": "Warehouse, New York",
        "timestamp": "2025-11-29T09:00:00.000Z",
        "isVisible": true
      },
      {
        "status": "shipped",
        "title": "Order Shipped",
        "description": "Your order is on its way! It has been handed over to DHL.",
        "timestamp": "2025-11-30T11:00:00.000Z",
        "isVisible": true
      }
    ],
    "items": [...],
    "shippingAddress": {...},
    "totalAmount": 1059.98
  }
}
```

---

#### 4. Cancel Order (user)

```
PATCH /api/v1/orders/:orderId/cancel
Authorization: Bearer <token>

Body:
{
  "cancellationReason": "Changed my mind"
}

Note: User শুধু "pending" বা "confirmed" status এ cancel করতে পারবে
```

---

#### 5. Get Order by Payment Intent (Payment Success Page)

```
GET /api/v1/orders/by-payment/:paymentIntentId
Authorization: Bearer <token>

Example: GET /api/v1/orders/by-payment/pi_3OmPo5xxx
```

---

#### 6. Sync Tracking from Carrier

```
POST /api/v1/orders/:orderId/sync-tracking
Authorization: Bearer <token>

Carrier API থেকে latest tracking events sync করে
```

---

### 🔑 ADMIN ENDPOINTS

#### 1. All Orders (Filters সহ)

```
GET /api/v1/orders/admin/all
Authorization: Bearer <admin-token>

Query Parameters:
?page=1&limit=20
?status=processing
?paymentStatus=paid
?paymentMethod=stripe
?userId=64abc...
?startDate=2025-11-01&endDate=2025-11-30
?searchTerm=ORD-176...         // orderId, name, email দিয়ে search
?sortBy=createdAt&sortOrder=desc
```

---

#### 2. Order Statistics (Dashboard)

```
GET /api/v1/orders/admin/stats
Authorization: Bearer <admin-token>

Response:
{
  "data": {
    "totalOrders": 1250,
    "totalRevenue": 125000.50,
    "todayOrders": 15,
    "todayRevenue": 1500.00,
    "monthlyOrders": 320,
    "monthlyRevenue": 32000.00,
    "averageOrderValue": 100.00,
    "ordersByStatus": {
      "pending": 50,
      "confirmed": 100,
      "processing": 200,
      "shipped": 300,
      "out_for_delivery": 150,
      "delivered": 400,
      "cancelled": 40,
      "returned": 8,
      "refunded": 2
    }
  }
}
```

---

#### 3. Update Order Status ⭐ (সবচেয়ে Important)

```
PATCH /api/v1/orders/admin/:orderId/status
Authorization: Bearer <admin-token>

Body (minimum):
{
  "orderStatus": "processing"
}

Body (full - shipped এর সময়):
{
  "orderStatus": "shipped",
  "title": "Order Shipped via DHL",              // optional, auto-generate হয়
  "description": "Package collected by DHL.",    // optional
  "location": "Warehouse, New York",             // optional
  "isVisible": true,
  "adminNotes": "Priority shipment",             // user দেখতে পাবে না
  "carrier": {
    "name": "DHL",
    "trackingNumber": "DHL1764594022323",
    "trackingUrl": "https://dhl.com/track?id=DHL1764594022323",
    "estimatedDelivery": "2025-12-05"
  }
}

Features:
✅ tracking history তে automatically নতুন event add হয়
✅ Carrier API তে shipment create হয় (DHL, FedEx, etc.)
✅ Customer কে email notification যায়
✅ Invalid transitions block করা (e.g. delivered → processing না)
```

---

#### 4. Assign Carrier

```
PATCH /api/v1/orders/admin/:orderId/carrier
Authorization: Bearer <admin-token>

Body:
{
  "name": "FedEx",
  "trackingNumber": "FDX987654321",
  "trackingUrl": "https://fedex.com/track?num=FDX987654321",
  "estimatedDelivery": "2025-12-06"
}
```

---

#### 5. Add Manual Tracking Event

```
POST /api/v1/orders/admin/:orderId/tracking
Authorization: Bearer <admin-token>

Body:
{
  "status": "shipped",
  "title": "Package at Customs",
  "description": "Your package is being processed at customs.",
  "location": "JFK International Airport",
  "isVisible": true
}
```

---

#### 6. Update Admin Notes

```
PATCH /api/v1/orders/admin/:orderId/notes
Authorization: Bearer <admin-token>

Body:
{
  "adminNotes": "Customer requested special handling. VIP customer."
}
```

---

#### 7. Cancel Order (Admin)

```
PATCH /api/v1/orders/:orderId/cancel
Authorization: Bearer <admin-token>

Admin delivered ও refunded ছাড়া সব cancel করতে পারবে
```

---

#### 8. Bulk Update Status

```
PATCH /api/v1/orders/admin/bulk-update
Authorization: Bearer <admin-token>

Body:
{
  "orderIds": ["ORD-1111-AAAA", "ORD-2222-BBBB", "ORD-3333-CCCC"],
  "orderStatus": "processing"
}
```

---

#### 9. Delete Order (Soft)

```
DELETE /api/v1/orders/admin/:orderId
Authorization: Bearer <admin-token>
```

---

## 📧 Automatic Email Notifications

| Event                     | Email টাইপ                           |
| ------------------------- | ------------------------------------ |
| Order placed/confirmed    | Order Confirmed (colored HTML email) |
| Status → processing       | ⚙️ Order Processing email            |
| Status → shipped          | 🚚 Shipped email + tracking number   |
| Status → out_for_delivery | 🏃 Out for Delivery email            |
| Status → delivered        | 🎉 Delivered email                   |
| Order cancelled           | ❌ Cancellation + refund info        |

---

## 🚚 Courier Integration

### Current: DUMMY (সব কাজ করছে, real API call যাবে না)

### Future: Real API এর জন্য `.env` এ keys বসান:

```env
# DHL
DHL_API_URL=https://api.dhl.com
DHL_API_KEY=your_real_dhl_key
DHL_ACCOUNT_NUMBER=your_account

# FedEx
FEDEX_API_URL=https://apis.fedex.com
FEDEX_CLIENT_ID=your_client_id
FEDEX_CLIENT_SECRET=your_client_secret
FEDEX_ACCOUNT_NUMBER=your_account

# UPS
UPS_API_KEY=your_ups_key
UPS_ACCOUNT_NUMBER=your_account

# USPS
USPS_USER_ID=your_usps_id

# Local Courier (আপনার নিজের)
LOCAL_COURIER_API_URL=https://your-courier.com/api
LOCAL_COURIER_API_KEY=your_key

# Store/Warehouse Address (Shipping label এর জন্য)
STORE_NAME=Your Store Name
STORE_ADDRESS=123 Warehouse Street
STORE_CITY=Dhaka
STORE_STATE=Dhaka
STORE_ZIP_CODE=1000
STORE_COUNTRY=BD
STORE_PHONE=+8801XXXXXXXXX

# Frontend URL (email link এর জন্য)
FRONTEND_URL=https://yourstore.com
```

### Real Carrier API বসানোর উপায়:

`src/app/utils/courierService.ts` এ যান:

1. `createShipment()` method এ REAL API INTEGRATION section uncomment করুন
2. `getTrackingInfo()` method এ carrier-specific methods uncomment করুন

---

## 🔁 Payment → Order Auto-Flow

```
User Checkout
     ↓
Payment Service (payment.service.ts)
     ↓ (payment confirmed)
Auto creates Order record
     ↓
Initial tracking event: "Order Confirmed"
     ↓
Email sent to customer
```

**Manual order create করার দরকার নেই** - payment হলেই automatically order তৈরি হয়।

তবে `POST /api/v1/orders` দিয়ে manual create চাইলে করা যাবে।

---

## 🖥️ Frontend এর জন্য Component Guide

### User Orders Page (`/orders`)

```typescript
// 1. All orders fetch
GET /api/v1/orders/my/{userId}?page=1&limit=10

// 2. Filter by status
GET /api/v1/orders/my/{userId}?status=shipped

// 3. single order detail
GET /api/v1/orders/{orderId}

// Use trackingHistory array to show timeline:
order.trackingHistory
  .filter(event => event.isVisible)  // শুধু visible events দেখান
  .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  .map(event => <TimelineItem key={...} event={event} />)
```

### Order Tracking Timeline Component

```typescript
// trackingHistory এ এই fields পাবেন:
{
  status: "shipped",
  title: "Order Shipped",
  description: "Your order is on its way via DHL",
  location: "Warehouse, New York",
  timestamp: "2025-11-30T11:00:00.000Z",
  isVisible: true
}
```

### Admin Dashboard Stats

```typescript
// Dashboard card data:
GET /api/v1/orders/admin/stats

// Response এ পাবেন:
{
  totalOrders, totalRevenue,
  todayOrders, todayRevenue,
  monthlyOrders, monthlyRevenue,
  ordersByStatus: { pending: 50, confirmed: 100, ... }
}
```

---

## ✅ Status Color Mapping (Frontend এ ব্যবহার করুন)

```typescript
const statusColors = {
  pending: 'bg-yellow-500/10 text-yellow-600',
  confirmed: 'bg-blue-500/10 text-blue-600',
  processing: 'bg-indigo-500/10 text-indigo-600',
  shipped: 'bg-purple-500/10 text-purple-600',
  out_for_delivery: 'bg-orange-500/10 text-orange-600',
  delivered: 'bg-green-500/10 text-green-600',
  cancelled: 'bg-red-500/10 text-red-600',
  returned: 'bg-gray-500/10 text-gray-600',
  refunded: 'bg-pink-500/10 text-pink-600',
};
```

---

## 🔧 Order Constants (copy করুন frontend এ)

```typescript
export const ORDER_STATUSES = [
  { value: 'pending', label: 'Pending', step: 1 },
  { value: 'confirmed', label: 'Confirmed', step: 2 },
  { value: 'processing', label: 'Processing', step: 3 },
  { value: 'shipped', label: 'Shipped', step: 4 },
  { value: 'out_for_delivery', label: 'Out for Delivery', step: 5 },
  { value: 'delivered', label: 'Delivered', step: 6 },
  { value: 'cancelled', label: 'Cancelled', step: null },
  { value: 'returned', label: 'Returned', step: null },
  { value: 'refunded', label: 'Refunded', step: null },
] as const;
```

---

_সকল code comment করা আছে। কোনো প্রশ্ন থাকলে order.service.ts ফাইলে বিস্তারিত explanation পাবেন।_
