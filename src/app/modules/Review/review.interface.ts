import { Types } from 'mongoose';

export type TReview = {
  productId: Types.ObjectId;
  reviewerName: string;
  reviewerEmail?: string;
  rating: number;
  title?: string;
  comment: string;
  isApproved?: boolean;
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};
