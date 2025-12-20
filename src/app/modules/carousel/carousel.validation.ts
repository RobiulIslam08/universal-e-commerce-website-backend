import { z } from 'zod';

const createCarouselValidationSchema = z.object({
  body: z.object({
    title: z
      .string({
        message: 'Title is required',
      })
      .min(1, 'Title cannot be empty')
      .trim(),
    subtitle: z
      .string({
        message: 'Subtitle is required',
      })
      .min(1, 'Subtitle cannot be empty')
      .trim(),
    badge: z
      .string({
        message: 'Badge text is required',
      })
      .min(1, 'Badge text cannot be empty')
      .trim(),
    badgeSubtext: z
      .string({
        message: 'Badge subtext is required',
      })
      .min(1, 'Badge subtext cannot be empty')
      .trim(),
    bgColor: z
      .string({
        message: 'Background color is required',
      })
      .min(1, 'Background color cannot be empty')
      .trim(),
    image: z.string().optional(),
    buttonText: z.string().trim().optional().or(z.literal('')),
    buttonLink: z.string().trim().optional().or(z.literal('')),
    isActive: z
      .union([z.string(), z.boolean()])
      .transform((val) => {
        if (typeof val === 'boolean') return val;
        return val === 'true';
      })
      .optional(),
    order: z
      .union([z.string(), z.number()])
      .transform((val) => {
        if (typeof val === 'number') return val;
        return Number(val);
      })
      .optional(),
  }),
});

const updateCarouselValidationSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title cannot be empty').trim().optional(),
    subtitle: z.string().min(1, 'Subtitle cannot be empty').trim().optional(),
    badge: z.string().min(1, 'Badge text cannot be empty').trim().optional(),
    badgeSubtext: z
      .string()
      .min(1, 'Badge subtext cannot be empty')
      .trim()
      .optional(),
    bgColor: z
      .string()
      .min(1, 'Background color cannot be empty')
      .trim()
      .optional(),
    image: z.string().optional(),
    buttonText: z.string().trim().optional().or(z.literal('')),
    buttonLink: z.string().trim().optional().or(z.literal('')),
    isActive: z
      .union([z.string(), z.boolean()])
      .transform((val) => {
        if (typeof val === 'boolean') return val;
        return val === 'true';
      })
      .optional(),
    order: z
      .union([z.string(), z.number()])
      .transform((val) => {
        if (typeof val === 'number') return val;
        return Number(val);
      })
      .optional(),
  }),
});

const toggleStatusValidationSchema = z.object({
  body: z.object({
    isActive: z.boolean({
      message: 'isActive is required',
    }),
  }),
});

const reorderSlidesValidationSchema = z.object({
  body: z.object({
    slides: z
      .array(
        z.object({
          id: z.string(),
          order: z.number(),
        }),
      )
      .min(1, 'At least one slide is required'),
  }),
});

export const CarouselValidations = {
  createCarouselValidationSchema,
  updateCarouselValidationSchema,
  toggleStatusValidationSchema,
  reorderSlidesValidationSchema,
};
