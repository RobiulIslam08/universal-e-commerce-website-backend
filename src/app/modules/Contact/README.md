# Contact Management Module

## Overview

Complete contact form management system with admin dashboard integration and email reply functionality.

## Features

- ✅ Public contact form submission (no authentication required)
- 📧 Email reply system for admins
- 📊 Contact statistics for dashboard
- 🔍 Search and filter functionality
- 🏷️ Status tracking (new, read, replied)
- 🗑️ Soft delete functionality
- 🔐 Admin-only protected routes

## API Endpoints

### Public Endpoints

#### 1. Submit Contact Form

```http
POST /api/contacts
```

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "subject": "Product Inquiry",
  "message": "I would like to know more about your products..."
}
```

**Response:**

```json
{
  "success": true,
  "message": "Contact message submitted successfully",
  "data": {
    "_id": "65f7b8c9d1234567890abcde",
    "name": "John Doe",
    "email": "john@example.com",
    "subject": "Product Inquiry",
    "message": "I would like to know more about your products...",
    "status": "new",
    "isDeleted": false,
    "createdAt": "2024-01-19T10:30:00.000Z",
    "updatedAt": "2024-01-19T10:30:00.000Z"
  }
}
```

### Admin Endpoints (Require Authentication)

#### 2. Get All Contacts (with filters)

```http
GET /api/contacts
Authorization: Bearer <admin_token>
```

**Query Parameters:**

- `status` - Filter by status (new, read, replied)
- `searchTerm` - Search in name, email, subject, message
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `sortBy` - Sort field (default: createdAt)
- `sortOrder` - asc or desc (default: desc)

**Example:**

```http
GET /api/contacts?status=new&page=1&limit=20&searchTerm=product
```

**Response:**

```json
{
  "success": true,
  "message": "Contacts retrieved successfully",
  "data": [
    {
      "_id": "65f7b8c9d1234567890abcde",
      "name": "John Doe",
      "email": "john@example.com",
      "subject": "Product Inquiry",
      "message": "I would like to know more...",
      "status": "new",
      "createdAt": "2024-01-19T10:30:00.000Z"
    }
  ],
  "meta": {
    "total": 45,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

#### 3. Get Single Contact

```http
GET /api/contacts/:id
Authorization: Bearer <admin_token>
```

#### 4. Update Contact Status

```http
PATCH /api/contacts/:id/status
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "status": "read"
}
```

**Allowed Status Values:**

- `new` - New unread message
- `read` - Marked as read
- `replied` - Admin has replied

#### 5. Reply to Contact

```http
POST /api/contacts/:id/reply
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "replyMessage": "Thank you for contacting us. Here's our response...",
  "adminName": "Support Team"
}
```

**What Happens:**

- Email sent to user with reply
- Contact status changed to "replied"
- adminReply, adminRepliedAt, adminRepliedBy fields updated
- User receives beautifully formatted HTML email

**Response:**

```json
{
  "success": true,
  "message": "Reply sent successfully",
  "data": {
    "_id": "65f7b8c9d1234567890abcde",
    "name": "John Doe",
    "email": "john@example.com",
    "status": "replied",
    "adminReply": "Thank you for contacting us...",
    "adminRepliedAt": "2024-01-19T14:30:00.000Z",
    "adminRepliedBy": "Support Team"
  }
}
```

#### 6. Delete Contact

```http
DELETE /api/contacts/:id
Authorization: Bearer <admin_token>
```

**Note:** This is a soft delete. Contact is marked as deleted but not removed from database.

#### 7. Get Contact Statistics (Dashboard)

```http
GET /api/contacts/stats
Authorization: Bearer <admin_token>
```

**Response:**

```json
{
  "success": true,
  "message": "Contact statistics retrieved successfully",
  "data": {
    "total": 150,
    "new": 25,
    "read": 75,
    "replied": 50
  }
}
```

## Frontend Integration

### 1. Submit Contact Form (Public)

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSubmitting(true);

  try {
    const response = await fetch('http://localhost:5000/api/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    if (data.success) {
      toast.success("Message sent successfully! We'll get back to you soon.");
      setFormData({ name: '', email: '', subject: '', message: '' });
    } else {
      toast.error(data.message || 'Failed to send message');
    }
  } catch (error) {
    toast.error('Something went wrong. Please try again.');
  } finally {
    setIsSubmitting(false);
  }
};
```

### 2. Admin Dashboard - Get All Contacts

```typescript
const fetchContacts = async () => {
  try {
    const response = await fetch(
      'http://localhost:5000/api/contacts?status=new&page=1&limit=10',
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      },
    );

    const data = await response.json();
    setContacts(data.data);
    setMeta(data.meta);
  } catch (error) {
    console.error('Failed to fetch contacts:', error);
  }
};
```

### 3. Admin Dashboard - Reply to Contact

```typescript
const handleReply = async (contactId: string, replyMessage: string) => {
  try {
    const response = await fetch(
      `http://localhost:5000/api/contacts/${contactId}/reply`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          replyMessage: replyMessage,
          adminName: 'Support Team',
        }),
      },
    );

    const data = await response.json();

    if (data.success) {
      toast.success('Reply sent successfully!');
      // Refresh contacts list
      fetchContacts();
    }
  } catch (error) {
    toast.error('Failed to send reply');
  }
};
```

### 4. Admin Dashboard - Get Statistics

```typescript
const fetchStats = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/contacts/stats', {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    const data = await response.json();
    setStats(data.data); // { total: 150, new: 25, read: 75, replied: 50 }
  } catch (error) {
    console.error('Failed to fetch stats:', error);
  }
};
```

## Database Schema

```typescript
{
  name: String,           // Required, max 100 chars
  email: String,          // Required, valid email
  subject: String,        // Required, max 200 chars
  message: String,        // Required, max 2000 chars
  status: String,         // Enum: 'new', 'read', 'replied'
  adminReply: String,     // Optional, admin's reply message
  adminRepliedAt: Date,   // Optional, when admin replied
  adminRepliedBy: String, // Optional, admin name/email
  isDeleted: Boolean,     // Soft delete flag
  createdAt: Date,        // Auto-generated
  updatedAt: Date         // Auto-generated
}
```

## Email Template

When admin replies, user receives a professional HTML email containing:

- Welcome message
- Admin's reply (highlighted)
- Original message for context
- Professional formatting with your brand colors
- Responsive design

## Status Flow

```
User submits form → Status: "new"
    ↓
Admin views message → Status: "read" (optional)
    ↓
Admin replies → Status: "replied" + Email sent
```

## Search Functionality

Search works across multiple fields:

- Name
- Email
- Subject
- Message

Example: Searching "product" will find contacts with "product" in any of these fields.

## Best Practices

### For Frontend:

1. **Show loading states** during submission
2. **Clear form** after successful submission
3. **Show success/error toasts** for user feedback
4. **Validate input** before sending (client-side validation)
5. **Handle network errors** gracefully

### For Admin Dashboard:

1. **Implement pagination** for large contact lists
2. **Add filters** (status, date range)
3. **Show badge counts** for new messages
4. **Real-time updates** (optional: use WebSocket or polling)
5. **Confirmation modal** before deleting

## Security

- Public endpoint: Contact form (no auth required)
- Admin endpoints: Protected with JWT authentication
- Only admins can:
  - View all contacts
  - Reply to contacts
  - Delete contacts
  - View statistics

## Example Admin Dashboard UI Ideas

### Contact Card Component:

```tsx
<Card>
  <div className="flex justify-between">
    <div>
      <Badge>{contact.status}</Badge>
      <h3>{contact.name}</h3>
      <p>{contact.email}</p>
    </div>
    <div>
      <Button onClick={() => handleReply(contact._id)}>Reply</Button>
    </div>
  </div>
  <p>
    <strong>Subject:</strong> {contact.subject}
  </p>
  <p>{contact.message}</p>
  <small>{new Date(contact.createdAt).toLocaleString()}</small>
</Card>
```

### Stats Dashboard:

```tsx
<div className="grid grid-cols-4 gap-4">
  <StatCard title="Total" value={stats.total} />
  <StatCard title="New" value={stats.new} color="blue" />
  <StatCard title="Read" value={stats.read} color="yellow" />
  <StatCard title="Replied" value={stats.replied} color="green" />
</div>
```

## Testing

Test the endpoints using the provided `.http` file:

```http
### Create Contact (Public)
POST {{baseUrl}}/api/contacts
Content-Type: application/json

{
  "name": "Test User",
  "email": "test@example.com",
  "subject": "Test Subject",
  "message": "This is a test message"
}

### Get All Contacts (Admin)
GET {{baseUrl}}/api/contacts
Authorization: Bearer {{adminToken}}

### Reply to Contact (Admin)
POST {{baseUrl}}/api/contacts/{{contactId}}/reply
Authorization: Bearer {{adminToken}}
Content-Type: application/json

{
  "replyMessage": "Thank you for your message...",
  "adminName": "Support Team"
}
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error message here",
  "errorSources": [
    {
      "path": "email",
      "message": "Invalid email format"
    }
  ]
}
```

## Common HTTP Status Codes

- `201` - Contact created successfully
- `200` - Success (GET, PATCH, POST reply)
- `400` - Validation error
- `401` - Unauthorized (missing/invalid token)
- `404` - Contact not found
- `500` - Server error

---

For more details on email configuration, see `EMAIL_SETUP_GUIDE.md`
