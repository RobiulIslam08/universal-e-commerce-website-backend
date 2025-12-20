import express from 'express';

import { AuthRoutes } from '../modules/Auth/auth.routes';
import { UserRoutes } from '../modules/User/user.routes';
import { ProductRoutes } from '../modules/product/product.routes';
import { CarouselRoutes } from '../modules/carousel/carousel.routes';
import { PaymentRoutes } from '../modules/Payment/payment.routes';

const router = express.Router();

const moduleRoute = [
  {
    path: '/users',
    route: UserRoutes,
  },
  {
    path: '/auth',
    route: AuthRoutes,
  },
  {
    path: '/products',
    route: ProductRoutes,
  },
  {
    path: '/carousel',
    route: CarouselRoutes,
  },
  {
    path: '/payments',
    route: PaymentRoutes,
  },
];
moduleRoute.forEach((route) => router.use(route.path, route.route));

export default router;
