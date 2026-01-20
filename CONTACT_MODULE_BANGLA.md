# Contact Management Module - বাংলা ডকুমেন্টেশন

## সংক্ষিপ্ত বিবরণ

সম্পূর্ণ Contact Form Management System যেখানে admin dashboard integration এবং email reply functionality আছে।

## ফিচারসমূহ

- ✅ Public contact form (কোনো authentication লাগবে না)
- 📧 Admin email reply system
- 📊 Contact statistics (dashboard এর জন্য)
- 🔍 Search এবং filter
- 🏷️ Status tracking (new, read, replied)
- 🗑️ Soft delete
- 🔐 Admin-only protected routes

## Backend সম্পূর্ণভাবে তৈরি হয়েছে

### তৈরি হওয়া ফাইলসমূহ:

1. **Interface** - `contact.interface.ts`
2. **Model** - `contact.model.ts`
3. **Validation** - `contact.validation.ts`
4. **Service** - `contact.service.ts`
5. **Controller** - `contact.controller.ts`
6. **Routes** - `contact.routes.ts`
7. **README** - বিস্তারিত documentation

## API Endpoints

### Public Endpoint (কোনো auth লাগবে না)

#### Contact Form Submit করা

```http
POST http://localhost:5000/api/contacts
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "subject": "Product Inquiry",
  "message": "I would like to know more..."
}
```

### Admin Endpoints (Admin token লাগবে)

#### 1. সব contacts দেখা

```http
GET /api/contacts
```

**Query Parameters:**

- `status` - Filter (new, read, replied)
- `searchTerm` - Search করা
- `page` - Page number
- `limit` - Per page items

#### 2. Contact Statistics (Dashboard এর জন্য)

```http
GET /api/contacts/stats
```

**Response:**

```json
{
  "total": 150,
  "new": 25,
  "read": 75,
  "replied": 50
}
```

#### 3. Single Contact দেখা

```http
GET /api/contacts/:id
```

#### 4. Status Update করা

```http
PATCH /api/contacts/:id/status

{
  "status": "read"
}
```

#### 5. User কে Reply Email পাঠানো

```http
POST /api/contacts/:id/reply

{
  "replyMessage": "Thank you for contacting us...",
  "adminName": "Support Team"
}
```

**এটি করবে:**

- ✅ User এর email এ সুন্দর HTML reply পাঠাবে
- ✅ Status "replied" তে change হবে
- ✅ Admin reply database এ save হবে

#### 6. Contact Delete করা

```http
DELETE /api/contacts/:id
```

## Frontend Integration

### 1. Contact Form Submit (আপনার frontend)

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
      toast.success('আপনার মেসেজ সফলভাবে পাঠানো হয়েছে!');
      // Form clear করুন
      setFormData({ name: '', email: '', subject: '', message: '' });
    } else {
      toast.error(data.message || 'মেসেজ পাঠাতে ব্যর্থ');
    }
  } catch (error) {
    toast.error('কিছু ভুল হয়েছে। আবার চেষ্টা করুন।');
  } finally {
    setIsSubmitting(false);
  }
};
```

### 2. Admin Dashboard - সব Contacts দেখা

```typescript
const fetchContacts = async () => {
  try {
    const response = await fetch(
      'http://localhost:5000/api/contacts?page=1&limit=10',
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

### 3. Admin Dashboard - Reply পাঠানো

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
      toast.success('Reply সফলভাবে পাঠানো হয়েছে!');
      fetchContacts(); // Refresh করুন
    }
  } catch (error) {
    toast.error('Reply পাঠাতে ব্যর্থ');
  }
};
```

### 4. Admin Dashboard - Statistics দেখা

```typescript
const fetchStats = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/contacts/stats', {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    const data = await response.json();
    setStats(data.data);
    // { total: 150, new: 25, read: 75, replied: 50 }
  } catch (error) {
    console.error('Failed to fetch stats:', error);
  }
};
```

## Admin Dashboard UI এর জন্য উদাহরণ

### Contact Card Component:

```tsx
<Card>
  <div className="flex justify-between items-start">
    <div>
      <Badge variant={contact.status === 'new' ? 'default' : 'secondary'}>
        {contact.status}
      </Badge>
      <h3 className="font-bold">{contact.name}</h3>
      <p className="text-sm text-gray-500">{contact.email}</p>
    </div>
    <Button onClick={() => setReplyModal(contact._id)}>Reply</Button>
  </div>

  <div className="mt-4">
    <p className="font-semibold">Subject: {contact.subject}</p>
    <p className="text-gray-700 mt-2">{contact.message}</p>
  </div>

  <div className="mt-4 text-xs text-gray-400">
    {new Date(contact.createdAt).toLocaleString('bn-BD')}
  </div>
</Card>
```

### Statistics Cards:

```tsx
<div className="grid grid-cols-4 gap-4">
  <Card>
    <CardHeader>
      <CardTitle>Total Messages</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-3xl font-bold">{stats.total}</p>
    </CardContent>
  </Card>

  <Card>
    <CardHeader>
      <CardTitle>New</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-3xl font-bold text-blue-600">{stats.new}</p>
    </CardContent>
  </Card>

  <Card>
    <CardHeader>
      <CardTitle>Read</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-3xl font-bold text-yellow-600">{stats.read}</p>
    </CardContent>
  </Card>

  <Card>
    <CardHeader>
      <CardTitle>Replied</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-3xl font-bold text-green-600">{stats.replied}</p>
    </CardContent>
  </Card>
</div>
```

### Reply Modal:

```tsx
<Dialog>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Reply to {selectedContact.name}</DialogTitle>
    </DialogHeader>

    <div className="space-y-4">
      <div>
        <label>Original Message:</label>
        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
          {selectedContact.message}
        </p>
      </div>

      <div>
        <label>Your Reply:</label>
        <Textarea
          value={replyMessage}
          onChange={(e) => setReplyMessage(e.target.value)}
          rows={6}
          placeholder="Write your reply here..."
        />
      </div>

      <Button onClick={() => handleReply(selectedContact._id, replyMessage)}>
        Send Reply Email
      </Button>
    </div>
  </DialogContent>
</Dialog>
```

## Database Schema

```typescript
{
  name: String,           // Required, max 100 chars
  email: String,          // Required, valid email
  subject: String,        // Required, max 200 chars
  message: String,        // Required, max 2000 chars
  status: String,         // 'new', 'read', 'replied'
  adminReply: String,     // Admin এর reply
  adminRepliedAt: Date,   // কখন reply করা হয়েছে
  adminRepliedBy: String, // কোন admin reply করেছে
  isDeleted: Boolean,     // Soft delete
  createdAt: Date,        // Auto
  updatedAt: Date         // Auto
}
```

## Status Flow

```
User form submit → Status: "new"
    ↓
Admin message দেখে → Status: "read" (optional)
    ↓
Admin reply পাঠায় → Status: "replied" + Email sent
```

## Email Template

Admin reply করলে user একটি সুন্দর HTML email পাবে যেখানে থাকবে:

- ✅ Admin এর reply (highlighted)
- 📩 Original message (context এর জন্য)
- 🎨 Professional design
- 📱 Responsive (mobile friendly)

## Testing

### Server চালান:

```bash
npm run dev
```

### Test করুন:

1. `test-contact.http` ফাইল খুলুন
2. Admin login করে token নিন
3. Token replace করুন
4. Test endpoints run করুন

## যা যা করতে হবে (Frontend এ):

### ১. Contact Form Page (Public):

- ✅ Form validation
- ✅ Loading state
- ✅ Success/error toast
- ✅ Form clear করা after submit

### ২. Admin Dashboard:

- ✅ Contact list with pagination
- ✅ Filter by status (new, read, replied)
- ✅ Search functionality
- ✅ Statistics cards
- ✅ Reply modal
- ✅ Mark as read button
- ✅ Delete confirmation

### ৩. Features যোগ করতে পারেন:

- 🔔 Real-time notification (new message আসলে)
- 📊 Charts (messages over time)
- 🏷️ Tags/categories
- ⭐ Priority system
- 📎 File attachments (future)

## Security

- ✅ Public endpoint: শুধু contact form submit
- ✅ Admin endpoints: JWT authentication required
- ✅ Input validation: Zod schema দিয়ে
- ✅ XSS protection: Input sanitization
- ✅ Rate limiting: Consider adding

## সাহায্য প্রয়োজন হলে

বিস্তারিত ইংরেজি documentation: `src/app/modules/Contact/README.md`

Testing guide: `test-contact.http`

Email setup: `EMAIL_SETUP_BANGLA.md`

## গুরুত্বপূর্ণ নোট

⚠️ **Email Configuration:**
Reply email পাঠাতে হলে `.env` ফাইলে email settings দিতে হবে:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM_NAME=Your Store Name
```

Email setup এর বিস্তারিত: `EMAIL_SETUP_BANGLA.md` দেখুন

✅ **সব কাজ সম্পন্ন!**
এখন আপনি frontend তৈরি করতে পারবেন।
