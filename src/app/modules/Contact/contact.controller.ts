import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { ContactService } from './contact.service';
import { IContactQuery, ContactStatus } from './contact.interface';

// Create new contact message (Public - no auth required)
const createContact = catchAsync(async (req: Request, res: Response) => {
  const result = await ContactService.createContactIntoDB(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Contact message submitted successfully',
    data: result,
  });
});

// Get all contacts with filters (Admin only)
const getAllContacts = catchAsync(async (req: Request, res: Response) => {
  const query: IContactQuery = {
    status: req.query.status as ContactStatus,
    searchTerm: req.query.searchTerm as string,
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 10,
    sortBy: (req.query.sortBy as string) || 'createdAt',
    sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
  };

  const result = await ContactService.getAllContactsFromDB(query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Contacts retrieved successfully',
    data: result.data,
    meta: {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPage: result.totalPages,
    },
  });
});

// Get single contact by ID (Admin only)
const getSingleContact = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ContactService.getSingleContactFromDB(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Contact retrieved successfully',
    data: result,
  });
});

// Update contact status (Admin only)
const updateContactStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  const result = await ContactService.updateContactStatusIntoDB(id, status);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Contact status updated successfully',
    data: result,
  });
});

// Reply to contact message (Admin only)
const replyToContact = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const adminEmail = req.user?.email; // Assuming auth middleware adds user to req

  const result = await ContactService.replyToContactIntoDB(
    id,
    req.body,
    adminEmail,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Reply sent successfully',
    data: result,
  });
});

// Delete contact message (Admin only)
const deleteContact = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  await ContactService.deleteContactFromDB(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Contact deleted successfully',
    data: null,
  });
});

// Get contact statistics (Admin dashboard)
const getContactStats = catchAsync(async (req: Request, res: Response) => {
  const result = await ContactService.getContactStatsFromDB();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Contact statistics retrieved successfully',
    data: result,
  });
});

export const ContactController = {
  createContact,
  getAllContacts,
  getSingleContact,
  updateContactStatus,
  replyToContact,
  deleteContact,
  getContactStats,
};
