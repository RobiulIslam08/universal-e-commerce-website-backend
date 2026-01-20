import { Schema, model } from 'mongoose';
import {
  IContactDocument,
  IContactModel,
  ContactStatus,
} from './contact.interface';

const contactSchema = new Schema<IContactDocument, IContactModel>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      maxlength: [200, 'Subject cannot exceed 200 characters'],
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },
    status: {
      type: String,
      enum: Object.values(ContactStatus),
      default: ContactStatus.NEW,
    },
    adminReply: {
      type: String,
      trim: true,
    },
    adminRepliedAt: {
      type: Date,
    },
    adminRepliedBy: {
      type: String,
      trim: true,
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
    },
  },
);

// Query Middleware: Filter out soft-deleted documents
contactSchema.pre('find', function (next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

contactSchema.pre('findOne', function (next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

contactSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { isDeleted: { $ne: true } } });
  next();
});

// Static Method: Check if contact exists
contactSchema.statics.isContactExists = async function (id: string) {
  return await this.findById(id);
};

// Indexes for better query performance
contactSchema.index({ email: 1 });
contactSchema.index({ status: 1 });
contactSchema.index({ createdAt: -1 });
contactSchema.index({ name: 'text', subject: 'text', message: 'text' });

export const Contact = model<IContactDocument, IContactModel>(
  'Contact',
  contactSchema,
);
