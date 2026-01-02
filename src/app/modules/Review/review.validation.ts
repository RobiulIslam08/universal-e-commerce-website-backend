import { z } from 'zod';

const createReviewValidationSchema = z.object({
  body: z.object({
    productId: z.string().min(1, 'Product ID is required'),
    reviewerName: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name cannot exceed 100 characters'),
    reviewerEmail: z.string().email('Invalid email format').optional(),
    rating: z
      .number()
      .min(1, 'Rating must be at least 1')
      .max(5, 'Rating cannot exceed 5'),
    title: z
      .string()
      .min(3, 'Title must be at least 3 characters')
      .max(200, 'Title cannot exceed 200 characters')
      .optional(),
    comment: z
      .string()
      .min(10, 'Comment must be at least 10 characters')
      .max(1000, 'Comment cannot exceed 1000 characters'),
  }),
});

const updateReviewValidationSchema = z.object({
  body: z.object({
    reviewerName: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name cannot exceed 100 characters')
      .optional(),
    reviewerEmail: z.string().email('Invalid email format').optional(),
    rating: z
      .number()
      .min(1, 'Rating must be at least 1')
      .max(5, 'Rating cannot exceed 5')
      .optional(),
    title: z
      .string()
      .min(3, 'Title must be at least 3 characters')
      .max(200, 'Title cannot exceed 200 characters')
      .optional(),
    comment: z
      .string()
      .min(10, 'Comment must be at least 10 characters')
      .max(1000, 'Comment cannot exceed 1000 characters')
      .optional(),
    isApproved: z.boolean().optional(),
  }),
});

export const ReviewValidations = {
  createReviewValidationSchema,
  updateReviewValidationSchema,
};
