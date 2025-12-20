import { Schema, model } from 'mongoose';
import {
  IPayment,
  IPaymentDocument,
  IPaymentModel,
  PaymentStatus,
  IPaymentItem,
  IShippingAddress,
} from './payment.interface';

// Payment Item Sub-Schema
const paymentItemSchema = new Schema<IPaymentItem>(
  {
    productId: {
      type: String,
      required: [true, 'Product ID is required'],
    },
    productName: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price must be a positive number'],
    },
    image: {
      type: String,
      trim: true,
    },
  },
  { _id: false },
);

// Shipping Address Sub-Schema
const shippingAddressSchema = new Schema<IShippingAddress>(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
    },
    zipCode: {
      type: String,
      required: [true, 'ZIP code is required'],
      trim: true,
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
      default: 'US',
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
  },
  { _id: false },
);

// Main Payment Schema
const paymentSchema = new Schema<IPaymentDocument, IPaymentModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    userEmail: {
      type: String,
      required: [true, 'User email is required'],
      lowercase: true,
      trim: true,
      index: true,
    },
    userName: {
      type: String,
      required: [true, 'User name is required'],
      trim: true,
    },
    paymentIntentId: {
      type: String,
      required: [true, 'Payment intent ID is required'],
      unique: true,
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount must be a positive number'],
    },
    currency: {
      type: String,
      default: 'usd',
      uppercase: true,
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
      index: true,
    },
    paymentMethod: {
      type: String,
      trim: true,
    },
    items: {
      type: [paymentItemSchema],
      required: [true, 'Payment items are required'],
      validate: {
        validator: function (items: IPaymentItem[]) {
          return items && items.length > 0;
        },
        message: 'At least one item is required',
      },
    },
    shippingAddress: {
      type: shippingAddressSchema,
    },
    stripeCustomerId: {
      type: String,
      trim: true,
    },
    receiptUrl: {
      type: String,
      trim: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { __v, ...rest } = ret;
        return rest;
      },
    },
    toObject: {
      virtuals: true,
    },
  },
);

// Indexes for better query performance
paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ userEmail: 1, createdAt: -1 });

// Query Middleware - Exclude deleted documents
paymentSchema.pre('find', function (next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

paymentSchema.pre('findOne', function (next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

paymentSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { isDeleted: { $ne: true } } });
  next();
});

// Static Methods
paymentSchema.statics.isPaymentExists = async function (
  paymentIntentId: string,
): Promise<IPaymentDocument | null> {
  return await this.findOne({ paymentIntentId, isDeleted: false });
};

// Virtual for order ID (shortened payment intent ID)
paymentSchema.virtual('orderId').get(function () {
  return this.paymentIntentId.substring(0, 15).toUpperCase();
});

// Virtual for total items count
paymentSchema.virtual('totalItems').get(function () {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

// Export the model
export const Payment = model<IPaymentDocument, IPaymentModel>(
  'Payment',
  paymentSchema,
);
