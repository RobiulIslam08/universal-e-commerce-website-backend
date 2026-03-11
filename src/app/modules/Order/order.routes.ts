/**
 * ============================================================
 * ORDER ROUTES
 * ============================================================
 * Base path: /api/v1/orders
 *
 * PUBLIC / USER ROUTES:
 *   POST   /                          - Create new order
 *   GET    /my/:userId                - Get user's own orders
 *   GET    /:orderId                  - Get single order by orderId
 *   GET    /by-id/:id                 - Get single order by MongoDB _id
 *   GET    /by-payment/:intentId      - Get order by payment intent
 *   PATCH  /:orderId/cancel           - Cancel order (user can cancel pending/confirmed)
 *   POST   /:orderId/sync-tracking    - Sync tracking from carrier API
 *
 * ADMIN ROUTES (auth required - admin role):
 *   GET    /admin/all                 - Get all orders (with filters)
 *   GET    /admin/stats               - Get order statistics
 *   PATCH  /admin/:orderId/status     - Update order status
 *   PATCH  /admin/:orderId/carrier    - Assign carrier
 *   POST   /admin/:orderId/tracking   - Add manual tracking event
 *   PATCH  /admin/:orderId/notes      - Update admin notes
 *   PATCH  /admin/bulk-update         - Bulk update order status
 *   DELETE /admin/:orderId            - Soft delete order
 *
 * NOTE: auth middleware গুলো ইতিমধ্যে implement করা আছে
 *       কিন্তু test করার সুবিধার জন্য commented রেখেছি
 *       Production এ uncomment করুন
 * ============================================================
 */

import express from 'express';
import { OrderController } from './order.controller';
import validateRequest from '../../middleware/validationRequest';
import { OrderValidation } from './order.validation';
import auth from '../../middleware/auth';
import { UserRole } from '../User/user.interface';

const router = express.Router();

// ============================================================
// ADMIN ROUTES - Specific routes MUST come before parameterized routes
// ============================================================

// Get all orders - Admin only
// GET /api/v1/orders/admin/all
router.get(
  '/admin/all',
  //   auth(UserRole.ADMIN),
  validateRequest(OrderValidation.getOrdersQueryValidationSchema),
  OrderController.getAllOrders,
);

// Get order statistics - Admin only
// GET /api/v1/orders/admin/stats
router.get(
  '/admin/stats',
  //   auth(UserRole.ADMIN),
  OrderController.getOrderStats,
);

// Bulk update order status - Admin only
// PATCH /api/v1/orders/admin/bulk-update
router.patch(
  '/admin/bulk-update',
  //   auth(UserRole.ADMIN),
  OrderController.bulkUpdateOrderStatus,
);

// Update order status - Admin only
// PATCH /api/v1/orders/admin/:orderId/status
router.patch(
  '/admin/:orderId/status',
  //   auth(UserRole.ADMIN),
  validateRequest(OrderValidation.updateOrderStatusValidationSchema),
  OrderController.updateOrderStatus,
);

// Assign carrier - Admin only
// PATCH /api/v1/orders/admin/:orderId/carrier
router.patch(
  '/admin/:orderId/carrier',
  //   auth(UserRole.ADMIN),
  validateRequest(OrderValidation.assignCarrierValidationSchema),
  OrderController.assignCarrier,
);

// Add manual tracking event - Admin only
// POST /api/v1/orders/admin/:orderId/tracking
router.post(
  '/admin/:orderId/tracking',
  //   auth(UserRole.ADMIN),
  validateRequest(OrderValidation.addTrackingEventValidationSchema),
  OrderController.addTrackingEvent,
);

// Update admin notes - Admin only
// PATCH /api/v1/orders/admin/:orderId/notes
router.patch(
  '/admin/:orderId/notes',
  //   auth(UserRole.ADMIN),
  validateRequest(OrderValidation.updateAdminNotesValidationSchema),
  OrderController.updateAdminNotes,
);

// Soft delete order - Admin only
// DELETE /api/v1/orders/admin/:orderId
router.delete(
  '/admin/:orderId',
  //   auth(UserRole.ADMIN),
  OrderController.deleteOrder,
);

// ============================================================
// USER ROUTES
// ============================================================

// Create new order - Authenticated users
// POST /api/v1/orders
router.post(
  '/',
  //   auth(UserRole.USER, UserRole.ADMIN),
  validateRequest(OrderValidation.createOrderValidationSchema),
  OrderController.createOrder,
);

// Get user's own orders - Authenticated users
// GET /api/v1/orders/my/:userId
router.get(
  '/my/:userId',
  //   auth(UserRole.USER, UserRole.ADMIN),
  validateRequest(OrderValidation.getOrdersQueryValidationSchema),
  OrderController.getUserOrders,
);

// Get order by payment intent - Auth required
// GET /api/v1/orders/by-payment/:paymentIntentId
router.get(
  '/by-payment/:paymentIntentId',
  //   auth(UserRole.USER, UserRole.ADMIN),
  OrderController.getOrderByPaymentIntent,
);

// Get single order by MongoDB _id
// GET /api/v1/orders/by-id/:id
router.get(
  '/by-id/:id',
  //   auth(UserRole.USER, UserRole.ADMIN),
  OrderController.getSingleOrderByMongoId,
);

// Sync tracking from carrier
// POST /api/v1/orders/:orderId/sync-tracking
router.post(
  '/:orderId/sync-tracking',
  //   auth(UserRole.USER, UserRole.ADMIN),
  OrderController.syncTracking,
);

// Cancel order - Auth required (user or admin)
// PATCH /api/v1/orders/:orderId/cancel
router.patch(
  '/:orderId/cancel',
  //   auth(UserRole.USER, UserRole.ADMIN),
  validateRequest(OrderValidation.cancelOrderValidationSchema),
  OrderController.cancelOrder,
);

// Get single order by orderId (e.g. ORD-12345-ABCD)
// GET /api/v1/orders/:orderId
// NOTE: এই route টি সবার শেষে থাকতে হবে কারণ :orderId prefix match করে
router.get(
  '/:orderId',
  //   auth(UserRole.USER, UserRole.ADMIN),
  OrderController.getSingleOrder,
);

export const OrderRoutes = router;
