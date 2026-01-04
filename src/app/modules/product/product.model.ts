import { Schema, model } from 'mongoose';
import { TProduct, TSpecification } from './product.interface';

const specificationSchema = new Schema<TSpecification>(
  {
    key: { type: String, required: true },
    value: { type: String, required: true },
  },
  { _id: false },
);

const productSchema = new Schema<TProduct>(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true, lowercase: true, trim: true },
    subCategory: { type: String, required: true, lowercase: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    strikePrice: { type: Number, default: 0, min: 0 },
    stockQuantity: { type: Number, required: true, min: 0 },
    sku: { type: String, required: true, unique: true, trim: true },
    shortDescription: { type: String, required: true },
    longDescription: { type: String, required: true },
    images: { type: [String], required: true },
    specifications: { type: [specificationSchema], default: [] },
    tags: { type: [String], default: [] },
    brand: { type: String, trim: true },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
    soldCount: { type: Number, default: 0, min: 0 },
    isDeleted: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
);

// Indexes for better query performance
productSchema.index({ category: 1, isDeleted: 1 });
productSchema.index({ subCategory: 1, isDeleted: 1 });
productSchema.index({ category: 1, subCategory: 1, isDeleted: 1 });
productSchema.index({ isBestSeller: 1, soldCount: -1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ rating: -1 });
productSchema.index({ price: 1 });

export const Product = model<TProduct>('Product', productSchema);
