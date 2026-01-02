import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { ReviewServices } from './review.service';

// Create a new review (public - no auth required)
const createReview = catchAsync(async (req: Request, res: Response) => {
  const result = await ReviewServices.createReviewIntoDB(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Review submitted successfully',
    data: result,
  });
});

// Get all reviews for a specific product (public)
const getReviewsByProductId = catchAsync(
  async (req: Request, res: Response) => {
    const { productId } = req.params;
    const result = await ReviewServices.getReviewsByProductIdFromDB(productId);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Reviews retrieved successfully',
      data: result,
    });
  },
);

// Get all reviews (admin)
const getAllReviews = catchAsync(async (req: Request, res: Response) => {
  const result = await ReviewServices.getAllReviewsFromDB();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'All reviews retrieved successfully',
    data: result,
  });
});

// Get single review by ID
const getSingleReview = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ReviewServices.getSingleReviewFromDB(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Review retrieved successfully',
    data: result,
  });
});

// Update review (admin)
const updateReview = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ReviewServices.updateReviewInDB(id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Review updated successfully',
    data: result,
  });
});

// Delete review (admin)
const deleteReview = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ReviewServices.deleteReviewFromDB(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Review deleted successfully',
    data: result,
  });
});

// Toggle review approval (admin)
const toggleReviewApproval = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ReviewServices.toggleReviewApprovalInDB(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `Review ${result?.isApproved ? 'approved' : 'disapproved'} successfully`,
    data: result,
  });
});

// Get pending reviews (admin)
const getPendingReviews = catchAsync(async (req: Request, res: Response) => {
  const result = await ReviewServices.getPendingReviewsFromDB();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Pending reviews retrieved successfully',
    data: result,
  });
});

export const ReviewControllers = {
  createReview,
  getReviewsByProductId,
  getAllReviews,
  getSingleReview,
  updateReview,
  deleteReview,
  toggleReviewApproval,
  getPendingReviews,
};
