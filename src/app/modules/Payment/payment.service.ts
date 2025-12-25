import httpStatus from 'http-status';
import Stripe from 'stripe';
import { Payment } from './payment.model';
import {
  ICreatePaymentDTO,
  IPaymentDocument,
  IPaymentQuery,
  IPaymentStats,
  PaymentStatus,
} from './payment.interface';
import AppError from '../../errors/AppError';
import config from '../../config';

// Initialize Stripe
const stripe = new Stripe(config.stripe_secret_key as string, {
  apiVersion: '2025-12-15.clover',
});

// Create a new payment record
const createPaymentIntoDB = async (
  payload: ICreatePaymentDTO,
): Promise<IPaymentDocument> => {
  // Check if payment already exists
  const existingPayment = await Payment.isPaymentExists(
    payload.paymentIntentId,
  );

  if (existingPayment) {
    throw new AppError(
      httpStatus.CONFLICT,
      'Payment record already exists with this payment intent ID',
    );
  }

  // Create payment record
  const payment = await Payment.create(payload);

  return payment;
};

// Get user's payment history
// Get user's payment history
const getUserPaymentsFromDB = async (
  userId: string,
  query: IPaymentQuery,
): Promise<{
  data: IPaymentDocument[];
  meta: {
    total: number;
    page: number;
    totalPage: number;
    limit: number;
  };
}> => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  console.log('🔍 Fetching payments for userId:', userId, { page, limit });

  // Build filter
  const filter: any = { userId, isDeleted: false };

  if (query.status) {
    filter.status = query.status;
  }

  // Get payments with pagination
  const payments = await Payment.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('userId', 'name email');

  const total = await Payment.countDocuments(filter);
  const totalPage = Math.ceil(total / limit);

  console.log('✅ Found payments:', payments.length, 'Total:', total);

  // ✅ Return করুন standard structure এ
  return {
    data: payments,
    meta: {
      total,
      page,
      totalPage,
      limit,
    },
  };
};

// Get all payments (Admin only)
const getAllPaymentsFromDB = async (
  query: IPaymentQuery,
): Promise<{
  payments: IPaymentDocument[];
  total: number;
  page: number;
  totalPages: number;
}> => {
  const page = query.page || 1;
  const limit = query.limit || 20;
  const skip = (page - 1) * limit;

  // Build filter
  const filter: any = { isDeleted: false };

  if (query.status) {
    filter.status = query.status;
  }

  // Search functionality
  if (query.searchTerm) {
    filter.$or = [
      { userEmail: { $regex: query.searchTerm, $options: 'i' } },
      { userName: { $regex: query.searchTerm, $options: 'i' } },
      { paymentIntentId: { $regex: query.searchTerm, $options: 'i' } },
    ];
  }

  // Get payments with pagination
  const payments = await Payment.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('userId', 'name email');

  const total = await Payment.countDocuments(filter);
  const totalPages = Math.ceil(total / limit);

  return {
    payments,
    total,
    page,
    totalPages,
  };
};

// Get single payment by ID
const getSinglePaymentFromDB = async (
  id: string,
): Promise<IPaymentDocument> => {
  const payment = await Payment.findById(id).populate('userId', 'name email');

  if (!payment) {
    throw new AppError(httpStatus.NOT_FOUND, 'Payment not found');
  }

  return payment;
};

// Get payment by payment intent ID
const getPaymentByIntentIdFromDB = async (
  paymentIntentId: string,
): Promise<IPaymentDocument> => {
  const payment = await Payment.findOne({ paymentIntentId }).populate(
    'userId',
    'name email',
  );

  if (!payment) {
    throw new AppError(httpStatus.NOT_FOUND, 'Payment not found');
  }

  return payment;
};

// Update payment status
const updatePaymentStatusInDB = async (
  id: string,
  status: PaymentStatus,
): Promise<IPaymentDocument> => {
  const payment = await Payment.findById(id);

  if (!payment) {
    throw new AppError(httpStatus.NOT_FOUND, 'Payment not found');
  }

  payment.status = status;
  await payment.save();

  return payment;
};

// Get payment statistics (Admin only)
const getPaymentStatsFromDB = async (): Promise<IPaymentStats> => {
  const totalOrders = await Payment.countDocuments({ isDeleted: false });

  const successfulPayments = await Payment.countDocuments({
    status: PaymentStatus.SUCCEEDED,
    isDeleted: false,
  });

  const failedPayments = await Payment.countDocuments({
    status: PaymentStatus.FAILED,
    isDeleted: false,
  });

  const pendingPayments = await Payment.countDocuments({
    status: PaymentStatus.PENDING,
    isDeleted: false,
  });

  // Calculate total revenue from succeeded payments
  const revenueResult = await Payment.aggregate([
    { $match: { status: PaymentStatus.SUCCEEDED, isDeleted: false } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);

  const totalRevenue = revenueResult[0]?.total || 0;
  const averageOrderValue =
    successfulPayments > 0 ? totalRevenue / successfulPayments : 0;

  return {
    totalRevenue: parseFloat(totalRevenue.toFixed(2)),
    totalOrders,
    successfulPayments,
    failedPayments,
    pendingPayments,
    averageOrderValue: parseFloat(averageOrderValue.toFixed(2)),
  };
};

// Verify payment with Stripe
const verifyPaymentWithStripe = async (
  paymentIntentId: string,
): Promise<Stripe.PaymentIntent> => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent;
  } catch (error: any) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Failed to verify payment with Stripe: ${error.message}`,
    );
  }
};

// Refund payment
const refundPaymentInDB = async (
  id: string,
  amount?: number,
): Promise<{
  payment: IPaymentDocument;
  refund: Stripe.Refund;
}> => {
  const payment = await Payment.findById(id);

  if (!payment) {
    throw new AppError(httpStatus.NOT_FOUND, 'Payment not found');
  }

  if (payment.status !== PaymentStatus.SUCCEEDED) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Only succeeded payments can be refunded',
    );
  }

  try {
    // Create refund in Stripe
    const refund = await stripe.refunds.create({
      payment_intent: payment.paymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined, // Convert to cents
    });

    // Update payment status
    payment.status = PaymentStatus.REFUNDED;
    await payment.save();

    return { payment, refund };
  } catch (error: any) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Failed to refund payment: ${error.message}`,
    );
  }
};

// Delete payment (soft delete)
const deletePaymentFromDB = async (id: string): Promise<IPaymentDocument> => {
  const payment = await Payment.findById(id);

  if (!payment) {
    throw new AppError(httpStatus.NOT_FOUND, 'Payment not found');
  }

  payment.isDeleted = true;
  await payment.save();

  return payment;
};

export const PaymentService = {
  createPaymentIntoDB,
  getUserPaymentsFromDB,
  getAllPaymentsFromDB,
  getSinglePaymentFromDB,
  getPaymentByIntentIdFromDB,
  updatePaymentStatusInDB,
  getPaymentStatsFromDB,
  verifyPaymentWithStripe,
  refundPaymentInDB,
  deletePaymentFromDB,
};
