import { Application, Request, Response } from 'express';
import cors from 'cors';

import express from 'express';
import router from './app/routes';
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
  }),
);
app.use('/api/v1', router);
app.get('/', (req: Request, res: Response) => {
  res.send({
    message: 'Universal E-Commerce Website Backend is running',
    status: 'OK',
  });
});

export default app;
