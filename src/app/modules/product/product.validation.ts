import { z } from 'zod';

const specificationValidationSchema = z.object({
  key: z.string().min(1, 'Specification key is required'),
  value: z.string().min(1, 'Specification value is required'),
});

const createProductValidationSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    category: z.string().min(1, 'Category is required'),
    subCategory: z.string().min(1, 'Sub-category is required'),
    price: z.number().min(0.01, 'Price must be greater than 0'),
    strikePrice: z
      .number()
      .min(0, 'Strike price cannot be negative')
      .optional()
      .default(0),
    stockQuantity: z.number().int().min(0, 'Stock quantity cannot be negative'),
    sku: z
      .string()
      .min(1, 'SKU is required')
      .regex(
        /^[A-Z0-9-]+$/,
        'SKU must contain only uppercase letters, numbers, and hyphens',
      ),
    shortDescription: z
      .string()
      .min(10, 'Short description must be at least 10 characters'),
    longDescription: z
      .string()
      .min(20, 'Long description must be at least 20 characters'),
    images: z
      .array(z.string())
      .min(1, 'At least one image is required')
      .optional(),
    specifications: z.array(specificationValidationSchema).optional(),
  }),
});

export const ProductValidation = {
  createProductValidationSchema,
};
