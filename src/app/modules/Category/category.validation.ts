import { z } from 'zod';

const createCategoryValidationSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Category name is required'),
    slug: z
      .string()
      .min(1, 'Category slug is required')
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        'Slug must be lowercase with hyphens only',
      ),
    description: z.string().optional(),
    image: z.string().url('Invalid image URL').optional(),
    parentCategory: z.string().nullable().optional(),
    level: z.number().int().min(0).optional(),
    isActive: z.boolean().optional().default(true),
    order: z.number().int().min(0).optional().default(0),
  }),
});

const updateCategoryValidationSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Category name is required').optional(),
    slug: z
      .string()
      .min(1, 'Category slug is required')
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        'Slug must be lowercase with hyphens only',
      )
      .optional(),
    description: z.string().optional(),
    image: z.string().url('Invalid image URL').optional(),
    parentCategory: z.string().nullable().optional(),
    isActive: z.boolean().optional(),
    order: z.number().int().min(0).optional(),
  }),
});

export const CategoryValidation = {
  createCategoryValidationSchema,
  updateCategoryValidationSchema,
};
