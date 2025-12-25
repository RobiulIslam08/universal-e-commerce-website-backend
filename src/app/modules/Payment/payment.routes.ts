import express from 'express';
import { PaymentController } from './payment.controller';
import validateRequest from '../../middleware/validationRequest';
import { PaymentValidation } from './payment.validation';
// import auth from '../../middleware/auth';
// import { UserRole } from '../User/user.interface';

const router = express.Router();

// ============= PUBLIC/USER ROUTES =============

// Create payment record
router.post(
  '/',
  // auth(UserRole.USER, UserRole.ADMIN), // Uncomment when auth middleware is ready
  // validateRequest(PaymentValidation.createPaymentValidationSchema),
  PaymentController.createPayment,
);

// Get user's payment history
router.get(
  '/user/:userId',
  // auth(UserRole.USER, UserRole.ADMIN), // Uncomment when auth middleware is ready
  validateRequest(PaymentValidation.getUserPaymentsSchema),
 
  PaymentController.getUserPayments,
);

// Get payment by payment intent ID
router.get(
  '/intent/:paymentIntentId',
  // auth(UserRole.USER, UserRole.ADMIN), // Uncomment when auth middleware is ready
  PaymentController.getPaymentByIntentId,
);

// Verify payment with Stripe
router.get(
  '/verify/:paymentIntentId',
  // auth(UserRole.USER, UserRole.ADMIN), // Uncomment when auth middleware is ready
  PaymentController.verifyPayment,
);

// ============= ADMIN ROUTES =============

// Get payment statistics (Admin only)
router.get(
  '/admin/stats',
  // auth(UserRole.ADMIN), // Uncomment when auth middleware is ready
  PaymentController.getPaymentStats,
);

// Get all payments (Admin only)
router.get(
  '/admin/all',
  // auth(UserRole.ADMIN), // Uncomment when auth middleware is ready
  validateRequest(PaymentValidation.getAllPaymentsQueryValidationSchema),
  PaymentController.getAllPayments,
);

// Refund payment (Admin only)
router.post(
  '/admin/refund/:id',
  // auth(UserRole.ADMIN), // Uncomment when auth middleware is ready
  validateRequest(PaymentValidation.paymentIdParamValidationSchema),
  PaymentController.refundPayment,
);

// Update payment status (Admin only)
router.patch(
  '/admin/:id/status',
  // auth(UserRole.ADMIN), // Uncomment when auth middleware is ready
  validateRequest(PaymentValidation.paymentIdParamValidationSchema),
  validateRequest(PaymentValidation.updatePaymentStatusValidationSchema),
  PaymentController.updatePaymentStatus,
);

// Delete payment (Admin only - soft delete)
router.delete(
  '/admin/:id',
  // auth(UserRole.ADMIN), // Uncomment when auth middleware is ready
  validateRequest(PaymentValidation.paymentIdParamValidationSchema),
  PaymentController.deletePayment,
);

// ============= COMMON ROUTES =============

// Get single payment by ID
router.get(
  '/:id',
  // auth(UserRole.USER, UserRole.ADMIN), // Uncomment when auth middleware is ready
  validateRequest(PaymentValidation.paymentIdParamValidationSchema),
  PaymentController.getSinglePayment,
);

export const PaymentRoutes = router;
