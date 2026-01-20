import nodemailer from 'nodemailer';
import config from '../config';

interface IEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async (options: IEmailOptions): Promise<void> => {
  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: config.email_host,
      port: Number(config.email_port),
      secure: config.email_port === '465', // true for 465, false for other ports
      auth: {
        user: config.email_user,
        pass: config.email_pass,
      },
    });

    // Send email
    await transporter.sendMail({
      from: `"${config.email_from_name}" <${config.email_user}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });


  } catch (error) {
    console.error('❌ Error sending email:', error);
    // Don't throw error to prevent payment flow disruption
    // Just log it for monitoring
  }
};

// Payment confirmation email template
export const getPaymentConfirmationEmailTemplate = (
  userName: string,
  amount: number,
  currency: string,
  paymentIntentId: string,
  items: Array<{ productName: string; quantity: number; price: number }>,
  shippingAddress?: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  },
): string => {
  const itemsHtml = items
    .map(
      (item) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.productName}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${currency.toUpperCase()} ${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `,
    )
    .join('');

  const shippingHtml = shippingAddress
    ? `
    <div style="margin: 20px 0; padding: 15px; background-color: #f9f9f9; border-radius: 5px;">
      <h3 style="margin-top: 0; color: #333;">Shipping Address:</h3>
      <p style="margin: 5px 0;">${shippingAddress.firstName} ${shippingAddress.lastName}</p>
      <p style="margin: 5px 0;">${shippingAddress.address}</p>
      <p style="margin: 5px 0;">${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zipCode}</p>
      <p style="margin: 5px 0;">${shippingAddress.country}</p>
    </div>
  `
    : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Payment Confirmation</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Payment Confirmed! ✅</h1>
      </div>
      
      <div style="background-color: #ffffff; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px;">Hi ${userName},</p>
        
        <p style="font-size: 16px;">Thank you for your purchase! Your payment has been successfully processed.</p>
        
        <div style="background-color: #f0f7ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Payment ID:</strong> ${paymentIntentId}</p>
          <p style="margin: 5px 0;"><strong>Total Amount:</strong> ${currency.toUpperCase()} ${amount.toFixed(2)}</p>
          <p style="margin: 5px 0;"><strong>Payment Status:</strong> <span style="color: #10b981; font-weight: bold;">SUCCEEDED</span></p>
        </div>
        
        <h3 style="color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px;">Order Details:</h3>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Product</th>
              <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ddd;">Quantity</th>
              <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr style="background-color: #f8f9fa; font-weight: bold;">
              <td colspan="2" style="padding: 15px; text-align: right; border-top: 2px solid #ddd;">Total:</td>
              <td style="padding: 15px; text-align: right; border-top: 2px solid #ddd;">${currency.toUpperCase()} ${amount.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
        
        ${shippingHtml}
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
          <p style="font-size: 14px; color: #666;">We'll send you a shipping notification email when your order ships.</p>
          <p style="font-size: 14px; color: #666;">If you have any questions, please don't hesitate to contact our support team.</p>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <p style="color: #667eea; font-size: 14px;">Thank you for shopping with us! 🎉</p>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
        <p>This is an automated email. Please do not reply to this message.</p>
        <p>&copy; ${new Date().getFullYear()} Your E-Commerce Store. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
};
