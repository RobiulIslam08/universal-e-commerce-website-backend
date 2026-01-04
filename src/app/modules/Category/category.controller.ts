import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { CategoryServices } from './category.service';
import AppError from '../../errors/AppError';

// Create a new category
const createCategory = catchAsync(async (req: Request, res: Response) => {
  const result = await CategoryServices.createCategoryIntoDB(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Category created successfully',
    data: result,
  });
});

// Get all categories (flat list)
const getAllCategories = catchAsync(async (req: Request, res: Response) => {
  const result = await CategoryServices.getAllCategoriesFromDB();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Categories retrieved successfully',
    data: result,
  });
});

// Get category tree (hierarchical structure)
const getCategoryTree = catchAsync(async (req: Request, res: Response) => {
  const result = await CategoryServices.getCategoryTreeFromDB();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Category tree retrieved successfully',
    data: result,
  });
});

// Get single category by slug with subcategories and counts
const getCategoryBySlug = catchAsync(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const result = await CategoryServices.getCategoryBySlugFromDB(slug);

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Category not found');
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Category retrieved successfully',
    data: result,
  });
});

// Get root categories (top-level categories)
const getRootCategories = catchAsync(async (req: Request, res: Response) => {
  const result = await CategoryServices.getRootCategoriesFromDB();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Root categories retrieved successfully',
    data: result,
  });
});

// Get subcategories of a category
const getSubCategories = catchAsync(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const result = await CategoryServices.getCategoriesByParentFromDB(slug);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Subcategories retrieved successfully',
    data: result,
  });
});

// Update category
const updateCategory = catchAsync(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const result = await CategoryServices.updateCategoryInDB(slug, req.body);

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Category not found');
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Category updated successfully',
    data: result,
  });
});

// Delete category
const deleteCategory = catchAsync(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const result = await CategoryServices.deleteCategoryFromDB(slug);

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Category not found');
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Category deleted successfully',
    data: result,
  });
});

// Get category statistics
const getCategoryStats = catchAsync(async (req: Request, res: Response) => {
  const result = await CategoryServices.getCategoryStatsFromDB();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Category statistics retrieved successfully',
    data: result,
  });
});

export const CategoryControllers = {
  createCategory,
  getAllCategories,
  getCategoryTree,
  getCategoryBySlug,
  getRootCategories,
  getSubCategories,
  updateCategory,
  deleteCategory,
  getCategoryStats,
};
