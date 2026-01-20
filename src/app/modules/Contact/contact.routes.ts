import express from 'express';
import { ContactController } from './contact.controller';
import validateRequest from '../../middleware/validationRequest';
import { ContactValidation } from './contact.validation';
import auth from '../../middleware/auth';

const router = express.Router();

// Public route - anyone can submit contact form
router.post(
  '/',
  validateRequest(ContactValidation.createContactValidationSchema),
  ContactController.createContact,
);

// Admin routes - require authentication
router.get(
  '/stats',
  //   auth('admin'),
  ContactController.getContactStats,
);

router.get(
  '/',
  //   auth('admin'),
  ContactController.getAllContacts,
);

router.get(
  '/:id',
  //   auth('admin'),
  ContactController.getSingleContact,
);

router.patch(
  '/:id/status',
  //   auth('admin'),
  validateRequest(ContactValidation.updateContactStatusValidationSchema),
  ContactController.updateContactStatus,
);

router.post(
  '/:id/reply',
  //   auth('admin'),
  validateRequest(ContactValidation.replyContactValidationSchema),
  ContactController.replyToContact,
);

router.delete(
  '/:id',
  //   auth('admin'),
  ContactController.deleteContact,
);

export const ContactRoutes = router;
