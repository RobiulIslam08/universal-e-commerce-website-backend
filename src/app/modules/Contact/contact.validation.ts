import { z } from 'zod';
import { ContactStatus } from './contact.interface';

// Create Contact Validation
const createContactValidationSchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(1, 'Name is required')
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name cannot exceed 100 characters'),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Please provide a valid email address')
      .trim()
      .toLowerCase(),
    subject: z
      .string()
      .min(1, 'Subject is required')
      .trim()
      .min(3, 'Subject must be at least 3 characters')
      .max(200, 'Subject cannot exceed 200 characters'),
    message: z
      .string()
      .min(1, 'Message is required')
      .trim()
      .min(10, 'Message must be at least 10 characters')
      .max(2000, 'Message cannot exceed 2000 characters'),
  }),
});

// Update Contact Status Validation
const updateContactStatusValidationSchema = z.object({
  body: z.object({
    status: z.enum(
      [ContactStatus.NEW, ContactStatus.READ, ContactStatus.REPLIED] as const,
      {
        error: 'Status is required',
      },
    ),
  }),
});

// Reply to Contact Validation
const replyContactValidationSchema = z.object({
  body: z.object({
    replyMessage: z
      .string()
      .min(1, 'Reply message is required')
      .trim()
      .min(10, 'Reply message must be at least 10 characters')
      .max(5000, 'Reply message cannot exceed 5000 characters'),
    adminName: z.string().trim().optional(),
  }),
});

export const ContactValidation = {
  createContactValidationSchema,
  updateContactStatusValidationSchema,
  replyContactValidationSchema,
};
