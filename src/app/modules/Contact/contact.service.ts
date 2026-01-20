import httpStatus from 'http-status';
import { Contact } from './contact.model';
import {
  ICreateContactDTO,
  IContactDocument,
  IContactQuery,
  IContactStats,
  ContactStatus,
  IReplyContactDTO,
} from './contact.interface';
import AppError from '../../errors/AppError';
import { sendEmail } from '../../utils/sendEmail';

// Create a new contact message
const createContactIntoDB = async (
  payload: ICreateContactDTO,
): Promise<IContactDocument> => {
  const contact = await Contact.create(payload);
  return contact;
};

// Get all contact messages with filters (Admin only)
const getAllContactsFromDB = async (
  query: IContactQuery,
): Promise<{
  data: IContactDocument[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> => {
  const {
    status,
    searchTerm,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = query;

  const filter: any = {};

  // Filter by status
  if (status) {
    filter.status = status;
  }

  // Search functionality
  if (searchTerm) {
    filter.$or = [
      { name: { $regex: searchTerm, $options: 'i' } },
      { email: { $regex: searchTerm, $options: 'i' } },
      { subject: { $regex: searchTerm, $options: 'i' } },
      { message: { $regex: searchTerm, $options: 'i' } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const sortOptions: any = {};
  sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

  const [data, total] = await Promise.all([
    Contact.find(filter).sort(sortOptions).skip(skip).limit(Number(limit)),
    Contact.countDocuments(filter),
  ]);

  return {
    data,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit)),
  };
};

// Get single contact by ID
const getSingleContactFromDB = async (
  id: string,
): Promise<IContactDocument> => {
  const contact = await Contact.findById(id);

  if (!contact) {
    throw new AppError(httpStatus.NOT_FOUND, 'Contact message not found');
  }

  return contact;
};

// Update contact status (mark as read)
const updateContactStatusIntoDB = async (
  id: string,
  status: ContactStatus,
): Promise<IContactDocument> => {
  const contact = await Contact.findById(id);

  if (!contact) {
    throw new AppError(httpStatus.NOT_FOUND, 'Contact message not found');
  }

  contact.status = status;
  await contact.save();

  return contact;
};

// Reply to contact message
const replyToContactIntoDB = async (
  id: string,
  payload: IReplyContactDTO,
  adminEmail?: string,
): Promise<IContactDocument> => {
  const contact = await Contact.findById(id);

  if (!contact) {
    throw new AppError(httpStatus.NOT_FOUND, 'Contact message not found');
  }

  // Prepare email HTML
  const emailHtml = getContactReplyEmailTemplate(
    contact.name,
    contact.subject,
    contact.message,
    payload.replyMessage,
    payload.adminName || 'Support Team',
  );

  // Send reply email
  try {
    await sendEmail({
      to: contact.email,
      subject: `Re: ${contact.subject}`,
      html: emailHtml,
    });

    // Update contact record
    contact.status = ContactStatus.REPLIED;
    contact.adminReply = payload.replyMessage;
    contact.adminRepliedAt = new Date();
    contact.adminRepliedBy = payload.adminName || adminEmail || 'Admin';

    await contact.save();

  } catch (error) {
    console.error('❌ Failed to send reply email:', error);
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to send reply email',
    );
  }

  return contact;
};

// Delete contact message (permanent delete)
const deleteContactFromDB = async (id: string): Promise<void> => {
  const contact = await Contact.findByIdAndDelete(id);

  if (!contact) {
    throw new AppError(httpStatus.NOT_FOUND, 'Contact message not found');
  }
};

// Get contact statistics (Admin dashboard)
const getContactStatsFromDB = async (): Promise<IContactStats> => {
  const [total, newCount, readCount, repliedCount] = await Promise.all([
    Contact.countDocuments(),
    Contact.countDocuments({ status: ContactStatus.NEW }),
    Contact.countDocuments({ status: ContactStatus.READ }),
    Contact.countDocuments({ status: ContactStatus.REPLIED }),
  ]);

  return {
    total,
    new: newCount,
    read: readCount,
    replied: repliedCount,
  };
};

// Email template for reply
const getContactReplyEmailTemplate = (
  userName: string,
  originalSubject: string,
  originalMessage: string,
  replyMessage: string,
  adminName: string,
): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Reply to Your Message</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">We've Received Your Message! 💬</h1>
      </div>
      
      <div style="background-color: #ffffff; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px;">Hi ${userName},</p>
        
        <p style="font-size: 16px;">Thank you for reaching out to us. Here's our response to your inquiry:</p>
        
        <div style="background-color: #f0f7ff; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; border-radius: 5px;">
          <h3 style="margin-top: 0; color: #667eea;">Our Response:</h3>
          <p style="font-size: 16px; white-space: pre-wrap; margin: 0;">${replyMessage}</p>
        </div>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #666;">Your Original Message:</h4>
          <p style="margin: 5px 0;"><strong>Subject:</strong> ${originalSubject}</p>
          <p style="margin: 5px 0;"><strong>Message:</strong></p>
          <p style="color: #666; font-style: italic; white-space: pre-wrap;">"${originalMessage}"</p>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
          <p style="font-size: 14px; color: #666;">
            If you have any further questions, feel free to reply to this email or send us a new message.
          </p>
          <p style="font-size: 14px; color: #666;">
            Best regards,<br/>
            <strong>${adminName}</strong><br/>
            Support Team
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <p style="color: #667eea; font-size: 14px;">Thank you for contacting us! 🎉</p>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
        <p>This is a reply to your contact form submission.</p>
        <p>&copy; ${new Date().getFullYear()} E-Commerce Store. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
};

export const ContactService = {
  createContactIntoDB,
  getAllContactsFromDB,
  getSingleContactFromDB,
  updateContactStatusIntoDB,
  replyToContactIntoDB,
  deleteContactFromDB,
  getContactStatsFromDB,
};
