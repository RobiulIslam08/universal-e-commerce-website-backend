import { Document, Model, Types } from 'mongoose';

// ============================================================
// ORDER STATUS ENUM
// অর্ডারের প্রতিটি ধাপ (step) এখানে define করা আছে
// একটি real e-commerce site এ order এই ধাপগুলো দিয়ে যায়
// ============================================================
export enum OrderStatus {
  PENDING = 'pending', // অর্ডার করা হয়েছে, পেমেন্ট বাকি বা COD
  CONFIRMED = 'confirmed', // পেমেন্ট সফল, অর্ডার নিশ্চিত
  PROCESSING = 'processing', // গুদামঘরে প্যাকেজিং চলছে
  SHIPPED = 'shipped', // courier/carrier এ হস্তান্তর করা হয়েছে
  OUT_FOR_DELIVERY = 'out_for_delivery', // ডেলিভারিম্যান নিয়ে যাচ্ছে
  DELIVERED = 'delivered', // সফলভাবে ডেলিভারি হয়েছে
  CANCELLED = 'cancelled', // অর্ডার বাতিল হয়েছে
  RETURNED = 'returned', // পণ্য ফেরত দেওয়া হয়েছে
  REFUNDED = 'refunded', // অর্থ ফেরত দেওয়া হয়েছে
}

// ============================================================
// PAYMENT METHOD & STATUS ENUM
// ============================================================
export enum OrderPaymentMethod {
  STRIPE = 'stripe', // Online credit/debit card
  COD = 'cod', // Cash on delivery
  OTHER = 'other',
}

export enum OrderPaymentStatus {
  PENDING = 'pending', // পেমেন্ট বাকি
  PAID = 'paid', // পেমেন্ট সফল
  FAILED = 'failed', // পেমেন্ট ব্যর্থ
  REFUNDED = 'refunded', // অর্থ ফেরত দেওয়া হয়েছে
}

// ============================================================
// CARRIER (COURIER) NAME ENUM
// যেসব courier/carrier service support করবে
// ============================================================
export enum CarrierName {
  DHL = 'DHL',
  FEDEX = 'FedEx',
  UPS = 'UPS',
  USPS = 'USPS',
  LOCAL = 'Local Delivery', // স্থানীয় ডেলিভারি সার্ভিস
  SELF_DELIVERY = 'Self Delivery', // নিজস্ব ডেলিভারি (admin নিজে বা নিজের লোক দিয়ে পাঠায়)
  OTHER = 'Other',
}

// ============================================================
// ORDER ITEM INTERFACE
// প্রতিটি পণ্যের তথ্য এই interface এ রাখা হয়
// ============================================================
export interface IOrderItem {
  productId: string; // product এর MongoDB ObjectId (string হিসেবে)
  productName: string; // পণ্যের নাম (order time এ snapshot নেওয়া হয়)
  quantity: number; // পরিমাণ
  price: number; // একটির দাম (order time এ snapshot নেওয়া হয়)
  image?: string; // পণ্যের ছবি URL
  sku?: string; // Stock Keeping Unit (optional)
}

// ============================================================
// SHIPPING ADDRESS INTERFACE
// ডেলিভারির ঠিকানা
// ============================================================
export interface IShippingAddress {
  firstName: string;
  lastName: string;
  email: string; // ডেলিভারি confirmation email পাঠানোর জন্য
  phone: string;
  address: string; // বাড়ি/ফ্ল্যাট নম্বর, রাস্তা
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

// ============================================================
// CARRIER INFO INTERFACE
// কোন courier এ দেওয়া হয়েছে এবং tracking info
// ============================================================
export interface ICarrierInfo {
  name: CarrierName | string; // Carrier এর নাম
  trackingNumber?: string; // carrier এর tracking number
  trackingUrl?: string; // carrier এর official tracking page URL
  estimatedDelivery?: Date; // আনুমানিক ডেলিভারি তারিখ
  actualDelivery?: Date; // আসল ডেলিভারি তারিখ
  shippedAt?: Date; // কখন carrier কে দেওয়া হয়েছে
  shipmentId?: string; // carrier API থেকে পাওয়া shipment ID
  labelUrl?: string; // shipping label PDF URL (admin এর জন্য)
}

// ============================================================
// TRACKING EVENT INTERFACE
// প্রতিটি status change এর বিস্তারিত history
// এটি একটি timeline তৈরি করে যা user ও admin দুজনেই দেখতে পারবে
// ============================================================
export interface ITrackingEvent {
  status: OrderStatus; // এই event এ কোন status এ ছিল
  title: string; // ছোট শিরোনাম (e.g. "Order Shipped")
  description: string; // বিস্তারিত বিবরণ
  location?: string; // কোথা থেকে update দেওয়া হয়েছে (optional)
  timestamp: Date; // কখন এই event হয়েছে
  updatedBy: string; // কে update দিয়েছে: 'system', userId, 'courier_api'
  isVisible: boolean; // user কে দেখানো হবে কিনা (admin-only events hide করা যাবে)
}

// ============================================================
// MAIN ORDER INTERFACE
// পুরো অর্ডারের মূল structure
// ============================================================
export interface IOrder {
  // --- Basic Info ---
  orderId: string; // Human-readable ID (e.g. "ORD-1234567890-ABCD")

  // --- User Info ---
  userId: Types.ObjectId; // কোন user এর অর্ডার
  userEmail: string; // email notification পাঠানোর জন্য
  userName: string; // user এর নাম

  // --- Payment Info ---
  paymentIntentId?: string; // Stripe payment intent ID (if stripe)
  paymentMethod: OrderPaymentMethod;
  paymentStatus: OrderPaymentStatus;

  // --- Order Details ---
  items: IOrderItem[]; // কোন কোন পণ্য অর্ডার করা হয়েছে
  shippingAddress: IShippingAddress;

  // --- Status ---
  orderStatus: OrderStatus;

  // --- Carrier/Courier Info ---
  carrier?: ICarrierInfo; // কোন courier এ শিপ করা হয়েছে

  // --- Tracking History/Timeline ---
  // প্রতিটি status change এখানে log হবে
  trackingHistory: ITrackingEvent[];

  // --- Financial Breakdown ---
  subtotal: number; // পণ্যের মোট দাম (shipping/tax ছাড়া)
  discountAmount: number; // মোট ছাড়
  shippingCost: number; // shipping fee
  taxAmount: number; // tax/VAT
  totalAmount: number; // সর্বমোট (subtotal - discount + shipping + tax)
  currency: string; // USD, BDT, etc.

  // --- Notes ---
  customerNotes?: string; // customer এর বিশেষ মন্তব্য/নির্দেশনা
  adminNotes?: string; // admin এর internal notes (user দেখতে পাবে না)

  // --- Cancellation Info ---
  cancellationReason?: string; // বাতিলের কারণ
  cancelledAt?: Date; // কখন বাতিল হয়েছে
  cancelledBy?: string; // কে বাতিল করেছে

  // --- Soft Delete ---
  isDeleted: boolean;

  // --- Timestamps ---
  createdAt?: Date;
  updatedAt?: Date;
}

// ============================================================
// MONGOOSE DOCUMENT INTERFACE
// Mongoose এর Document type এর সাথে combine করা
// ============================================================
export interface IOrderDocument extends IOrder, Document {}

// ============================================================
// MONGOOSE MODEL INTERFACE
// Static methods define করার জন্য
// ============================================================
export interface IOrderModel extends Model<IOrderDocument> {
  isOrderExists(orderId: string): Promise<IOrderDocument | null>;
}

// ============================================================
// DTO (Data Transfer Object) INTERFACES
// API request/response এর জন্য
// ============================================================

// নতুন অর্ডার তৈরির জন্য
export interface ICreateOrderDTO {
  userId: string;
  userEmail: string;
  userName: string;
  paymentIntentId?: string;
  paymentMethod: OrderPaymentMethod;
  paymentStatus: OrderPaymentStatus;
  items: IOrderItem[];
  shippingAddress: IShippingAddress;
  subtotal: number;
  discountAmount?: number;
  shippingCost?: number;
  taxAmount?: number;
  totalAmount: number;
  currency?: string;
  customerNotes?: string;
}

// Admin কর্তৃক order status update এর জন্য
export interface IUpdateOrderStatusDTO {
  orderStatus: OrderStatus;
  title?: string; // tracking event এর title (না দিলে auto generate হবে)
  description?: string; // tracking event এর description (না দিলে auto generate হবে)
  location?: string; // কোথা থেকে update দেওয়া হচ্ছে
  isVisible?: boolean; // user কে দেখানো হবে কিনা (default: true)
  adminNotes?: string; // admin এর internal note (user দেখতে পাবে না)
  // Carrier info (shipped status এর সময় দেওয়া হয়)
  carrier?: {
    name: CarrierName | string;
    trackingNumber?: string;
    trackingUrl?: string;
    estimatedDelivery?: string; // ISO date string
  };
}

// Query Filters (list বের করার সময় filter করার জন্য)
export interface IOrderQuery {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  paymentStatus?: OrderPaymentStatus;
  paymentMethod?: OrderPaymentMethod;
  userId?: string;
  startDate?: string; // date range filter শুরু
  endDate?: string; // date range filter শেষ
  searchTerm?: string; // orderId বা userName বা userEmail দিয়ে search
  sortBy?: string; // কোন field দিয়ে sort (default: createdAt)
  sortOrder?: 'asc' | 'desc'; // sort direction (default: desc)
}

// Admin Statistics Response
export interface IOrderStats {
  totalOrders: number;
  totalRevenue: number;
  ordersByStatus: Record<OrderStatus, number>;
  todayOrders: number;
  todayRevenue: number;
  monthlyOrders: number;
  monthlyRevenue: number;
  averageOrderValue: number;
}
