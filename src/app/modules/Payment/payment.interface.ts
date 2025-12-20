import { Document, Model, Types } from 'mongoose';

// Payment Status Enum
export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

// Payment Item Interface
export interface IPaymentItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  image?: string;
}

// Shipping Address Interface
export interface IShippingAddress {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
}

// Main Payment Interface
export interface IPayment {
  userId: Types.ObjectId;
  userEmail: string;
  userName: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod?: string;
  items: IPaymentItem[];
  shippingAddress?: IShippingAddress;
  stripeCustomerId?: string;
  receiptUrl?: string;
  metadata?: Record<string, any>;
  isDeleted: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Payment Document Interface (for Mongoose)
export interface IPaymentDocument extends IPayment, Document {}

// Payment Model Interface (for static methods)
export interface IPaymentModel extends Model<IPaymentDocument> {
  isPaymentExists(paymentIntentId: string): Promise<IPaymentDocument | null>;
}

// DTO Interfaces for API
export interface ICreatePaymentDTO {
  userId: string;
  userEmail: string;
  userName: string;
  paymentIntentId: string;
  amount: number;
  currency?: string;
  status: PaymentStatus;
  paymentMethod?: string;
  items: IPaymentItem[];
  shippingAddress?: IShippingAddress;
  stripeCustomerId?: string;
  receiptUrl?: string;
  metadata?: Record<string, any>;
}

export interface IPaymentQuery {
  page?: number;
  limit?: number;
  status?: PaymentStatus;
  userId?: string;
  searchTerm?: string;
}

export interface IPaymentStats {
  totalRevenue: number;
  totalOrders: number;
  successfulPayments: number;
  failedPayments: number;
  pendingPayments: number;
  averageOrderValue: number;
}
