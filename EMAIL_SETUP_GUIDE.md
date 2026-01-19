# Payment Confirmation Email Setup Guide

## Overview

This guide will help you set up automatic payment confirmation emails that are sent to customers after successful payment processing.

## Features

- ✅ Automatic email sending after successful payment
- 📧 Professional HTML email template
- 📦 Complete order details with itemized list
- 🚚 Shipping address information
- 💳 Payment transaction details
- 🎨 Beautiful, responsive email design

## Prerequisites

- Node.js and npm installed
- Email service provider (Gmail, Outlook, or custom SMTP)

## Installation

The required packages are already installed:

- `nodemailer` - For sending emails
- `@types/nodemailer` - TypeScript types

## Email Service Configuration

### Option 1: Gmail (Recommended for Development)

1. **Enable 2-Step Verification**

   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Enable 2-Step Verification

2. **Generate App Password**

   - Go to [App Passwords](https://myaccount.google.com/apppasswords)
   - Select "Mail" and your device
   - Copy the 16-character password

3. **Update .env file**
   ```env
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_16_character_app_password
   EMAIL_FROM_NAME=Your Store Name
   ```

### Option 2: Outlook/Hotmail

```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=your_email@outlook.com
EMAIL_PASS=your_password
EMAIL_FROM_NAME=Your Store Name
```

### Option 3: Custom SMTP Service

For services like SendGrid, Mailgun, AWS SES, etc.:

```env
EMAIL_HOST=your_smtp_host
EMAIL_PORT=587
EMAIL_USER=your_smtp_username
EMAIL_PASS=your_smtp_password
EMAIL_FROM_NAME=Your Store Name
```

## Environment Variables

Add these to your `.env` file:

```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM_NAME=E-Commerce Store
```

## How It Works

### 1. Payment Processing Flow

```typescript
// When payment succeeds in payment.service.ts
if (payload.status === 'succeeded') {
  // ... process payment and update inventory ...

  // Send confirmation email
  const emailHtml = getPaymentConfirmationEmailTemplate(
    payload.userName,
    payload.amount,
    payload.currency,
    payload.paymentIntentId,
    payload.items,
    payload.shippingAddress,
  );

  await sendEmail({
    to: payload.userEmail,
    subject: '✅ Payment Confirmation - Order Successful',
    html: emailHtml,
  });
}
```

### 2. Email Template

The email includes:

- Payment success confirmation
- Transaction ID
- Total amount paid
- Complete order details with items
- Shipping address
- Professional branded design

### 3. Error Handling

- Email sending errors won't disrupt payment processing
- Errors are logged for monitoring
- Payment success is independent of email delivery

## Testing

### 1. Test Payment Flow

```bash
# Start the server
npm run dev

# Make a test payment using Stripe test cards
# Card: 4242 4242 4242 4242
# Expiry: Any future date
# CVC: Any 3 digits
```

### 2. Check Email Delivery

After successful payment, check:

- User's email inbox
- Spam/junk folder (for first-time emails)
- Server logs for email confirmation

### 3. Server Logs

Look for these messages:

```
✅ Email sent successfully to: user@example.com
✅ Payment confirmation email sent to: user@example.com
```

## Email Template Customization

Edit the template in `src/app/utils/sendEmail.ts`:

```typescript
export const getPaymentConfirmationEmailTemplate = (
  userName: string,
  amount: number,
  currency: string,
  paymentIntentId: string,
  items: Array<{ ... }>,
  shippingAddress?: { ... },
): string => {
  // Customize HTML here
  return `
    <!DOCTYPE html>
    <html>
      <!-- Your custom email template -->
    </html>
  `;
};
```

## Production Deployment

### Important Checklist

- [ ] Use production SMTP service (not Gmail)
- [ ] Update `EMAIL_FROM_NAME` with your brand name
- [ ] Test email delivery thoroughly
- [ ] Set up email monitoring/logging service
- [ ] Consider using dedicated email service (SendGrid, Mailgun, AWS SES)
- [ ] Add email retry logic if needed
- [ ] Set up SPF, DKIM, and DMARC records for your domain

### Recommended Production Services

1. **SendGrid** - Free tier: 100 emails/day

   - Easy setup, reliable delivery
   - Good documentation

2. **Mailgun** - Free tier: 5,000 emails/month

   - Developer-friendly API
   - Great for transactional emails

3. **AWS SES** - Very cost-effective

   - $0.10 per 1,000 emails
   - Requires domain verification

4. **Postmark** - Specialized in transactional emails
   - Fast delivery
   - Good analytics

## Troubleshooting

### Email Not Sending

1. **Check environment variables**

   ```bash
   # Verify .env file has correct values
   echo $EMAIL_HOST
   echo $EMAIL_USER
   ```

2. **Check Gmail App Password**

   - Use 16-character app password, not regular password
   - Ensure 2-Step Verification is enabled

3. **Check port and security settings**
   - Port 587: TLS (most common)
   - Port 465: SSL
   - Port 25: Often blocked by ISPs

### Email Goes to Spam

1. **Add SPF record** to your domain

   ```
   v=spf1 include:_spf.google.com ~all
   ```

2. **Use professional email address**

   - Use business domain instead of Gmail
   - Example: noreply@yourdomain.com

3. **Warm up email sending**
   - Start with low volume
   - Gradually increase sending rate

### SMTP Connection Errors

1. **Check firewall settings**

   - Ensure ports 587/465 are not blocked

2. **Check SMTP credentials**

   - Verify username and password are correct
   - Check for special characters in password

3. **Check SMTP server status**
   - Gmail: [Google Workspace Status](https://www.google.com/appsstatus)

## File Structure

```
src/
├── app/
│   ├── config/
│   │   └── index.ts              # Email config added here
│   ├── utils/
│   │   └── sendEmail.ts          # Email utility and template
│   └── modules/
│       └── Payment/
│           └── payment.service.ts # Email sending logic
```

## API Reference

### sendEmail Function

```typescript
interface IEmailOptions {
  to: string;      // Recipient email
  subject: string; // Email subject
  html: string;    // HTML content
}

sendEmail(options: IEmailOptions): Promise<void>
```

### Email Template Function

```typescript
getPaymentConfirmationEmailTemplate(
  userName: string,
  amount: number,
  currency: string,
  paymentIntentId: string,
  items: Array<{
    productName: string;
    quantity: number;
    price: number;
  }>,
  shippingAddress?: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  },
): string
```

## Security Best Practices

1. **Never commit .env file** to version control
2. **Use App Passwords** for Gmail, not regular passwords
3. **Rotate credentials** regularly
4. **Use environment-specific configs** for dev/staging/prod
5. **Monitor email sending** for abuse/unusual activity
6. **Implement rate limiting** to prevent spam
7. **Validate email addresses** before sending

## Support

For issues or questions:

- Check server logs for detailed error messages
- Verify all environment variables are set correctly
- Test with a different email service if problems persist
- Check email service provider documentation

## License

Part of Universal E-Commerce Website Backend
