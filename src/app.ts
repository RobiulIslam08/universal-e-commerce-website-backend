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
    origin: 'http://localhost:3000', // আপনার ফ্রন্টএন্ডের URL
    credentials: true, // কুকি সেট করার জন্য এটি জরুরি
  }),
);
app.use('/api/v1', router);
app.get('/', (req: Request, res: Response) => {
  const a = 1;

  res.send(a);
});

export default app;
