/**
 * ============================================================
 * ORDER CONTROLLER
 * ============================================================
 * প্রতিটি HTTP request receive করে, service call করে,
 * এবং client কে response পাঠায়।
 *
 * User Routes:        POST /orders, GET /orders/my/:userId, etc.
 * Admin Routes:       GET /orders/admin/all, PATCH /orders/admin/:orderId, etc.
 * ============================================================
 */

import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { OrderService } from './order.service';
import { OrderStatus } from './order.interface';

// ============================================================
// CREATE ORDER
// POST /api/v1/orders
// User checkout করার পরে call হয়
// Payment service থেকেও call হতে পারে
// ============================================================
const createOrder = catchAsync(async (req, res) => {
  const result = await OrderService.createOrderIntoDB(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Order created successfully',
    data: result,
  });
});

// ============================================================
// GET SINGLE ORDER BY orderId (e.g. ORD-12345-ABCD)
// GET /api/v1/orders/:orderId
// User নিজের order আর admin যেকোনো order দেখতে পারবে
// ============================================================
const getSingleOrder = catchAsync(async (req, res) => {
  const { orderId } = req.params;
  const result = await OrderService.getSingleOrderFromDB(orderId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Order retrieved successfully',
    data: result,
  });
});

// ============================================================
// GET SINGLE ORDER BY MongoDB _id
// GET /api/v1/orders/by-id/:id
// Admin dashboard এ direct MongoDB ID দিয়ে access
// ============================================================
const getSingleOrderByMongoId = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await OrderService.getSingleOrderByMongoIdFromDB(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Order retrieved successfully',
    data: result,
  });
});

// ============================================================
// GET MY ORDERS (User's own orders)
// GET /api/v1/orders/my/:userId
// User তার নিজের সব অর্ডার দেখবে
// ============================================================
const getUserOrders = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const query = req.query;

  const result = await OrderService.getUserOrdersFromDB(userId, query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Orders retrieved successfully',
    data: result,
  });
});

// ============================================================
// GET ALL ORDERS (Admin Only)
// GET /api/v1/orders/admin/all
// Admin সব user এর সব অর্ডার দেখবে
// filters: status, paymentStatus, userId, date range, search
// ============================================================
const getAllOrders = catchAsync(async (req, res) => {
  const query = req.query;
  const result = await OrderService.getAllOrdersFromDB(query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'All orders retrieved successfully',
    data: result,
  });
});

// ============================================================
// UPDATE ORDER STATUS (Admin Only)
// PATCH /api/v1/orders/admin/:orderId/status
// Admin order এর status update করবে
// Body: { orderStatus, title?, description?, location?, carrier? }
// ============================================================
const updateOrderStatus = catchAsync(async (req, res) => {
  const { orderId } = req.params;
  const payload = req.body;

  // req.user থেকে admin এর userId নেওয়া (auth middleware set করে)
  const adminUserId = (req as any).user?.userId || 'admin';

  const result = await OrderService.updateOrderStatusIntoDB(
    orderId,
    payload,
    adminUserId,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `Order status updated to "${result.orderStatus}" successfully`,
    data: result,
  });
});

// ============================================================
// CANCEL ORDER (User ও Admin)
// PATCH /api/v1/orders/:orderId/cancel
// User: শুধু pending/confirmed orders
// Admin: delivered ও refunded ছাড়া সব
// ============================================================
const cancelOrder = catchAsync(async (req, res) => {
  const { orderId } = req.params;
  const { cancellationReason } = req.body;

  // req.user থেকে user info নেওয়া
  const user = (req as any).user;
  const isAdmin = user?.role === 'admin';
  const userId = user?.userId || 'user';

  const result = await OrderService.cancelOrderIntoDB(
    orderId,
    cancellationReason,
    userId,
    isAdmin,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Order cancelled successfully',
    data: result,
  });
});

// ============================================================
// ADD TRACKING EVENT (Admin Only)
// POST /api/v1/orders/admin/:orderId/tracking
// Admin manually কোনো tracking event যোগ করতে চাইলে
// ============================================================
const addTrackingEvent = catchAsync(async (req, res) => {
  const { orderId } = req.params;
  const adminUserId = (req as any).user?.userId || 'admin';

  const result = await OrderService.addTrackingEventIntoDB(
    orderId,
    req.body,
    adminUserId,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Tracking event added successfully',
    data: result,
  });
});

// ============================================================
// SYNC TRACKING FROM CARRIER
// POST /api/v1/orders/:orderId/sync-tracking
// Carrier API থেকে latest tracking info sync করা
// ============================================================
const syncTracking = catchAsync(async (req, res) => {
  const { orderId } = req.params;
  const result = await OrderService.syncTrackingFromCarrier(orderId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Tracking information synced successfully',
    data: result,
  });
});

// ============================================================
// ASSIGN CARRIER (Admin Only)
// PATCH /api/v1/orders/admin/:orderId/carrier
// Admin carrier assign করবে
// Body: { name, trackingNumber?, trackingUrl?, estimatedDelivery? }
// ============================================================
const assignCarrier = catchAsync(async (req, res) => {
  const { orderId } = req.params;
  const adminUserId = (req as any).user?.userId || 'admin';

  const result = await OrderService.assignCarrierIntoDB(
    orderId,
    req.body,
    adminUserId,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Carrier assigned successfully',
    data: result,
  });
});

// ============================================================
// UPDATE ADMIN NOTES (Admin Only)
// PATCH /api/v1/orders/admin/:orderId/notes
// Internal notes - শুধু admin দেখতে পাবে
// ============================================================
const updateAdminNotes = catchAsync(async (req, res) => {
  const { orderId } = req.params;
  const { adminNotes } = req.body;

  const result = await OrderService.updateAdminNotesIntoDB(orderId, adminNotes);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Admin notes updated successfully',
    data: result,
  });
});

// ============================================================
// GET ORDER STATISTICS (Admin Only)
// GET /api/v1/orders/admin/stats
// Dashboard summary: total orders, revenue, status breakdown, etc.
// ============================================================
const getOrderStats = catchAsync(async (req, res) => {
  const result = await OrderService.getOrderStatsFromDB();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Order statistics retrieved successfully',
    data: result,
  });
});

// ============================================================
// DELETE ORDER (SOFT DELETE) - Admin Only
// DELETE /api/v1/orders/admin/:orderId
// ============================================================
const deleteOrder = catchAsync(async (req, res) => {
  const { orderId } = req.params;
  const result = await OrderService.deleteOrderFromDB(orderId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Order deleted successfully',
    data: result,
  });
});

// ============================================================
// GET ORDER BY PAYMENT INTENT
// GET /api/v1/orders/by-payment/:paymentIntentId
// Payment success page এ order info দেখানোর জন্য
// ============================================================
const getOrderByPaymentIntent = catchAsync(async (req, res) => {
  const { paymentIntentId } = req.params;
  const result =
    await OrderService.getOrderByPaymentIntentFromDB(paymentIntentId);

  sendResponse(res, {
    statusCode: result ? httpStatus.OK : httpStatus.NOT_FOUND,
    success: !!result,
    message: result
      ? 'Order retrieved successfully'
      : 'No order found for this payment',
    data: result,
  });
});

// ============================================================
// BULK UPDATE ORDER STATUS (Admin Only)
// PATCH /api/v1/orders/admin/bulk-update
// Body: { orderIds: string[], orderStatus: OrderStatus }
// একসাথে অনেক orders এর status update করা
// ============================================================
const bulkUpdateOrderStatus = catchAsync(async (req, res) => {
  const { orderIds, orderStatus } = req.body;
  const adminUserId = (req as any).user?.userId || 'admin';

  if (!Array.isArray(orderIds) || orderIds.length === 0) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Please provide an array of order IDs',
      data: null,
    });
  }

  if (!Object.values(OrderStatus).includes(orderStatus)) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Invalid order status provided',
      data: null,
    });
  }

  const result = await OrderService.bulkUpdateOrderStatusIntoDB(
    orderIds,
    orderStatus,
    adminUserId,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `Bulk update complete: ${result.updated} updated, ${result.failed} failed`,
    data: result,
  });
});

// ============================================================
// EXPORT ALL CONTROLLERS
// ============================================================
export const OrderController = {
  createOrder,
  getSingleOrder,
  getSingleOrderByMongoId,
  getUserOrders,
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
  addTrackingEvent,
  syncTracking,
  assignCarrier,
  updateAdminNotes,
  getOrderStats,
  deleteOrder,
  getOrderByPaymentIntent,
  bulkUpdateOrderStatus,
};
