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
    category: { type: String, required: true },
    subCategory: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    strikePrice: { type: Number, default: 0, min: 0 },
    stockQuantity: { type: Number, required: true, min: 0 },
    sku: { type: String, required: true, unique: true, trim: true },
    shortDescription: { type: String, required: true },
    longDescription: { type: String, required: true },
    images: { type: [String], required: true },
    specifications: { type: [specificationSchema], default: [] },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
);

export const Product = model<TProduct>('Product', productSchema);
