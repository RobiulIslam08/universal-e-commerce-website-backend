import { z } from 'zod';
import { PaymentStatus } from './payment.interface';

// Payment Item Validation Schema
const paymentItemSchema = z.object({
  productId: z.string({ message: 'Product ID is required' }).trim(),
  productName: z.string({ message: 'Product name is required' }).trim(),
  quantity: z
    .number({ message: 'Quantity must be a number' })
    .int({ message: 'Quantity must be an integer' })
    .min(1, { message: 'Quantity must be at least 1' }),
  price: z
    .number({ message: 'Price must be a number' })
    .min(0, { message: 'Price must be a positive number' }),
  image: z.string().trim().optional(),
});

// Shipping Address Validation Schema
const shippingAddressSchema = z.object({
  firstName: z.string({ message: 'First name is required' }).trim(),
  lastName: z.string({ message: 'Last name is required' }).trim(),
  address: z.string({ message: 'Address is required' }).trim(),
  city: z.string({ message: 'City is required' }).trim(),
  state: z.string({ message: 'State is required' }).trim(),
  zipCode: z.string({ message: 'ZIP code is required' }).trim(),
  country: z.string().trim().default('US'),
  phone: z.string({ message: 'Phone number is required' }).trim(),
});

// Create Payment Validation Schema
const createPaymentValidationSchema = z.object({
  body: z.object({
    userId: z.string({ message: 'User ID is required' }).trim(),
    userEmail: z
      .string({ message: 'User email is required' })
      .email({ message: 'Invalid email address' })
      .toLowerCase()
      .trim(),
    userName: z.string({ message: 'User name is required' }).trim(),
    paymentIntentId: z
      .string({ message: 'Payment intent ID is required' })
      .trim(),
    amount: z
      .number({ message: 'Amount must be a number' })
      .min(0, { message: 'Amount must be a positive number' }),
    currency: z.string().trim().toUpperCase().default('USD'),
    status: z.nativeEnum(PaymentStatus).default(PaymentStatus.PENDING),
    paymentMethod: z.string().trim().optional(),
    items: z
      .array(paymentItemSchema)
      .min(1, { message: 'At least one item is required' }),
    shippingAddress: shippingAddressSchema.optional(),
    stripeCustomerId: z.string().trim().optional(),
    receiptUrl: z.string().trim().optional(),
    metadata: z.record(z.string(), z.any()).optional(),
  }),
});

// Update Payment Status Validation Schema
const updatePaymentStatusValidationSchema = z.object({
  body: z.object({
    status: z.nativeEnum(PaymentStatus, {
      message: 'Invalid payment status',
    }),
  }),
});

// Get User Payments Query Validation Schema
const getUserPaymentsQueryValidationSchema = z.object({
  query: z.object({
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 1)),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 10)),
  }),
});

// Get All Payments Query Validation Schema (Admin)
const getAllPaymentsQueryValidationSchema = z.object({
  query: z.object({
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 1)),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 20)),
    status: z.nativeEnum(PaymentStatus).optional(),
    searchTerm: z.string().trim().optional(),
  }),
});

// Payment ID Param Validation Schema
const paymentIdParamValidationSchema = z.object({
  params: z.object({
    id: z.string({ message: 'Payment ID is required' }).trim(),
  }),
});

// User ID Param Validation Schema
const userIdParamValidationSchema = z.object({
  params: z.object({
    userId: z.string({ message: 'User ID is required' }).trim(),
  }),
});

export const PaymentValidation = {
  createPaymentValidationSchema,
  updatePaymentStatusValidationSchema,
  getUserPaymentsQueryValidationSchema,
  getAllPaymentsQueryValidationSchema,
  paymentIdParamValidationSchema,
  userIdParamValidationSchema,
};
