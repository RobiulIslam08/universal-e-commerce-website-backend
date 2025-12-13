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
