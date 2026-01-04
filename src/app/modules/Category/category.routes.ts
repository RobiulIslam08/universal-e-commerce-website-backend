import express from 'express';
import validateRequest from '../../middleware/validationRequest';
import { CategoryControllers } from './category.controller';
import { CategoryValidation } from './category.validation';

const router = express.Router();

// Create new category
router.post(
  '/create-category',
  validateRequest(CategoryValidation.createCategoryValidationSchema),
  CategoryControllers.createCategory,
);

// Get category statistics
router.get('/stats', CategoryControllers.getCategoryStats);

// Get category tree (hierarchical)
router.get('/tree', CategoryControllers.getCategoryTree);

// Get root categories
router.get('/root', CategoryControllers.getRootCategories);

// Get all categories (flat list)
router.get('/', CategoryControllers.getAllCategories);

// Get subcategories of a category
router.get('/:slug/subcategories', CategoryControllers.getSubCategories);

// Get single category by slug
router.get('/:slug', CategoryControllers.getCategoryBySlug);

// Update category
router.patch(
  '/:slug',
  validateRequest(CategoryValidation.updateCategoryValidationSchema),
  CategoryControllers.updateCategory,
);

// Delete category
router.delete('/:slug', CategoryControllers.deleteCategory);

export const CategoryRoutes = router;
