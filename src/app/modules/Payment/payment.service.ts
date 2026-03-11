import httpStatus from 'http-status';
import Stripe from 'stripe';
import mongoose, { Types } from 'mongoose';
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
import { Product } from '../product/product.model';
import {
  sendEmail,
  getPaymentConfirmationEmailTemplate,
  getCODOrderConfirmationEmailTemplate,
} from '../../utils/sendEmail';
// ---- Order module import (payment সফল হলে order auto-create) ----
import { Order, generateOrderId } from '../Order/order.model';
import {
  OrderStatus,
  OrderPaymentMethod,
  OrderPaymentStatus,
} from '../Order/order.interface';

// Initialize Stripe
const stripe = new Stripe(config.stripe_secret_key as string, {
  apiVersion: '2025-12-15.clover',
});

// Create a new payment record
// const createPaymentIntoDB = async (
//   payload: ICreatePaymentDTO,
// ): Promise<IPaymentDocument> => {
//   // Check if payment already exists
//   const existingPayment = await Payment.isPaymentExists(
//     payload.paymentIntentId,
//   );

//   if (existingPayment) {
//     throw new AppError(
//       httpStatus.CONFLICT,
//       'Payment record already exists with this payment intent ID',
//     );
//   }

//   // Create payment record
//   const payment = await Payment.create(payload);

//   return payment;
// };

const createPaymentIntoDB = async (
  payload: ICreatePaymentDTO,
): Promise<IPaymentDocument | null> => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // ১. চেক করুন পেমেন্ট আগে থেকেই আছে কিনা
    const existingPayment = await Payment.findOne({
      paymentIntentId: payload.paymentIntentId,
    }).session(session);

    // যদি পেমেন্ট ইতিমধ্যে সফলভাবে প্রসেস হয়ে থাকে, তাহলে সেই ডাটা রিটার্ন করুন
    if (existingPayment && existingPayment.status === 'succeeded') {
      await session.commitTransaction();
      await session.endSession();

      return existingPayment;
    }

    let paymentData;

    // যদি পেমেন্ট না থাকে, তাহলে নতুন তৈরি করুন
    if (!existingPayment) {
      const result = await Payment.create([payload], { session });

      if (!result.length) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          'Failed to create payment record',
        );
      }
      paymentData = result[0];
    } else {
      // পেমেন্ট আছে কিন্তু succeeded না (pending/processing)
      paymentData = existingPayment;
    }

    // ২. ইনভেন্টরি আপডেট লজিক (Stock কমানো এবং Sold Count বাড়ানো)
    // শর্ত: পেমেন্ট সফল হতে হবে এবং যদি এই পেমেন্ট আগে থেকে succeeded না থাকে
    if (
      payload.status === 'succeeded' &&
      (!existingPayment || existingPayment.status !== 'succeeded')
    ) {
      for (const item of payload.items) {
        // প্রোডাক্ট আইডিকে ObjectId তে কনভার্ট করুন (খুবই গুরুত্বপূর্ণ)
        const productId = new Types.ObjectId(item.productId);

        // ৩. স্টক আপডেট কুয়েরি
        const productUpdate = await Product.findOneAndUpdate(
          {
            _id: productId,
            stockQuantity: { $gte: item.quantity }, // চেক: স্টকে পর্যাপ্ত পণ্য আছে কি না
          },
          {
            $inc: {
              stockQuantity: -item.quantity, // স্টক কমানো
              soldCount: item.quantity, // Sold Count বাড়ানো
            },
          },
          { session, new: true },
        );

        // যদি প্রোডাক্ট আপডেট না হয় (মানে স্টক নেই বা আইডি ভুল)
        if (!productUpdate) {
          // যদি পেমেন্ট ইতিমধ্যে সেভ হয়ে থাকে কিন্তু স্টক না থাকে, তখন কি করবেন?
          // সাধারনত পেমেন্ট হয়ে গেলে এডমিনকে নোটিফাই করা উচিত, কিন্তু এখানে আমরা এরর দিচ্ছি
          throw new AppError(
            httpStatus.BAD_REQUEST,
            `Stock update failed for: ${item.productName}. Insufficient stock or invalid ID.`,
          );
        }
      }

      // পেমেন্ট স্ট্যাটাস আপডেট করুন (যদি আগে pending থেকে থাকে)
      if (existingPayment && existingPayment.status !== 'succeeded') {
        existingPayment.status = PaymentStatus.SUCCEEDED;
        await existingPayment.save({ session });
        paymentData = existingPayment;
      }

      // ✅ Payment successful - Send confirmation email
      try {
        const emailHtml = getPaymentConfirmationEmailTemplate(
          payload.userName,
          payload.amount,
          payload.currency ?? 'eur',
          payload.paymentIntentId,
          payload.items,
          payload.shippingAddress,
        );

        await sendEmail({
          to: payload.userEmail,
          subject: '✅ Payment Confirmation - Order Successful',
          html: emailHtml,
        });

        console.log(
          `✅ Payment confirmation email sent to: ${payload.userEmail}`,
        );
      } catch (emailError) {
        console.error('❌ Failed to send confirmation email:', emailError);
        // Don't throw error - payment is already successful
      }
    }

    // ✅ COD Order - Send confirmation email
    if (payload.paymentMethod === 'COD') {
      try {
        const emailHtml = getCODOrderConfirmationEmailTemplate(
          payload.userName,
          payload.amount,
          payload.currency ?? 'eur',
          payload.paymentIntentId,
          payload.items,
          payload.shippingAddress,
        );

        await sendEmail({
          to: payload.userEmail,
          subject: '🎉 Order Confirmed - Cash on Delivery',
          html: emailHtml,
        });

        console.log(
          `✅ COD order confirmation email sent to: ${payload.userEmail}`,
        );
      } catch (emailError) {
        console.error('❌ Failed to send COD confirmation email:', emailError);
        // Don't throw error - order is already placed
      }
    }

    await session.commitTransaction();
    await session.endSession();

    // ============================================================
    // AUTO-CREATE ORDER AFTER SUCCESSFUL PAYMENT
    // Payment confirm হলে automatically একটি Order record তৈরি হবে
    // এটি transaction এর বাইরে - order fail হলে payment block হবে না
    // ============================================================
    // শুধু নতুন successful payment বা নতুন COD order এর জন্য order create হবে
    const isNewSuccessfulPayment =
      payload.status === 'succeeded' &&
      (!existingPayment || existingPayment.status !== 'succeeded');
    const isNewCODOrder = payload.paymentMethod === 'COD' && !existingPayment; // COD এ নতুন order

    if ((isNewSuccessfulPayment || isNewCODOrder) && paymentData) {
      try {
        // Existing order আছে কিনা check করা (idempotency)
        const existingOrder = await Order.findOne({
          paymentIntentId: payload.paymentIntentId,
        });

        if (!existingOrder) {
          const orderId = generateOrderId();

          // Payment method mapping
          const orderPaymentMethod =
            payload.paymentMethod === 'COD'
              ? OrderPaymentMethod.COD
              : OrderPaymentMethod.STRIPE;

          // Payment status mapping
          const orderPaymentStatus =
            payload.status === 'succeeded'
              ? OrderPaymentStatus.PAID
              : OrderPaymentStatus.PENDING;

          // Initial order status
          const initialOrderStatus =
            orderPaymentStatus === OrderPaymentStatus.PAID
              ? OrderStatus.CONFIRMED
              : OrderStatus.PENDING;

          // Shipping address - payment.interface তে থাকলে নেওয়া
          const shippingAddr = payload.shippingAddress
            ? {
                firstName: payload.shippingAddress.firstName,
                lastName: payload.shippingAddress.lastName,
                email: payload.userEmail,
                phone: payload.shippingAddress.phone,
                address: payload.shippingAddress.address,
                city: payload.shippingAddress.city,
                state: payload.shippingAddress.state,
                zipCode: payload.shippingAddress.zipCode,
                country: payload.shippingAddress.country || 'US',
              }
            : {
                // Minimal fallback (address পাওয়া না গেলে)
                firstName: payload.userName.split(' ')[0] || payload.userName,
                lastName: payload.userName.split(' ').slice(1).join(' ') || '-',
                email: payload.userEmail,
                phone: 'N/A',
                address: 'N/A',
                city: 'N/A',
                state: 'N/A',
                zipCode: 'N/A',
                country: 'N/A',
              };

          // Order items from payment items
          const orderItems = payload.items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            price: item.price,
            image: item.image,
          }));

          // Initial tracking event
          const statusTitles: Record<string, string> = {
            [OrderStatus.CONFIRMED]: 'Order Confirmed',
            [OrderStatus.PENDING]: 'Order Placed',
          };
          const statusDescriptions: Record<string, string> = {
            [OrderStatus.CONFIRMED]:
              'Your payment was successful! Your order has been confirmed and will be processed shortly.',
            [OrderStatus.PENDING]:
              'Your Cash on Delivery order has been placed. Our team will confirm it shortly.',
          };

          await Order.create({
            orderId,
            userId: new Types.ObjectId(payload.userId),
            userEmail: payload.userEmail,
            userName: payload.userName,
            paymentIntentId: payload.paymentIntentId,
            paymentMethod: orderPaymentMethod,
            paymentStatus: orderPaymentStatus,
            items: orderItems,
            shippingAddress: shippingAddr,
            orderStatus: initialOrderStatus,
            subtotal: payload.amount, // payment amount = subtotal (simplified)
            discountAmount: 0,
            shippingCost: 0,
            taxAmount: 0,
            totalAmount: payload.amount,
            currency: payload.currency || 'usd',
            isDeleted: false,
            trackingHistory: [
              {
                status: initialOrderStatus,
                title: statusTitles[initialOrderStatus] || 'Order Placed',
                description:
                  statusDescriptions[initialOrderStatus] ||
                  'Your order has been received.',
                timestamp: new Date(),
                updatedBy: 'system',
                isVisible: true,
              },
            ],
          });

          console.log(
            `✅ Order auto-created: ${orderId} for payment: ${payload.paymentIntentId}`,
          );
        }
      } catch (orderError) {
        // Order creation fail হলে শুধু log করা, payment block করা নয়
        console.error(
          '❌ Auto order creation failed after payment:',
          orderError,
        );
      }
    }

    return paymentData;
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    console.error('❌ Transaction Error:', error);
    throw error;
  }
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

  // ✅ Return করুন standard structure
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
