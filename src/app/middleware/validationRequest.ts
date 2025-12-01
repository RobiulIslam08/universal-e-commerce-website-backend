import { NextFunction, Request, Response } from 'express';
import { ZodObject } from 'zod';
import catchAsync from '../utils/catchAsync';

//validation
const validateRequest = (schema: ZodObject<any>) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    //valiction check => ok => next()
    await schema.parseAsync({
      body: req.body,
      cookies: req.cookies,
    });
    next();
  });
};
export default validateRequest;
