import { Schema, model } from 'mongoose';
import {
  IOrder,
  IOrderDocument,
  IOrderModel,
  IOrderItem,
  IShippingAddress,
  ICarrierInfo,
  ITrackingEvent,
  OrderStatus,
  OrderPaymentMethod,
  OrderPaymentStatus,
  CarrierName,
} from './order.interface';

// ============================================================
// ORDER ITEM SUB-SCHEMA
// প্রতিটি পণ্যের বিশদ বিবরণ
// _id: false কারণ এটি একটি nested document, আলাদা _id দরকার নেই
// ============================================================
const orderItemSchema = new Schema<IOrderItem>(
  {
    productId: {
      type: String,
      required: [true, 'Product ID is required'],
    },
    productName: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    image: {
      type: String,
      trim: true,
    },
    sku: {
      type: String,
      trim: true,
    },
  },
  { _id: false }, // nested document, আলাদা _id লাগবে না
);

// ============================================================
// SHIPPING ADDRESS SUB-SCHEMA
// ============================================================
const shippingAddressSchema = new Schema<IShippingAddress>(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
    },
    zipCode: {
      type: String,
      required: [true, 'ZIP code is required'],
      trim: true,
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
      default: 'US',
    },
  },
  { _id: false },
);

// ============================================================
// CARRIER INFO SUB-SCHEMA
// courier / shipping carrier এর তথ্য
// ============================================================
const carrierInfoSchema = new Schema<ICarrierInfo>(
  {
    name: {
      type: String,
      enum: [...Object.values(CarrierName), 'Other'], // enum এর বাইরে custom name ও দেওয়া যাবে
      required: [true, 'Carrier name is required'],
    },
    trackingNumber: {
      type: String,
      trim: true,
    },
    trackingUrl: {
      type: String,
      trim: true,
    },
    estimatedDelivery: {
      type: Date,
    },
    actualDelivery: {
      type: Date,
    },
    shippedAt: {
      type: Date,
    },
    shipmentId: {
      type: String,
      trim: true,
    },
    labelUrl: {
      type: String,
      trim: true,
    },
  },
  { _id: false },
);

// ============================================================
// TRACKING EVENT SUB-SCHEMA
// প্রতিটি status change এর history log
// এটি দিয়ে user/admin একটি timeline দেখতে পাবে
// ============================================================
const trackingEventSchema = new Schema<ITrackingEvent>(
  {
    status: {
      type: String,
      enum: Object.values(OrderStatus),
      required: [true, 'Status is required'],
    },
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Event description is required'],
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    updatedBy: {
      type: String,
      required: [true, 'UpdatedBy is required'],
      default: 'system', // 'system', admin userId, বা 'courier_api'
    },
    isVisible: {
      type: Boolean,
      default: true, // default এ user দেখতে পাবে
    },
  },
  { _id: true }, // প্রতিটি tracking event এর আলাদা _id দরকার (edit/delete এর জন্য)
);

// ============================================================
// MAIN ORDER SCHEMA
// ============================================================
const orderSchema = new Schema<IOrderDocument, IOrderModel>(
  {
    // ---- Human-readable Order ID ----
    // auto-generate হবে, format: "ORD-TIMESTAMP-RANDOMSTRING"
    orderId: {
      type: String,
      required: [true, 'Order ID is required'],
      unique: true,
      trim: true,
      index: true, // দ্রুত search এর জন্য index
    },

    // ---- User Reference ----
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User', // User model এর সাথে reference
      required: [true, 'User ID is required'],
      index: true,
    },
    userEmail: {
      type: String,
      required: [true, 'User email is required'],
      trim: true,
      lowercase: true,
      index: true, // email দিয়ে search এর জন্য
    },
    userName: {
      type: String,
      required: [true, 'User name is required'],
      trim: true,
    },

    // ---- Payment Reference ----
    paymentIntentId: {
      type: String,
      trim: true,
      index: true, // payment intent দিয়ে order খুঁজতে
    },
    paymentMethod: {
      type: String,
      enum: Object.values(OrderPaymentMethod),
      required: [true, 'Payment method is required'],
    },
    paymentStatus: {
      type: String,
      enum: Object.values(OrderPaymentStatus),
      default: OrderPaymentStatus.PENDING,
    },

    // ---- Order Items ----
    items: {
      type: [orderItemSchema],
      required: [true, 'Order items are required'],
      validate: {
        validator: (items: IOrderItem[]) => items.length > 0,
        message: 'Order must have at least one item',
      },
    },

    // ---- Shipping Address ----
    shippingAddress: {
      type: shippingAddressSchema,
      required: [true, 'Shipping address is required'],
    },

    // ---- Order Status ----
    orderStatus: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.PENDING,
      index: true,
    },

    // ---- Carrier Info (শুধু shipped হলে populate হবে) ----
    carrier: {
      type: carrierInfoSchema,
      default: null,
    },

    // ---- Tracking History/Timeline ----
    // প্রতিটি status change এখানে append হবে
    trackingHistory: {
      type: [trackingEventSchema],
      default: [],
    },

    // ---- Financial Breakdown ----
    subtotal: {
      type: Number,
      required: [true, 'Subtotal is required'],
      min: [0, 'Subtotal cannot be negative'],
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: [0, 'Discount cannot be negative'],
    },
    shippingCost: {
      type: Number,
      default: 0,
      min: [0, 'Shipping cost cannot be negative'],
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: [0, 'Tax cannot be negative'],
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative'],
    },
    currency: {
      type: String,
      default: 'usd',
      trim: true,
      lowercase: true,
    },

    // ---- Notes ----
    customerNotes: {
      type: String,
      trim: true,
      maxlength: [500, 'Customer notes cannot exceed 500 characters'],
    },
    adminNotes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Admin notes cannot exceed 1000 characters'],
    },

    // ---- Cancellation Info ----
    cancellationReason: {
      type: String,
      trim: true,
    },
    cancelledAt: {
      type: Date,
    },
    cancelledBy: {
      type: String,
      trim: true,
    },

    // ---- Soft Delete ----
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // createdAt ও updatedAt auto-manage হবে
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ============================================================
// INDEXES - দ্রুত query এর জন্য compound indexes
// ============================================================
// Admin সব order এক সাথে দেখার জন্য (status + date)
orderSchema.index({ orderStatus: 1, createdAt: -1 });

// User এর নির্দিষ্ট status এর order দেখার জন্য
orderSchema.index({ userId: 1, orderStatus: 1 });

// Date range query এর জন্য
orderSchema.index({ createdAt: -1 });

// Search এর জন্য text index
orderSchema.index({ orderId: 'text', userName: 'text', userEmail: 'text' });

// ============================================================
// VIRTUAL FIELDS
// Database এ save হয় না, কিন্তু response এ পাঠানো হয়
// ============================================================

// itemsCount: কতটি unique পণ্য আছে
orderSchema.virtual('itemsCount').get(function () {
  return this.items.length;
});

// totalItems: মোট quantity
orderSchema.virtual('totalItems').get(function () {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

// ============================================================
// PRE-SAVE MIDDLEWARE
// Save হওয়ার আগে কিছু কাজ করা
// ============================================================

// Soft delete হলে tracking history তে add করা (optional logic)
orderSchema.pre('find', function () {
  // soft deleted order গুলো default query তে আসবে না
  this.where({ isDeleted: { $ne: true } });
});

orderSchema.pre('findOne', function () {
  this.where({ isDeleted: { $ne: true } });
});

orderSchema.pre('findOneAndUpdate', function () {
  this.where({ isDeleted: { $ne: true } });
});

// ============================================================
// STATIC METHODS
// Model level methods
// ============================================================

// orderId দিয়ে order খোঁজার জন্য
orderSchema.statics.isOrderExists = async function (
  orderId: string,
): Promise<IOrderDocument | null> {
  return this.findOne({ orderId, isDeleted: false });
};

// ============================================================
// HELPER FUNCTION: Human-readable Order ID Generate করা
// Format: ORD-TIMESTAMP-RANDOM (e.g. ORD-1764594022323-A7B2)
// ============================================================
export const generateOrderId = (): string => {
  const timestamp = Date.now();
  // 4 digit random alphanumeric string
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
};

// ============================================================
// ORDER MODEL
// ============================================================
export const Order = model<IOrderDocument, IOrderModel>('Order', orderSchema);
