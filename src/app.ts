import { Application, Request, Response } from 'express';
import cors from 'cors';

import express from 'express';
import router from './app/routes';
import globalErrorHandler from './app/middleware/globalErrorHandler';
import notFound from './app/middleware/notFound';
const app: Application = express();

//parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'https://universal-e-commerce-website-fronte.vercel.app',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);
app.use('/api/v1', router);
app.get('/', (req: Request, res: Response) => {
  res.send({
    message: 'Universal E-Commerce Website Backend is running',
    status: 'OK',
  });
});

app.use(globalErrorHandler);
app.use(notFound);

export default app;
