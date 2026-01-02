import httpStatus from 'http-status';
import AppError from '../../errors/AppError';
import { Product } from '../product/product.model';
import { TReview } from './review.interface';
import { Review } from './review.model';

// Create a new review
const createReviewIntoDB = async (payload: TReview) => {
  // Check if product exists
  const product = await Product.findById(payload.productId);
  if (!product || product.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, 'Product not found');
  }

  const result = await Review.create(payload);
  return result;
};

// Get all reviews for a specific product
const getReviewsByProductIdFromDB = async (productId: string) => {
  // Check if product exists
  const product = await Product.findById(productId);
  if (!product || product.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, 'Product not found');
  }

  const reviews = await Review.find({
    productId,
    isDeleted: false,
    isApproved: true,
  }).sort({ createdAt: -1 });

  // Calculate average rating
  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
      : 0;

  // Calculate rating distribution
  const ratingDistribution = {
    5: reviews.filter((r) => r.rating === 5).length,
    4: reviews.filter((r) => r.rating === 4).length,
    3: reviews.filter((r) => r.rating === 3).length,
    2: reviews.filter((r) => r.rating === 2).length,
    1: reviews.filter((r) => r.rating === 1).length,
  };

  return {
    reviews,
    totalReviews,
    averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
    ratingDistribution,
  };
};

// Get all reviews (admin)
const getAllReviewsFromDB = async () => {
  const result = await Review.find({ isDeleted: false })
    .populate('productId', 'title images')
    .sort({ createdAt: -1 });
  return result;
};

// Get single review by ID
const getSingleReviewFromDB = async (id: string) => {
  const result = await Review.findById(id).populate(
    'productId',
    'title images',
  );
  if (!result || result.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, 'Review not found');
  }
  return result;
};

// Update review (admin)
const updateReviewInDB = async (id: string, payload: Partial<TReview>) => {
  const review = await Review.findById(id);
  if (!review || review.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, 'Review not found');
  }

  const result = await Review.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
  return result;
};

// Delete review (soft delete)
const deleteReviewFromDB = async (id: string) => {
  const review = await Review.findById(id);
  if (!review || review.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, 'Review not found');
  }

  const result = await Review.findByIdAndUpdate(
    id,
    { isDeleted: true },
    { new: true },
  );
  return result;
};

// Approve/Disapprove review (admin)
const toggleReviewApprovalInDB = async (id: string) => {
  const review = await Review.findById(id);
  if (!review || review.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, 'Review not found');
  }

  const result = await Review.findByIdAndUpdate(
    id,
    { isApproved: !review.isApproved },
    { new: true },
  );
  return result;
};

// Get pending reviews (admin)
const getPendingReviewsFromDB = async () => {
  const result = await Review.find({ isDeleted: false, isApproved: false })
    .populate('productId', 'title images')
    .sort({ createdAt: -1 });
  return result;
};

export const ReviewServices = {
  createReviewIntoDB,
  getReviewsByProductIdFromDB,
  getAllReviewsFromDB,
  getSingleReviewFromDB,
  updateReviewInDB,
  deleteReviewFromDB,
  toggleReviewApprovalInDB,
  getPendingReviewsFromDB,
};
