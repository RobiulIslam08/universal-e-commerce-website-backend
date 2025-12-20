import express from 'express';
import { CarouselControllers } from './carousel.controller';
import validationRequest from '../../middleware/validationRequest';
import { CarouselValidations } from './carousel.validation';
import auth from '../../middleware/auth';
import { upload } from '../../utils/sendImageToCloudinary';

const router = express.Router();

// Public routes - No authentication required
router.get('/active', CarouselControllers.getActiveCarouselSlides);

router.get('/', CarouselControllers.getAllCarouselSlides);

// Admin routes - Authentication required (specific routes before parameterized routes)
router.patch(
  '/reorder',
  // auth('admin'),
  validationRequest(CarouselValidations.reorderSlidesValidationSchema),
  CarouselControllers.reorderCarouselSlides,
);

router.post(
  '/',
  // auth('admin'),
  upload.single('image'),
  validationRequest(CarouselValidations.createCarouselValidationSchema),
  CarouselControllers.createCarouselSlide,
);

router.patch(
  '/:id/toggle',
  // auth('admin'),
  validationRequest(CarouselValidations.toggleStatusValidationSchema),
  CarouselControllers.toggleCarouselSlideStatus,
);

router.patch(
  '/:id',
  // auth('admin'),
  upload.single('image'),
  validationRequest(CarouselValidations.updateCarouselValidationSchema),
  CarouselControllers.updateCarouselSlide,
);

// router.delete('/:id', auth('admin'), CarouselControllers.deleteCarouselSlide);

router.get('/:id', CarouselControllers.getSingleCarouselSlide);

export const CarouselRoutes = router;
