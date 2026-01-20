import { Document, Model, Types } from 'mongoose';

// Contact Status Enum
export enum ContactStatus {
  NEW = 'new',
  READ = 'read',
  REPLIED = 'replied',
}

// Main Contact Interface
export interface IContact {
  name: string;
  email: string;
  subject: string;
  message: string;
  status: ContactStatus;
  adminReply?: string;
  adminRepliedAt?: Date;
  adminRepliedBy?: string;
  isDeleted: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Contact Document Interface
export interface IContactDocument extends IContact, Document {
  _id: Types.ObjectId;
}

// Contact Model Interface
export interface IContactModel extends Model<IContactDocument> {
  isContactExists(id: string): Promise<IContactDocument | null>;
}

// DTOs
export interface ICreateContactDTO {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface IReplyContactDTO {
  replyMessage: string;
  adminName?: string;
}

export interface IContactQuery {
  status?: ContactStatus;
  searchTerm?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface IContactStats {
  total: number;
  new: number;
  read: number;
  replied: number;
}
