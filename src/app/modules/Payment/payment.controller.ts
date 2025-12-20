import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { PaymentService } from './payment.service';
import { PaymentStatus } from './payment.interface';

// Create payment record
const createPayment = catchAsync(async (req, res) => {
  const result = await PaymentService.createPaymentIntoDB(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Payment record created successfully',
    data: result,
  });
});

// Get user's payment history
const getUserPayments = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const query = req.query;

  const result = await PaymentService.getUserPaymentsFromDB(userId, query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Payment history retrieved successfully',
    data: result,
  });
});

// Get all payments (Admin only)
const getAllPayments = catchAsync(async (req, res) => {
  const query = req.query;
  const result = await PaymentService.getAllPaymentsFromDB(query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'All payments retrieved successfully',
    data: result,
  });
});

// Get single payment by ID
const getSinglePayment = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await PaymentService.getSinglePaymentFromDB(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Payment retrieved successfully',
    data: result,
  });
});

// Get payment by payment intent ID
const getPaymentByIntentId = catchAsync(async (req, res) => {
  const { paymentIntentId } = req.params;
  const result =
    await PaymentService.getPaymentByIntentIdFromDB(paymentIntentId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Payment retrieved successfully',
    data: result,
  });
});

// Update payment status
const updatePaymentStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const result = await PaymentService.updatePaymentStatusInDB(
    id,
    status as PaymentStatus,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Payment status updated successfully',
    data: result,
  });
});

// Get payment statistics (Admin only)
const getPaymentStats = catchAsync(async (req, res) => {
  const result = await PaymentService.getPaymentStatsFromDB();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Payment statistics retrieved successfully',
    data: result,
  });
});

// Verify payment with Stripe
const verifyPayment = catchAsync(async (req, res) => {
  const { paymentIntentId } = req.params;
  const result = await PaymentService.verifyPaymentWithStripe(paymentIntentId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Payment verified successfully',
    data: result,
  });
});

// Refund payment
const refundPayment = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { amount } = req.body;

  const result = await PaymentService.refundPaymentInDB(id, amount);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Payment refunded successfully',
    data: result,
  });
});

// Delete payment (soft delete)
const deletePayment = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await PaymentService.deletePaymentFromDB(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Payment deleted successfully',
    data: result,
  });
});

export const PaymentController = {
  createPayment,
  getUserPayments,
  getAllPayments,
  getSinglePayment,
  getPaymentByIntentId,
  updatePaymentStatus,
  getPaymentStats,
  verifyPayment,
  refundPayment,
  deletePayment,
};
