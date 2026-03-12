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
        <p>&copy; ${new Date().getFullYear()} <strong>UNIVERSE</strong>. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
};

// COD order confirmation email template
export const getCODOrderConfirmationEmailTemplate = (
  userName: string,
  amount: number,
  currency: string,
  orderId: string,
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
      <h3 style="margin-top: 0; color: #333;">Delivery Address:</h3>
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
      <title>Order Confirmation</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Order Confirmed! 🎉</h1>
        <p style="color: #fff3cd; margin: 10px 0 0;">Cash on Delivery</p>
      </div>

      <div style="background-color: #ffffff; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px;">Hi ${userName},</p>

        <p style="font-size: 16px;">Thank you for your order! Your Cash on Delivery order has been confirmed. Our team will process it shortly.</p>

        <div style="background-color: #fffbeb; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <p style="margin: 5px 0;"><strong>Order ID:</strong> ${orderId}</p>
          <p style="margin: 5px 0;"><strong>Total Amount:</strong> ${currency.toUpperCase()} ${amount.toFixed(2)}</p>
          <p style="margin: 5px 0;"><strong>Payment Method:</strong> <span style="color: #d97706; font-weight: bold;">Cash on Delivery (COD)</span></p>
          <p style="margin: 5px 0;"><strong>Order Status:</strong> <span style="color: #f59e0b; font-weight: bold;">PENDING</span></p>
        </div>

        <div style="background-color: #fef3c7; padding: 12px 15px; border-radius: 5px; margin: 15px 0;">
          <p style="margin: 0; font-size: 14px;">💡 <strong>Note:</strong> Please keep the exact amount of <strong>${currency.toUpperCase()} ${amount.toFixed(2)}</strong> ready at the time of delivery.</p>
        </div>

        <h3 style="color: #333; border-bottom: 2px solid #f59e0b; padding-bottom: 10px;">Order Details:</h3>

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
          <p style="font-size: 14px; color: #666;">Our delivery team will contact you before arriving. Please ensure someone is available to receive the order.</p>
          <p style="font-size: 14px; color: #666;">If you have any questions, please don't hesitate to contact our support team.</p>
        </div>

        <div style="text-align: center; margin-top: 30px;">
          <p style="color: #d97706; font-size: 14px;">Thank you for shopping with us! 🛍️</p>
        </div>
      </div>

      <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
        <p>This is an automated email. Please do not reply to this message.</p>
        <p>&copy; ${new Date().getFullYear()} <strong>UNIVERSE</strong>. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
};

// ============================================================
// ORDER STATUS UPDATE EMAIL TEMPLATE
// যখন admin অর্ডারের status change করে, তখন এই email যাবে
// ============================================================
export const getOrderStatusUpdateEmailTemplate = (
  userName: string,
  orderId: string,
  newStatus: string,
  statusTitle: string,
  statusDescription: string,
  trackingNumber?: string,
  trackingUrl?: string,
  estimatedDelivery?: Date,
  items?: Array<{ productName: string; quantity: number; price: number }>,
  currency: string = 'usd',
): string => {
  // Status অনুযায়ী color ও icon নির্ধারণ
  const statusConfig: Record<
    string,
    { color: string; gradient: string; icon: string; bgColor: string }
  > = {
    confirmed: {
      color: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      icon: '✅',
      bgColor: '#ecfdf5',
    },
    processing: {
      color: '#3b82f6',
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
      icon: '⚙️',
      bgColor: '#eff6ff',
    },
    shipped: {
      color: '#8b5cf6',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
      icon: '🚚',
      bgColor: '#f5f3ff',
    },
    out_for_delivery: {
      color: '#f59e0b',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      icon: '🏃',
      bgColor: '#fffbeb',
    },
    delivered: {
      color: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
      icon: '🎉',
      bgColor: '#ecfdf5',
    },
    cancelled: {
      color: '#ef4444',
      gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      icon: '❌',
      bgColor: '#fef2f2',
    },
    returned: {
      color: '#6b7280',
      gradient: 'linear-gradient(135deg, #6b7280 0%, #374151 100%)',
      icon: '↩️',
      bgColor: '#f9fafb',
    },
  };

  const cfg = statusConfig[newStatus] || {
    color: '#667eea',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    icon: '📦',
    bgColor: '#f0f7ff',
  };

  // Tracking info section (শুধু shipped হলে দেখাবে)
  const trackingHtml = trackingNumber
    ? `<div style="margin: 20px 0; padding: 20px; background-color: #f5f3ff; border-radius: 8px; border: 1px solid #8b5cf6;">
        <h3 style="margin-top: 0; color: #6d28d9; font-size: 16px;">📦 Tracking Information</h3>
        <p style="margin: 5px 0;"><strong>Tracking Number:</strong> <code style="background:#e5e7eb; padding: 2px 6px; border-radius: 4px;">${trackingNumber}</code></p>
        ${trackingUrl ? `<p style="margin: 10px 0;"><a href="${trackingUrl}" style="display: inline-block; background: #8b5cf6; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold;">🔍 Track Your Order</a></p>` : ''}
        ${estimatedDelivery ? `<p style="margin: 5px 0; font-size: 14px; color: #555;"><strong>Estimated Delivery:</strong> ${new Date(estimatedDelivery).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>` : ''}
       </div>`
    : '';

  // Items section (optional)
  const itemsHtml =
    items && items.length > 0
      ? `<h3 style="color: #333; border-bottom: 2px solid ${cfg.color}; padding-bottom: 10px;">Your Items:</h3>
       <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
         <thead><tr style="background-color: #f8f9fa;">
           <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Product</th>
           <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ddd;">Qty</th>
           <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Price</th>
         </tr></thead>
         <tbody>${items
           .map(
             (item) => `
           <tr>
             <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.productName}</td>
             <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
             <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${currency.toUpperCase()} ${(item.price * item.quantity).toFixed(2)}</td>
           </tr>`,
           )
           .join('')}
         </tbody>
       </table>`
      : '';

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"><title>Order Status Update</title></head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: ${cfg.gradient}; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <div style="font-size: 48px; margin-bottom: 10px;">${cfg.icon}</div>
        <h1 style="color: white; margin: 0; font-size: 24px;">${statusTitle}</h1>
        <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Order #${orderId}</p>
      </div>
      <div style="background-color: #ffffff; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px;">Hi <strong>${userName}</strong>,</p>
        <div style="background-color: ${cfg.bgColor}; padding: 15px 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${cfg.color};">
          <p style="margin: 0; font-size: 16px; color: #333;">${statusDescription}</p>
        </div>
        <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0; font-size: 14px;"><strong>Order ID:</strong> <code style="background:#e5e7eb; padding: 2px 6px; border-radius: 4px;">${orderId}</code></p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Status:</strong> <span style="color: ${cfg.color}; font-weight: bold; text-transform: capitalize;">${newStatus.replace(/_/g, ' ')}</span></p>
        </div>
        ${trackingHtml}
        ${itemsHtml}
      </div>
      <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
        <p>This is an automated email. Please do not reply to this message.</p>
        <p>&copy; ${new Date().getFullYear()} <strong>UNIVERSE</strong>. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
};

// ============================================================
// ORDER CANCELLED EMAIL TEMPLATE
// অর্ডার বাতিল হলে customer কে জানানোর জন্য
// ============================================================
export const getOrderCancelledEmailTemplate = (
  userName: string,
  orderId: string,
  cancellationReason: string,
  totalAmount: number,
  currency: string = 'usd',
  paymentMethod: string = 'stripe',
): string => {
  const refundMsg =
    paymentMethod === 'stripe'
      ? `<div style="background-color: #eff6ff; padding: 12px 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #3b82f6;">
        <p style="margin: 0; font-size: 14px;">💳 <strong>Refund Info:</strong> If you have been charged, a refund of <strong>${currency.toUpperCase()} ${totalAmount.toFixed(2)}</strong> will be processed to your original payment method within 5-7 business days.</p>
       </div>`
      : '';

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"><title>Order Cancelled</title></head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <div style="font-size: 48px; margin-bottom: 10px;">❌</div>
        <h1 style="color: white; margin: 0;">Order Cancelled</h1>
        <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0;">Order #${orderId}</p>
      </div>
      <div style="background-color: #ffffff; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px;">Hi <strong>${userName}</strong>,</p>
        <p style="font-size: 16px;">We're sorry to inform you that your order has been cancelled.</p>
        <div style="background-color: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
          <p style="margin: 5px 0;"><strong>Order ID:</strong> ${orderId}</p>
          <p style="margin: 5px 0;"><strong>Reason:</strong> ${cancellationReason}</p>
          <p style="margin: 5px 0;"><strong>Amount:</strong> ${currency.toUpperCase()} ${totalAmount.toFixed(2)}</p>
        </div>
        ${refundMsg}
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'https://your-store.com'}/products" style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">Continue Shopping →</a>
        </div>
      </div>
      <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
        <p>This is an automated email. Please do not reply to this message.</p>
        <p>&copy; ${new Date().getFullYear()} <strong>UNIVERSE</strong>. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
};

// Password Reset Email Template
export const getPasswordResetEmailTemplate = (
  userName: string,
  resetLink: string,
): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Password Reset</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Password Reset Request 🔐</h1>
      </div>
      <div style="background-color: #ffffff; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px;">Hi <strong>${userName}</strong>,</p>
        <p style="font-size: 16px;">We received a request to reset your password. Click the button below to set a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="display: inline-block; background: #667eea; color: white; padding: 14px 35px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">Reset Password →</a>
        </div>
        <p style="font-size: 14px; color: #666;">This link will expire in <strong>10 minutes</strong>. If you did not request a password reset, please ignore this email.</p>
      </div>
      <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
        <p>This is an automated email. Please do not reply to this message.</p>
        <p>&copy; ${new Date().getFullYear()} <strong>UNIVERSE</strong>. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
};
