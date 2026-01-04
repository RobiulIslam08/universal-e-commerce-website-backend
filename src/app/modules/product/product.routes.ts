import express from 'express';
import validateRequest from '../../middleware/validationRequest';
import { ProductControllers } from './product.controller';
import { ProductValidation } from './product.validation';
import { upload } from '../../utils/sendImageToCloudinary';
import { parseBody } from '../../middleware/bodyParser';

const router = express.Router();

router.post(
  '/create-product',
  upload.array('images'),
  parseBody,
  validateRequest(ProductValidation.createProductValidationSchema),
  ProductControllers.createProduct,
);

// Search products - GET /api/v1/products/search?q=searchTerm
router.get('/search', ProductControllers.searchProducts);

// Get best seller products - GET /api/v1/products/best-sellers?limit=10
router.get('/best-sellers', ProductControllers.getBestSellerProducts);

// Get featured products - GET /api/v1/products/featured?limit=10
router.get('/featured', ProductControllers.getFeaturedProducts);

// Get products by category - GET /api/v1/products/category/:category
router.get('/category/:category', ProductControllers.getProductsByCategory);

router.get('/', ProductControllers.getAllProducts);

router.get('/:id', ProductControllers.getSingleProduct);

router.patch(
  '/:id',
  upload.array('images'),
  parseBody,
  validateRequest(ProductValidation.updateProductValidationSchema),
  ProductControllers.updateProduct,
);

router.delete('/:id', ProductControllers.deleteProduct);

export const ProductRoutes = router;
