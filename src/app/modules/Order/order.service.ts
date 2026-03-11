/**
 * ============================================================
 * ORDER SERVICE
 * ============================================================
 * এই file টি সমস্ত order সম্পর্কিত business logic handle করে।
 *
 * Features:
 * - নতুন অর্ডার তৈরি (Create Order)
 * - User এর অর্ডার list দেখা
 * - Admin এর জন্য সব অর্ডার দেখা
 * - Order status update (Admin)
 * - Tracking timeline manage করা
 * - Carrier/Courier integration
 * - Email notification পাঠানো
 * - Order analytics/stats (Admin)
 * - Order cancel করা
 * ============================================================
 */

import httpStatus from 'http-status';
import mongoose, { Types } from 'mongoose';
import { Order, generateOrderId } from './order.model';
import {
  ICreateOrderDTO,
  IUpdateOrderStatusDTO,
  IOrderDocument,
  IOrderQuery,
  IOrderStats,
  OrderStatus,
  OrderPaymentStatus,
  ITrackingEvent,
  CarrierName,
} from './order.interface';
import AppError from '../../errors/AppError';
import {
  sendEmail,
  getOrderStatusUpdateEmailTemplate,
  getOrderCancelledEmailTemplate,
} from '../../utils/sendEmail';
import { courierService, SENDER_ADDRESS } from '../../utils/courierService';

// ============================================================
// AUTO-GENERATE TRACKING EVENT TITLES & DESCRIPTIONS
// Admin status দিলে এই function auto title/description তৈরি করবে
// যদি admin নিজে দেয়, তবে সেটাই ব্যবহার হবে
// ============================================================
const getDefaultTrackingContent = (
  status: OrderStatus,
): { title: string; description: string } => {
  const content: Record<OrderStatus, { title: string; description: string }> = {
    [OrderStatus.PENDING]: {
      title: 'Order Placed',
      description: 'Your order has been placed and is awaiting confirmation.',
    },
    [OrderStatus.CONFIRMED]: {
      title: 'Order Confirmed',
      description:
        "Great news! Your order has been confirmed. We're getting it ready for you.",
    },
    [OrderStatus.PROCESSING]: {
      title: 'Order Processing',
      description:
        "Your order is being packed at our warehouse. We'll notify you once it's shipped.",
    },
    [OrderStatus.SHIPPED]: {
      title: 'Order Shipped',
      description:
        'Your order is on its way! It has been handed over to the carrier.',
    },
    [OrderStatus.OUT_FOR_DELIVERY]: {
      title: 'Out for Delivery',
      description:
        'Your order is out for delivery. Our delivery partner will arrive soon!',
    },
    [OrderStatus.DELIVERED]: {
      title: 'Order Delivered',
      description:
        'Your order has been successfully delivered. Enjoy your purchase!',
    },
    [OrderStatus.CANCELLED]: {
      title: 'Order Cancelled',
      description: 'Your order has been cancelled.',
    },
    [OrderStatus.RETURNED]: {
      title: 'Return Initiated',
      description: 'A return has been initiated for your order.',
    },
    [OrderStatus.REFUNDED]: {
      title: 'Refund Processed',
      description:
        'Your refund has been processed. It should reflect in your account within 5-7 business days.',
    },
  };
  return (
    content[status] || {
      title: 'Status Updated',
      description: 'Your order status has been updated.',
    }
  );
};

// ============================================================
// CREATE NEW ORDER
// নতুন অর্ডার তৈরি করা (User checkout এর পরে call হয়)
// Payment service থেকে বা সরাসরি call করা যাবে
// ============================================================
const createOrderIntoDB = async (
  payload: ICreateOrderDTO,
): Promise<IOrderDocument> => {
  // ১. Human-readable unique Order ID তৈরি করা
  const orderId = generateOrderId();

  // ২. Initial tracking event তৈরি করা
  //    Order তৈরি হলেই প্রথম tracking entry যোগ হয়
  const initialStatus =
    payload.paymentStatus === OrderPaymentStatus.PAID
      ? OrderStatus.CONFIRMED // পেমেন্ট হলে সাথে সাথে confirmed
      : OrderStatus.PENDING; // COD বা pending payment

  const initialEvent = getDefaultTrackingContent(initialStatus);

  const initialTrackingEvent: ITrackingEvent = {
    status: initialStatus,
    title: initialEvent.title,
    description: initialEvent.description,
    timestamp: new Date(),
    updatedBy: 'system', // initial event system generate করে
    isVisible: true,
  };

  // ৩. Order document তৈরি করা
  const orderData = {
    orderId,
    userId: new Types.ObjectId(payload.userId),
    userEmail: payload.userEmail,
    userName: payload.userName,
    paymentIntentId: payload.paymentIntentId,
    paymentMethod: payload.paymentMethod,
    paymentStatus: payload.paymentStatus,
    items: payload.items,
    shippingAddress: payload.shippingAddress,
    orderStatus: initialStatus,
    subtotal: payload.subtotal,
    discountAmount: payload.discountAmount || 0,
    shippingCost: payload.shippingCost || 0,
    taxAmount: payload.taxAmount || 0,
    totalAmount: payload.totalAmount,
    currency: payload.currency || 'usd',
    customerNotes: payload.customerNotes,
    trackingHistory: [initialTrackingEvent], // প্রথম tracking event
    isDeleted: false,
  };

  // ৪. Database এ save করা
  const order = await Order.create(orderData);

  // ৫. Confirmation email পাঠানো (background এ, error হলে order block হবে না)
  try {
    const statusContent = getDefaultTrackingContent(initialStatus);
    const emailHtml = getOrderStatusUpdateEmailTemplate(
      order.userName,
      order.orderId,
      order.orderStatus,
      statusContent.title,
      statusContent.description,
      undefined, // trackingNumber - এখনও নেই
      undefined, // trackingUrl - এখনও নেই
      undefined, // estimatedDelivery - এখনও নেই
      order.items.map((item) => ({
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
      })),
      order.currency,
    );

    await sendEmail({
      to: order.userEmail,
      subject: `Order ${initialStatus === OrderStatus.CONFIRMED ? 'Confirmed' : 'Placed'} - ${order.orderId}`,
      html: emailHtml,
    });
  } catch (emailError) {
    // Email failure order creation block করবে না
    console.error('❌ Order confirmation email failed:', emailError);
  }

  return order;
};

// ============================================================
// GET SINGLE ORDER BY orderId (Human-readable ID)
// User ও Admin দুজনে দেখতে পারবে
// ============================================================
const getSingleOrderFromDB = async (
  orderId: string,
): Promise<IOrderDocument> => {
  const order = await Order.findOne({ orderId, isDeleted: false });

  if (!order) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      `Order with ID "${orderId}" not found`,
    );
  }

  return order;
};

// ============================================================
// GET SINGLE ORDER BY MongoDB _id
// Admin dashboard এ direct ID দিয়ে access এর জন্য
// ============================================================
const getSingleOrderByMongoIdFromDB = async (
  id: string,
): Promise<IOrderDocument> => {
  // Valid MongoDB ObjectId কিনা check করা
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid order ID format');
  }

  const order = await Order.findById(id);

  if (!order) {
    throw new AppError(httpStatus.NOT_FOUND, 'Order not found');
  }

  return order;
};

// ============================================================
// GET USER'S ORDERS (My Orders)
// Logged-in user তার নিজের সকল অর্ডার দেখতে পারবে
// ============================================================
const getUserOrdersFromDB = async (
  userId: string,
  query: IOrderQuery,
): Promise<{
  orders: IOrderDocument[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> => {
  // Valid MongoDB ObjectId কিনা check করা
  if (!Types.ObjectId.isValid(userId)) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid user ID format');
  }

  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));
  const skip = (page - 1) * limit;

  // Filter build করা
  const filter: Record<string, unknown> = {
    userId: new Types.ObjectId(userId),
    isDeleted: false,
  };

  // Status filter
  if (query.status) {
    filter.orderStatus = query.status;
  }

  // Payment status filter
  if (query.paymentStatus) {
    filter.paymentStatus = query.paymentStatus;
  }

  // Date range filter
  if (query.startDate || query.endDate) {
    const dateFilter: Record<string, Date> = {};
    if (query.startDate) dateFilter.$gte = new Date(query.startDate);
    if (query.endDate) dateFilter.$lte = new Date(query.endDate);
    filter.createdAt = dateFilter;
  }

  // Sort build করা
  const sortField = query.sortBy || 'createdAt';
  const sortDirection = query.sortOrder === 'asc' ? 1 : -1;
  const sort: Record<string, 1 | -1> = { [sortField]: sortDirection };

  // একসাথে count ও data query করা (performance optimization)
  const [orders, total] = await Promise.all([
    Order.find(filter).sort(sort).skip(skip).limit(limit),
    Order.countDocuments(filter),
  ]);

  return {
    orders,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

// ============================================================
// GET ALL ORDERS (Admin Only)
// Admin সকল user এর সব অর্ডার দেখতে পারবে
// filters, search, pagination সব support করে
// ============================================================
const getAllOrdersFromDB = async (
  query: IOrderQuery,
): Promise<{
  orders: IOrderDocument[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  const skip = (page - 1) * limit;

  // Filter build করা
  const filter: Record<string, unknown> = { isDeleted: false };

  // Status filter
  if (query.status) filter.orderStatus = query.status;

  // Payment status filter
  if (query.paymentStatus) filter.paymentStatus = query.paymentStatus;

  // Payment method filter
  if (query.paymentMethod) filter.paymentMethod = query.paymentMethod;

  // Specific user filter
  if (query.userId) {
    if (!Types.ObjectId.isValid(query.userId)) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Invalid userId format');
    }
    filter.userId = new Types.ObjectId(query.userId);
  }

  // Date range filter
  if (query.startDate || query.endDate) {
    const dateFilter: Record<string, Date> = {};
    if (query.startDate) dateFilter.$gte = new Date(query.startDate);
    if (query.endDate) {
      // endDate কে সেই দিনের শেষ পর্যন্ত করা
      const end = new Date(query.endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.$lte = end;
    }
    filter.createdAt = dateFilter;
  }

  // Text search - orderId, userName, userEmail দিয়ে search
  if (query.searchTerm) {
    const searchRegex = new RegExp(query.searchTerm, 'i');
    filter.$or = [
      { orderId: searchRegex },
      { userName: searchRegex },
      { userEmail: searchRegex },
      { 'shippingAddress.phone': searchRegex },
    ];
  }

  // Sort
  const sortField = query.sortBy || 'createdAt';
  const sortDirection = query.sortOrder === 'asc' ? 1 : -1;
  const sort: Record<string, 1 | -1> = { [sortField]: sortDirection };

  const [orders, total] = await Promise.all([
    Order.find(filter).sort(sort).skip(skip).limit(limit),
    Order.countDocuments(filter),
  ]);

  return {
    orders,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

// ============================================================
// UPDATE ORDER STATUS (Admin Only)
// ============================================================
// এটি সবচেয়ে গুরুত্বপূর্ণ function:
// - Order status update করে
// - Tracking history তে নতুন event যোগ করে
// - Carrier info update করে (shipped হলে)
// - Customer কে email notification দেয়
// - Carrier API call দেয় (auto shipment create)
// ============================================================
const updateOrderStatusIntoDB = async (
  orderId: string,
  payload: IUpdateOrderStatusDTO,
  adminUserId: string,
): Promise<IOrderDocument> => {
  // ১. Order খোঁজা
  const order = await Order.findOne({ orderId, isDeleted: false });
  if (!order) {
    throw new AppError(httpStatus.NOT_FOUND, `Order "${orderId}" not found`);
  }

  // ২. Status transition validation
  // কিছু status থেকে কিছু status এ যাওয়া allowed না
  // যেমন: delivered থেকে processing এ যাওয়া যাবে না
  validateStatusTransition(order.orderStatus, payload.orderStatus);

  // ৩. Tracking event content তৈরি করা
  const defaultContent = getDefaultTrackingContent(payload.orderStatus);
  const trackingEvent: ITrackingEvent = {
    status: payload.orderStatus,
    title: payload.title || defaultContent.title,
    description: payload.description || defaultContent.description,
    location: payload.location,
    timestamp: new Date(),
    updatedBy: adminUserId, // কোন admin update দিয়েছে
    isVisible: payload.isVisible !== undefined ? payload.isVisible : true,
  };

  // ৪. Update object তৈরি করা
  const updateData: Record<string, unknown> = {
    orderStatus: payload.orderStatus,
    $push: { trackingHistory: trackingEvent }, // tracking history তে append করা
  };

  // Admin notes থাকলে update করা
  if (payload.adminNotes) {
    updateData.adminNotes = payload.adminNotes;
  }

  // ৫. SHIPPED status হলে Carrier info save করা
  if (payload.orderStatus === OrderStatus.SHIPPED) {
    const carrierInfo = payload.carrier;

    // Local/Self delivery কিনা check করা
    const isLocalDelivery =
      !carrierInfo ||
      carrierInfo.name === CarrierName.LOCAL ||
      carrierInfo.name === CarrierName.SELF_DELIVERY;

    if (isLocalDelivery) {
      // ====================================================
      // LOCAL / SELF DELIVERY
      // Admin নিজে বা নিজের লোক দিয়ে product পাঠাচ্ছে
      // কোনো third-party courier API call লাগবে না
      // ====================================================
      updateData['carrier'] = {
        name: carrierInfo?.name || CarrierName.SELF_DELIVERY,
        trackingNumber: carrierInfo?.trackingNumber || `LOCAL-${order.orderId}`,
        trackingUrl: carrierInfo?.trackingUrl || undefined,
        estimatedDelivery: carrierInfo?.estimatedDelivery
          ? new Date(carrierInfo.estimatedDelivery)
          : undefined,
        shippedAt: new Date(),
      };
    } else {
      // ====================================================
      // THIRD-PARTY CARRIER (DHL, FedEx, UPS, etc.)
      // Carrier API তে shipment তৈরি করার চেষ্টা
      // ====================================================
      const shipmentResult = await courierService.createShipment({
        orderId: order.orderId,
        carrierName: carrierInfo.name,
        senderAddress: SENDER_ADDRESS,
        receiverAddress: order.shippingAddress,
        items: order.items,
        totalWeight: 0.5,
      });

      if (shipmentResult.success) {
        updateData['carrier'] = {
          name: carrierInfo.name,
          trackingNumber:
            carrierInfo.trackingNumber || shipmentResult.trackingNumber,
          trackingUrl: carrierInfo.trackingUrl || shipmentResult.trackingUrl,
          estimatedDelivery: carrierInfo.estimatedDelivery
            ? new Date(carrierInfo.estimatedDelivery)
            : shipmentResult.estimatedDelivery,
          shippedAt: new Date(),
          shipmentId: shipmentResult.shipmentId,
          labelUrl: shipmentResult.labelUrl,
        };
      } else {
        console.warn('⚠️ Carrier API failed, using admin provided info');
        updateData['carrier'] = {
          name: carrierInfo.name,
          trackingNumber:
            carrierInfo.trackingNumber || `MANUAL-${order.orderId}`,
          trackingUrl: carrierInfo.trackingUrl || undefined,
          estimatedDelivery: carrierInfo.estimatedDelivery
            ? new Date(carrierInfo.estimatedDelivery)
            : undefined,
          shippedAt: new Date(),
        };
      }
    }
  }

  // ৬. DELIVERED status হলে actual delivery date set করা
  if (payload.orderStatus === OrderStatus.DELIVERED) {
    updateData['carrier.actualDelivery'] = new Date();
    // Payment status কেও paid করে দেওয়া (COD এর ক্ষেত্রে)
    if (order.paymentMethod === 'cod') {
      updateData.paymentStatus = OrderPaymentStatus.PAID;
    }
    // যদি carrier info আগে set না থাকে (direct delivered করেছে local ভাবে)
    if (!order.carrier?.name) {
      updateData['carrier'] = {
        name: CarrierName.SELF_DELIVERY,
        trackingNumber: `LOCAL-${order.orderId}`,
        shippedAt: new Date(),
        actualDelivery: new Date(),
      };
    }
  }

  // ৭. CANCELLED status হলে additional info সংরক্ষণ
  if (payload.orderStatus === OrderStatus.CANCELLED) {
    updateData.cancelledAt = new Date();
    updateData.cancelledBy = adminUserId;
    // Carrier shipment cancel করার চেষ্টা (শুধু third-party carrier হলে)
    const isThirdPartyCarrier =
      order.carrier?.shipmentId &&
      order.carrier.name !== CarrierName.LOCAL &&
      order.carrier.name !== CarrierName.SELF_DELIVERY;
    if (isThirdPartyCarrier) {
      await courierService
        .cancelShipment(order.carrier!.name, order.carrier!.shipmentId!)
        .catch((err) => console.error('Carrier cancel failed:', err));
    }
  }

  // ৮. Database update করা
  const updatedOrder = await Order.findOneAndUpdate(
    { orderId, isDeleted: false },
    updateData,
    { new: true, runValidators: true },
  );

  if (!updatedOrder) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to update order',
    );
  }

  // ৯. Customer কে email notification পাঠানো (background এ)
  try {
    const emailHtml = getOrderStatusUpdateEmailTemplate(
      updatedOrder.userName,
      updatedOrder.orderId,
      updatedOrder.orderStatus,
      trackingEvent.title,
      trackingEvent.description,
      updatedOrder.carrier?.trackingNumber,
      updatedOrder.carrier?.trackingUrl,
      updatedOrder.carrier?.estimatedDelivery,
      undefined, // items - order update email এ না দেখালেও চলে
      updatedOrder.currency,
    );

    await sendEmail({
      to: updatedOrder.userEmail,
      subject: `${trackingEvent.title} - Order #${updatedOrder.orderId}`,
      html: emailHtml,
    });
  } catch (emailError) {
    console.error('❌ Status update email failed:', emailError);
    // Email fail হলে order update block হবে না
  }

  return updatedOrder;
};

// ============================================================
// STATUS TRANSITION VALIDATOR
// কোন status থেকে কোন status এ যাওয়া valid সেটা check করা
// ============================================================
const validateStatusTransition = (
  currentStatus: OrderStatus,
  newStatus: OrderStatus,
): void => {
  // এই transitions অনুমোদিত নয়
  const invalidTransitions: Partial<Record<OrderStatus, OrderStatus[]>> = {
    // Delivered হলে আর কোন status এ যাওয়া যাবে না (refunded ছাড়া)
    [OrderStatus.DELIVERED]: [
      OrderStatus.PENDING,
      OrderStatus.CONFIRMED,
      OrderStatus.PROCESSING,
      OrderStatus.SHIPPED,
      OrderStatus.OUT_FOR_DELIVERY,
    ],
    // Cancelled থেকে active status এ যাওয়া যাবে না
    [OrderStatus.CANCELLED]: [
      OrderStatus.PENDING,
      OrderStatus.CONFIRMED,
      OrderStatus.PROCESSING,
      OrderStatus.SHIPPED,
      OrderStatus.OUT_FOR_DELIVERY,
      OrderStatus.DELIVERED,
    ],
    // Refunded থেকে active status এ যাওয়া যাবে না
    [OrderStatus.REFUNDED]: [
      OrderStatus.PENDING,
      OrderStatus.CONFIRMED,
      OrderStatus.PROCESSING,
      OrderStatus.SHIPPED,
      OrderStatus.OUT_FOR_DELIVERY,
      OrderStatus.DELIVERED,
    ],
  };

  const forbidden = invalidTransitions[currentStatus];
  if (forbidden && forbidden.includes(newStatus)) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Cannot change order status from "${currentStatus}" to "${newStatus}"`,
    );
  }
};

// ============================================================
// CANCEL ORDER (User ও Admin উভয়েই করতে পারবে)
// User শুধু pending/confirmed status এ cancel করতে পারবে
// Admin যেকোনো status (delivered বাদে) cancel করতে পারবে
// ============================================================
const cancelOrderIntoDB = async (
  orderId: string,
  cancellationReason: string,
  cancelledBy: string, // userId
  isAdmin: boolean = false,
): Promise<IOrderDocument> => {
  // ১. Order খোঁজা
  const order = await Order.findOne({ orderId, isDeleted: false });
  if (!order) {
    throw new AppError(httpStatus.NOT_FOUND, `Order "${orderId}" not found`);
  }

  // ২. Permission check
  if (!isAdmin) {
    // User শুধু pending বা confirmed status এ cancel করতে পারবে
    const allowedStatuses = [OrderStatus.PENDING, OrderStatus.CONFIRMED];
    if (!allowedStatuses.includes(order.orderStatus)) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `You can only cancel orders in "pending" or "confirmed" status. Current status: "${order.orderStatus}"`,
      );
    }
  } else {
    // Admin delivered ও refunded orders cancel করতে পারবে না
    const notAllowedForAdmin = [OrderStatus.DELIVERED, OrderStatus.REFUNDED];
    if (notAllowedForAdmin.includes(order.orderStatus)) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Cannot cancel an order that is already "${order.orderStatus}"`,
      );
    }
  }

  // ৩. Tracking event তৈরি করা
  const trackingEvent: ITrackingEvent = {
    status: OrderStatus.CANCELLED,
    title: 'Order Cancelled',
    description: `Order cancelled. Reason: ${cancellationReason}`,
    timestamp: new Date(),
    updatedBy: cancelledBy,
    isVisible: true,
  };

  // ৪. Database update
  const updatedOrder = await Order.findOneAndUpdate(
    { orderId, isDeleted: false },
    {
      orderStatus: OrderStatus.CANCELLED,
      cancellationReason,
      cancelledAt: new Date(),
      cancelledBy,
      $push: { trackingHistory: trackingEvent },
    },
    { new: true },
  );

  if (!updatedOrder) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to cancel order',
    );
  }

  // ৫. Carrier shipment cancel করার চেষ্টা
  if (updatedOrder.carrier?.shipmentId) {
    await courierService
      .cancelShipment(
        updatedOrder.carrier.name,
        updatedOrder.carrier.shipmentId,
      )
      .catch((err) => console.error('Carrier cancel failed:', err));
  }

  // ৬. Cancellation email পাঠানো
  try {
    const emailHtml = getOrderCancelledEmailTemplate(
      updatedOrder.userName,
      updatedOrder.orderId,
      cancellationReason,
      updatedOrder.totalAmount,
      updatedOrder.currency,
      updatedOrder.paymentMethod,
    );

    await sendEmail({
      to: updatedOrder.userEmail,
      subject: `Order Cancelled - #${updatedOrder.orderId}`,
      html: emailHtml,
    });
  } catch (emailError) {
    console.error('❌ Cancellation email failed:', emailError);
  }

  return updatedOrder;
};

// ============================================================
// ADD MANUAL TRACKING EVENT (Admin Only)
// Admin manually কোনো tracking event যোগ করতে চাইলে
// যেমন: "Package arrived at sorting facility"
// ============================================================
const addTrackingEventIntoDB = async (
  orderId: string,
  event: {
    status: OrderStatus;
    title: string;
    description: string;
    location?: string;
    isVisible?: boolean;
  },
  adminUserId: string,
): Promise<IOrderDocument> => {
  const order = await Order.findOne({ orderId, isDeleted: false });
  if (!order) {
    throw new AppError(httpStatus.NOT_FOUND, `Order "${orderId}" not found`);
  }

  const trackingEvent: ITrackingEvent = {
    status: event.status,
    title: event.title,
    description: event.description,
    location: event.location,
    timestamp: new Date(),
    updatedBy: adminUserId,
    isVisible: event.isVisible !== undefined ? event.isVisible : true,
  };

  // Tracking history তে নতুন event যোগ করা
  const updatedOrder = await Order.findOneAndUpdate(
    { orderId, isDeleted: false },
    { $push: { trackingHistory: trackingEvent } },
    { new: true },
  );

  if (!updatedOrder) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to add tracking event',
    );
  }

  return updatedOrder;
};

// ============================================================
// SYNC TRACKING FROM CARRIER API
// Carrier API থেকে latest tracking info sync করা
// User "Refresh" করলে বা scheduled job এ call হবে
// ============================================================
const syncTrackingFromCarrier = async (
  orderId: string,
): Promise<IOrderDocument> => {
  const order = await Order.findOne({ orderId, isDeleted: false });
  if (!order) {
    throw new AppError(httpStatus.NOT_FOUND, `Order "${orderId}" not found`);
  }

  // Carrier info না থাকলে sync করার কিছু নেই
  if (!order.carrier?.trackingNumber) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'No tracking number found. Order might not have been shipped yet.',
    );
  }

  // Carrier API থেকে latest status আনা
  const trackingData = await courierService.getTrackingInfo(
    order.carrier.name,
    order.carrier.trackingNumber,
  );

  if (!trackingData.success) {
    throw new AppError(
      httpStatus.SERVICE_UNAVAILABLE,
      `Failed to get tracking info from carrier: ${trackingData.message}`,
    );
  }

  // Carrier থেকে পাওয়া events গুলো database এ already আছে কিনা check করা
  // এবং নতুন events গুলো add করা
  const newEvents: ITrackingEvent[] = trackingData.events
    .filter((event) => {
      // Check if this event already exists (by timestamp)
      return !order.trackingHistory.some(
        (existing) =>
          Math.abs(existing.timestamp.getTime() - event.timestamp.getTime()) <
          60000, // 1 minute window
      );
    })
    .map((event) => ({
      status: order.orderStatus, // Current status ব্যবহার করা
      title: event.status.replace(/_/g, ' '),
      description: event.description,
      location: event.location,
      timestamp: event.timestamp,
      updatedBy: 'courier_api', // Carrier API থেকে এসেছে
      isVisible: true,
    }));

  const updateData: Record<string, unknown> = {};

  // নতুন events থাকলে যোগ করা
  if (newEvents.length > 0) {
    updateData.$push = { trackingHistory: { $each: newEvents } };
  }

  // Estimated delivery update করা
  if (trackingData.estimatedDelivery) {
    updateData['carrier.estimatedDelivery'] = trackingData.estimatedDelivery;
  }

  // Current location update করা
  if (trackingData.currentLocation) {
    updateData['carrier.currentLocation'] = trackingData.currentLocation;
  }

  const updatedOrder = await Order.findOneAndUpdate(
    { orderId, isDeleted: false },
    Object.keys(updateData).length > 0 ? updateData : { updatedAt: new Date() },
    { new: true },
  );

  return updatedOrder || order;
};

// ============================================================
// ASSIGN CARRIER (Admin Only)
// Admin manually carrier assign করতে চাইলে
// ============================================================
const assignCarrierIntoDB = async (
  orderId: string,
  carrierData: {
    name: string;
    trackingNumber?: string;
    trackingUrl?: string;
    estimatedDelivery?: string;
  },
  adminUserId: string,
): Promise<IOrderDocument> => {
  const order = await Order.findOne({ orderId, isDeleted: false });
  if (!order) {
    throw new AppError(httpStatus.NOT_FOUND, `Order "${orderId}" not found`);
  }

  // Order এর status check - cancelled/refunded/delivered orders এ carrier assign করা যাবে না
  const disallowedStatuses = [
    OrderStatus.DELIVERED,
    OrderStatus.CANCELLED,
    OrderStatus.RETURNED,
    OrderStatus.REFUNDED,
  ];
  if (disallowedStatuses.includes(order.orderStatus)) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Carrier cannot be assigned to orders in "${order.orderStatus}" status`,
    );
  }

  const carrierInfo = {
    name: carrierData.name,
    trackingNumber: carrierData.trackingNumber,
    trackingUrl: carrierData.trackingUrl,
    estimatedDelivery: carrierData.estimatedDelivery
      ? new Date(carrierData.estimatedDelivery)
      : undefined,
    shippedAt: new Date(),
  };

  // Tracking event যোগ করা
  const trackingEvent: ITrackingEvent = {
    status: order.orderStatus,
    title: 'Carrier Assigned',
    description: `Your order has been assigned to ${carrierData.name}${carrierData.trackingNumber ? `. Tracking: ${carrierData.trackingNumber}` : ''}`,
    timestamp: new Date(),
    updatedBy: adminUserId,
    isVisible: true,
  };

  const updatedOrder = await Order.findOneAndUpdate(
    { orderId, isDeleted: false },
    {
      carrier: carrierInfo,
      $push: { trackingHistory: trackingEvent },
    },
    { new: true },
  );

  if (!updatedOrder) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to assign carrier',
    );
  }

  // Customer কে notification দেওয়া
  try {
    const emailHtml = getOrderStatusUpdateEmailTemplate(
      updatedOrder.userName,
      updatedOrder.orderId,
      updatedOrder.orderStatus,
      'Carrier Assigned',
      `Your order has been assigned to ${carrierData.name} for delivery.`,
      carrierData.trackingNumber,
      carrierData.trackingUrl,
      carrierInfo.estimatedDelivery,
    );

    await sendEmail({
      to: updatedOrder.userEmail,
      subject: `Carrier Assigned - Order #${updatedOrder.orderId}`,
      html: emailHtml,
    });
  } catch (err) {
    console.error('❌ Carrier assignment email failed:', err);
  }

  return updatedOrder;
};

// ============================================================
// UPDATE ADMIN NOTES (Admin Only)
// Internal notes - user দেখতে পাবে না
// ============================================================
const updateAdminNotesIntoDB = async (
  orderId: string,
  adminNotes: string,
): Promise<IOrderDocument> => {
  const updatedOrder = await Order.findOneAndUpdate(
    { orderId, isDeleted: false },
    { adminNotes },
    { new: true },
  );

  if (!updatedOrder) {
    throw new AppError(httpStatus.NOT_FOUND, `Order "${orderId}" not found`);
  }

  return updatedOrder;
};

// ============================================================
// GET ORDER STATISTICS (Admin Only)
// Dashboard এর জন্য summary statistics
// ============================================================
const getOrderStatsFromDB = async (): Promise<IOrderStats> => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Aggregation pipeline দিয়ে একবারে সব statistics বের করা
  const [stats] = await Order.aggregate([
    { $match: { isDeleted: false } },
    {
      $group: {
        _id: null,
        // মোট অর্ডার সংখ্যা
        totalOrders: { $sum: 1 },
        // মোট revenue (delivered orders)
        totalRevenue: {
          $sum: {
            $cond: [
              { $eq: ['$orderStatus', OrderStatus.DELIVERED] },
              '$totalAmount',
              0,
            ],
          },
        },
        // আজকের অর্ডার
        todayOrders: {
          $sum: {
            $cond: [{ $gte: ['$createdAt', startOfDay] }, 1, 0],
          },
        },
        // আজকের revenue
        todayRevenue: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $gte: ['$createdAt', startOfDay] },
                  { $eq: ['$orderStatus', OrderStatus.DELIVERED] },
                ],
              },
              '$totalAmount',
              0,
            ],
          },
        },
        // এই মাসের অর্ডার
        monthlyOrders: {
          $sum: {
            $cond: [{ $gte: ['$createdAt', startOfMonth] }, 1, 0],
          },
        },
        // এই মাসের revenue
        monthlyRevenue: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $gte: ['$createdAt', startOfMonth] },
                  { $eq: ['$orderStatus', OrderStatus.DELIVERED] },
                ],
              },
              '$totalAmount',
              0,
            ],
          },
        },
        // Average order value
        averageOrderValue: { $avg: '$totalAmount' },
      },
    },
  ]);

  // Status অনুযায়ী count
  const statusCounts = await Order.aggregate([
    { $match: { isDeleted: false } },
    { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
  ]);

  // Status counts কে object এ convert করা
  const ordersByStatus = Object.values(OrderStatus).reduce(
    (acc, status) => {
      acc[status] = 0;
      return acc;
    },
    {} as Record<OrderStatus, number>,
  );

  statusCounts.forEach((item) => {
    if (item._id) {
      ordersByStatus[item._id as OrderStatus] = item.count;
    }
  });

  return {
    totalOrders: stats?.totalOrders || 0,
    totalRevenue: stats?.totalRevenue || 0,
    ordersByStatus,
    todayOrders: stats?.todayOrders || 0,
    todayRevenue: stats?.todayRevenue || 0,
    monthlyOrders: stats?.monthlyOrders || 0,
    monthlyRevenue: stats?.monthlyRevenue || 0,
    averageOrderValue: parseFloat((stats?.averageOrderValue || 0).toFixed(2)),
  };
};

// ============================================================
// SOFT DELETE ORDER (Admin Only)
// Order টি database থেকে delete না করে isDeleted: true করা
// পরে audit trail এর জন্য রাখা হয়
// ============================================================
const deleteOrderFromDB = async (orderId: string): Promise<IOrderDocument> => {
  const order = await Order.findOne({ orderId, isDeleted: false });
  if (!order) {
    throw new AppError(httpStatus.NOT_FOUND, `Order "${orderId}" not found`);
  }

  const updatedOrder = await Order.findOneAndUpdate(
    { orderId },
    { isDeleted: true },
    { new: true },
  );

  return updatedOrder!;
};

// ============================================================
// GET ORDER BY PAYMENT INTENT ID
// Payment confirmation এর পরে order খোঁজার জন্য
// (Frontend payment success page এ use করবে)
// ============================================================
const getOrderByPaymentIntentFromDB = async (
  paymentIntentId: string,
): Promise<IOrderDocument | null> => {
  return Order.findOne({ paymentIntentId, isDeleted: false });
};

// ============================================================
// BULK UPDATE ORDER STATUS (Admin Only)
// একসাথে অনেক orders এর status update করা
// ============================================================
const bulkUpdateOrderStatusIntoDB = async (
  orderIds: string[],
  newStatus: OrderStatus,
  adminUserId: string,
): Promise<{ updated: number; failed: number; errors: string[] }> => {
  let updated = 0;
  let failed = 0;
  const errors: string[] = [];

  // প্রতিটি order আলাদাভাবে update করা (validation এর জন্য)
  for (const orderId of orderIds) {
    try {
      await updateOrderStatusIntoDB(
        orderId,
        { orderStatus: newStatus },
        adminUserId,
      );
      updated++;
    } catch (error) {
      failed++;
      errors.push(`${orderId}: ${(error as Error).message}`);
    }
  }

  return { updated, failed, errors };
};

// ============================================================
// EXPORT ALL SERVICE FUNCTIONS
// ============================================================
export const OrderService = {
  createOrderIntoDB,
  getSingleOrderFromDB,
  getSingleOrderByMongoIdFromDB,
  getUserOrdersFromDB,
  getAllOrdersFromDB,
  updateOrderStatusIntoDB,
  cancelOrderIntoDB,
  addTrackingEventIntoDB,
  syncTrackingFromCarrier,
  assignCarrierIntoDB,
  updateAdminNotesIntoDB,
  getOrderStatsFromDB,
  deleteOrderFromDB,
  getOrderByPaymentIntentFromDB,
  bulkUpdateOrderStatusIntoDB,
};
