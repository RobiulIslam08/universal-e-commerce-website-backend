import express from 'express';
import validateRequest from '../../middleware/validationRequest';
import { ReviewValidations } from './review.validation';
import { ReviewControllers } from './review.controller';

const router = express.Router();

// ============ PUBLIC ROUTES (No Auth Required) ============

// Create a new review - Anyone can submit a review
router.post(
  '/',
  validateRequest(ReviewValidations.createReviewValidationSchema),
  ReviewControllers.createReview,
);

// Get all reviews for a specific product
router.get('/product/:productId', ReviewControllers.getReviewsByProductId);

// ============ ADMIN ROUTES ============
// Note: Add auth middleware here if you want to protect these routes
// Example: router.get('/admin/all', auth('admin'), ReviewControllers.getAllReviews);

// Get all reviews (for admin panel)
router.get('/admin/all', ReviewControllers.getAllReviews);

// Get pending reviews (for admin panel)
router.get('/admin/pending', ReviewControllers.getPendingReviews);

// Get single review
router.get('/:id', ReviewControllers.getSingleReview);

// Update review
router.patch(
  '/:id',
  validateRequest(ReviewValidations.updateReviewValidationSchema),
  ReviewControllers.updateReview,
);

// Toggle review approval
router.patch(
  '/admin/toggle-approval/:id',
  ReviewControllers.toggleReviewApproval,
);

// Delete review
router.delete('/:id', ReviewControllers.deleteReview);

export const ReviewRoutes = router;
