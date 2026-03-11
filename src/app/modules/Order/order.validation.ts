import { z } from 'zod';
import {
  OrderStatus,
  OrderPaymentMethod,
  OrderPaymentStatus,
} from './order.interface';

// ORDER ITEM VALIDATION
const orderItemValidationSchema = z.object({
  productId: z.string({ message: 'Product ID is required' }).min(1),
  productName: z.string({ message: 'Product name is required' }).min(1),
  quantity: z
    .number({ message: 'Quantity must be a number' })
    .int({ message: 'Quantity must be an integer' })
    .min(1, { message: 'Quantity must be at least 1' }),
  price: z
    .number({ message: 'Price must be a number' })
    .min(0, { message: 'Price cannot be negative' }),
  image: z.string().optional(),
  sku: z.string().optional(),
});

// SHIPPING ADDRESS VALIDATION
const shippingAddressValidationSchema = z.object({
  firstName: z.string({ message: 'First name is required' }).min(1),
  lastName: z.string({ message: 'Last name is required' }).min(1),
  email: z
    .string({ message: 'Email is required' })
    .email({ message: 'Invalid email format' }),
  phone: z
    .string({ message: 'Phone is required' })
    .min(10, { message: 'Phone must be at least 10 characters' }),
  address: z.string({ message: 'Address is required' }).min(1),
  city: z.string({ message: 'City is required' }).min(1),
  state: z.string({ message: 'State is required' }).min(1),
  zipCode: z.string({ message: 'ZIP code is required' }).min(1),
  country: z.string({ message: 'Country is required' }).min(1),
});

// CREATE ORDER
const createOrderValidationSchema = z.object({
  body: z.object({
    userId: z.string({ message: 'User ID is required' }).min(1),
    userEmail: z
      .string({ message: 'User email is required' })
      .email({ message: 'Invalid email format' }),
    userName: z.string({ message: 'User name is required' }).min(1),
    paymentIntentId: z.string().optional(),
    paymentMethod: z.nativeEnum(OrderPaymentMethod, {
      message: 'Invalid payment method',
    }),
    paymentStatus: z
      .nativeEnum(OrderPaymentStatus)
      .optional()
      .default(OrderPaymentStatus.PENDING),
    items: z
      .array(orderItemValidationSchema)
      .min(1, { message: 'Order must have at least one item' }),
    shippingAddress: shippingAddressValidationSchema,
    subtotal: z
      .number({ message: 'Subtotal must be a number' })
      .min(0, { message: 'Subtotal cannot be negative' }),
    discountAmount: z.number().min(0).optional().default(0),
    shippingCost: z.number().min(0).optional().default(0),
    taxAmount: z.number().min(0).optional().default(0),
    totalAmount: z
      .number({ message: 'Total amount must be a number' })
      .min(0, { message: 'Total amount cannot be negative' }),
    currency: z.string().optional().default('usd'),
    customerNotes: z.string().max(500).optional(),
  }),
});

// UPDATE ORDER STATUS
const updateOrderStatusValidationSchema = z.object({
  body: z.object({
    orderStatus: z.nativeEnum(OrderStatus, { message: 'Invalid order status' }),
    title: z.string().optional(),
    description: z.string().optional(),
    location: z.string().optional(),
    isVisible: z.boolean().optional().default(true),
    adminNotes: z.string().max(1000).optional(),
    carrier: z
      .object({
        name: z.string({ message: 'Carrier name is required' }),
        trackingNumber: z.string().optional(),
        trackingUrl: z
          .string()
          .url({ message: 'Invalid tracking URL' })
          .optional(),
        estimatedDelivery: z.string().optional(),
      })
      .optional(),
  }),
});

// CANCEL ORDER
const cancelOrderValidationSchema = z.object({
  body: z.object({
    cancellationReason: z
      .string({ message: 'Cancellation reason is required' })
      .min(5, { message: 'Please provide a reason (min 5 characters)' })
      .max(500, { message: 'Reason cannot exceed 500 characters' }),
  }),
});

// GET ORDERS QUERY
const getOrdersQueryValidationSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    status: z.nativeEnum(OrderStatus).optional(),
    paymentStatus: z.nativeEnum(OrderPaymentStatus).optional(),
    paymentMethod: z.nativeEnum(OrderPaymentMethod).optional(),
    userId: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    searchTerm: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
});

// ADD TRACKING EVENT
const addTrackingEventValidationSchema = z.object({
  body: z.object({
    status: z.nativeEnum(OrderStatus, { message: 'Status is required' }),
    title: z.string({ message: 'Event title is required' }).min(1),
    description: z.string({ message: 'Event description is required' }).min(1),
    location: z.string().optional(),
    isVisible: z.boolean().optional().default(true),
  }),
});

// UPDATE ADMIN NOTES
const updateAdminNotesValidationSchema = z.object({
  body: z.object({
    adminNotes: z
      .string({ message: 'Admin notes are required' })
      .max(1000, { message: 'Admin notes cannot exceed 1000 characters' }),
  }),
});

// ASSIGN CARRIER
const assignCarrierValidationSchema = z.object({
  body: z.object({
    name: z.string({ message: 'Carrier name is required' }).min(1),
    trackingNumber: z.string().optional(),
    trackingUrl: z.string().url({ message: 'Invalid tracking URL' }).optional(),
    estimatedDelivery: z.string().optional(),
  }),
});

export const OrderValidation = {
  createOrderValidationSchema,
  updateOrderStatusValidationSchema,
  cancelOrderValidationSchema,
  getOrdersQueryValidationSchema,
  addTrackingEventValidationSchema,
  updateAdminNotesValidationSchema,
  assignCarrierValidationSchema,
};
