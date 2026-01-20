import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { ProductServices } from './product.service';
import { sendImageToCloudinaryFromBuffer } from '../../utils/sendImageToCloudinary';
import AppError from '../../errors/AppError';

const createProduct = catchAsync(async (req: Request, res: Response) => {
  if (!req.files) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Please upload an image');
  }

  const images = [];

  if (req.files && Array.isArray(req.files)) {
    for (const file of req.files) {
      const imageName = `${Date.now()}-${file.originalname}`;
      const result = await sendImageToCloudinaryFromBuffer(
        imageName,
        file.buffer,
      );
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
 

  const result = await ProductServices.getAllProductsFromDB(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Products retrieved successfully',
    meta: result.meta,
    data: result.products,
  });
});

// Search products endpoint
const searchProducts = catchAsync(async (req: Request, res: Response) => {
  

  const { q } = req.query;

  // Validate search term
  if (!q || typeof q !== 'string' || q.trim() === '') {
    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'No search term provided',
      data: [],
    });
  }

  const searchTerm = q as string;
 

  const result = await ProductServices.searchProductsFromDB(searchTerm);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.length > 0 ? 'Products found' : 'No products found',
    data: result,
  });
});

const getSingleProduct = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ProductServices.getSingleProductFromDB(id);

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Product not found');
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Product retrieved successfully',
    data: result,
  });
});

const updateProduct = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const images = [];

  if (req.files && Array.isArray(req.files) && req.files.length > 0) {
    for (const file of req.files) {
      const imageName = `${Date.now()}-${file.originalname}`;
      const result = await sendImageToCloudinaryFromBuffer(
        imageName,
        file.buffer,
      );
      images.push(result.secure_url as string);
    }
    req.body.images = images;
  }

  const result = await ProductServices.updateProductInDB(id, req.body);

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Product not found');
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Product updated successfully',
    data: result,
  });
});

const deleteProduct = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ProductServices.deleteProductFromDB(id);

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Product not found');
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Product deleted successfully',
    data: result,
  });
});

// Get best seller products
const getBestSellerProducts = catchAsync(
  async (req: Request, res: Response) => {
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    const result = await ProductServices.getBestSellerProductsFromDB(limit);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Best seller products retrieved successfully',
      data: result,
    });
  },
);

// Get featured products
const getFeaturedProducts = catchAsync(async (req: Request, res: Response) => {
  const limit = req.query.limit ? Number(req.query.limit) : 10;
  const result = await ProductServices.getFeaturedProductsFromDB(limit);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Featured products retrieved successfully',
    data: result,
  });
});

// Get products by category
const getProductsByCategory = catchAsync(
  async (req: Request, res: Response) => {
    const { category } = req.params;
 

    const result = await ProductServices.getProductsByCategoryFromDB(
      category,
      req.query,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: `Products in category "${category}" retrieved successfully`,
      meta: result.meta,
      data: result.products,
    });
  },
);

export const ProductControllers = {
  createProduct,
  getAllProducts,
  getSingleProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
  getBestSellerProducts,
  getFeaturedProducts,
  getProductsByCategory,
};
