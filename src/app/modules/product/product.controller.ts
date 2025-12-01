import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { ProductServices } from './product.service';
import { sendImageToCloudinary } from '../../utils/sendImageToCloudinary';
import AppError from '../../errors/AppError';

const createProduct = catchAsync(async (req: Request, res: Response) => {
  if (!req.files) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Please upload an image');
  }

  const images = [];

  if (req.files && Array.isArray(req.files)) {
    for (const file of req.files) {
      const imageName = file.originalname;
      const path = file.path;

      const result = await sendImageToCloudinary(imageName, path);
      images.push(result.secure_url as string);
    }
  }

  req.body.images = images;

  const result = await ProductServices.createProductIntoDB(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Product created successfully',
    data: result,
  });
});

const getAllProducts = catchAsync(async (req: Request, res: Response) => {
  const result = await ProductServices.getAllProductsFromDB();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Products retrieved successfully',
    data: result,
  });
});

export const ProductControllers = {
  createProduct,
  getAllProducts,
};
