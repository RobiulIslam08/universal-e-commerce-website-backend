# Contact Module - Quick Reference (Frontend Developer Guide)

## 🎯 Overview

Complete backend ready for Contact Form with Admin Dashboard integration.

---

## 📍 API Endpoints Summary

### Base URL: `http://localhost:5000/api/contacts`

| Method | Endpoint      | Auth     | Description         |
| ------ | ------------- | -------- | ------------------- |
| POST   | `/`           | ❌ No    | Submit contact form |
| GET    | `/`           | ✅ Admin | Get all contacts    |
| GET    | `/stats`      | ✅ Admin | Get statistics      |
| GET    | `/:id`        | ✅ Admin | Get single contact  |
| PATCH  | `/:id/status` | ✅ Admin | Update status       |
| POST   | `/:id/reply`  | ✅ Admin | Send reply email    |
| DELETE | `/:id`        | ✅ Admin | Delete contact      |

---

## 🎨 Frontend Integration Code

### 1️⃣ Contact Form Submission (Your Current Page)

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
      toast.success('Nachricht erfolgreich gesendet! Wir melden uns bald.');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } else {
      toast.error(data.message || 'Fehler beim Senden der Nachricht');
    }
  } catch (error) {
    toast.error('Etwas ist schief gelaufen. Bitte versuchen Sie es erneut.');
  } finally {
    setIsSubmitting(false);
  }
};
```

### 2️⃣ Admin Dashboard - Fetch Contacts

```typescript
// State
const [contacts, setContacts] = useState([]);
const [stats, setStats] = useState({ total: 0, new: 0, read: 0, replied: 0 });
const [page, setPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);

// Fetch all contacts
const fetchContacts = async (status?: string, search?: string) => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: '10',
      ...(status && { status }),
      ...(search && { searchTerm: search }),
    });

    const response = await fetch(
      `http://localhost:5000/api/contacts?${params}`,
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      },
    );

    const data = await response.json();

    if (data.success) {
      setContacts(data.data);
      setTotalPages(data.meta.totalPages);
    }
  } catch (error) {
    toast.error('Fehler beim Laden der Kontakte');
  }
};

// Fetch statistics
const fetchStats = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/contacts/stats', {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    const data = await response.json();
    if (data.success) {
      setStats(data.data);
    }
  } catch (error) {
    console.error('Stats fetch error:', error);
  }
};
```

### 3️⃣ Admin Dashboard - Reply to Contact

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
          adminName: 'Support Team', // Optional
        }),
      },
    );

    const data = await response.json();

    if (data.success) {
      toast.success('Antwort erfolgreich gesendet!');
      fetchContacts(); // Refresh list
      setReplyModal(false);
    } else {
      toast.error('Fehler beim Senden der Antwort');
    }
  } catch (error) {
    toast.error('Netzwerkfehler');
  }
};
```

### 4️⃣ Admin Dashboard - Update Status

```typescript
const markAsRead = async (contactId: string) => {
  try {
    const response = await fetch(
      `http://localhost:5000/api/contacts/${contactId}/status`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ status: 'read' }),
      },
    );

    const data = await response.json();

    if (data.success) {
      fetchContacts(); // Refresh
    }
  } catch (error) {
    console.error('Update error:', error);
  }
};
```

### 5️⃣ Admin Dashboard - Delete Contact

```typescript
const deleteContact = async (contactId: string) => {
  if (!confirm('Möchten Sie diese Nachricht wirklich löschen?')) return;

  try {
    const response = await fetch(
      `http://localhost:5000/api/contacts/${contactId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      },
    );

    const data = await response.json();

    if (data.success) {
      toast.success('Kontakt gelöscht');
      fetchContacts();
    }
  } catch (error) {
    toast.error('Fehler beim Löschen');
  }
};
```

---

## 🎨 Admin Dashboard UI Components

### Statistics Cards Component

```tsx
<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Gesamt</p>
          <p className="text-3xl font-bold">{stats.total}</p>
        </div>
        <MessageSquare className="w-10 h-10 text-gray-400" />
      </div>
    </CardContent>
  </Card>

  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Neue</p>
          <p className="text-3xl font-bold text-blue-600">{stats.new}</p>
        </div>
        <Mail className="w-10 h-10 text-blue-400" />
      </div>
    </CardContent>
  </Card>

  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Gelesen</p>
          <p className="text-3xl font-bold text-yellow-600">{stats.read}</p>
        </div>
        <Eye className="w-10 h-10 text-yellow-400" />
      </div>
    </CardContent>
  </Card>

  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Beantwortet</p>
          <p className="text-3xl font-bold text-green-600">{stats.replied}</p>
        </div>
        <CheckCircle className="w-10 h-10 text-green-400" />
      </div>
    </CardContent>
  </Card>
</div>
```

### Contact List Component

```tsx
<div className="space-y-4">
  {contacts.map((contact) => (
    <Card key={contact._id} className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Badge
                variant={
                  contact.status === 'new'
                    ? 'default'
                    : contact.status === 'read'
                      ? 'secondary'
                      : 'success'
                }
              >
                {contact.status}
              </Badge>
              <h3 className="font-bold text-lg">{contact.name}</h3>
            </div>

            <p className="text-sm text-gray-500 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              {contact.email}
            </p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => viewContact(contact._id)}>
                Ansehen
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openReplyModal(contact)}>
                Antworten
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => markAsRead(contact._id)}>
                Als gelesen markieren
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => deleteContact(contact._id)}
                className="text-red-600"
              >
                Löschen
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mb-4">
          <p className="font-semibold text-gray-800">
            Betreff: {contact.subject}
          </p>
          <p className="text-gray-600 mt-2 line-clamp-2">{contact.message}</p>
        </div>

        <div className="flex justify-between items-center text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(contact.createdAt).toLocaleString('de-DE')}
          </span>

          {contact.adminRepliedAt && (
            <span className="text-green-600">
              Beantwortet:{' '}
              {new Date(contact.adminRepliedAt).toLocaleDateString('de-DE')}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  ))}
</div>
```

### Reply Modal Component

```tsx
<Dialog open={replyModalOpen} onOpenChange={setReplyModalOpen}>
  <DialogContent className="max-w-2xl">
    <DialogHeader>
      <DialogTitle>Antwort an {selectedContact?.name}</DialogTitle>
    </DialogHeader>

    <div className="space-y-4">
      {/* Original Message */}
      <div>
        <label className="text-sm font-semibold text-gray-700">
          Ursprüngliche Nachricht:
        </label>
        <div className="mt-2 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <strong>Betreff:</strong> {selectedContact?.subject}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            {selectedContact?.message}
          </p>
        </div>
      </div>

      {/* Reply Input */}
      <div>
        <label className="text-sm font-semibold text-gray-700">
          Ihre Antwort:
        </label>
        <Textarea
          value={replyMessage}
          onChange={(e) => setReplyMessage(e.target.value)}
          rows={8}
          className="mt-2"
          placeholder="Schreiben Sie hier Ihre Antwort..."
        />
      </div>

      {/* Admin Name (Optional) */}
      <div>
        <label className="text-sm font-semibold text-gray-700">
          Ihr Name (optional):
        </label>
        <Input
          value={adminName}
          onChange={(e) => setAdminName(e.target.value)}
          placeholder="Support Team"
          className="mt-2"
        />
      </div>
    </div>

    <DialogFooter>
      <Button variant="outline" onClick={() => setReplyModalOpen(false)}>
        Abbrechen
      </Button>
      <Button
        onClick={() => handleReply(selectedContact._id, replyMessage)}
        disabled={!replyMessage.trim()}
      >
        <Send className="w-4 h-4 mr-2" />
        Antwort senden
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Filter and Search Component

```tsx
<div className="flex gap-4 mb-6">
  {/* Status Filter */}
  <Select value={statusFilter} onValueChange={setStatusFilter}>
    <SelectTrigger className="w-[180px]">
      <SelectValue placeholder="Status filtern" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">Alle</SelectItem>
      <SelectItem value="new">Neue</SelectItem>
      <SelectItem value="read">Gelesen</SelectItem>
      <SelectItem value="replied">Beantwortet</SelectItem>
    </SelectContent>
  </Select>

  {/* Search */}
  <div className="flex-1">
    <Input
      placeholder="Suche nach Name, E-Mail, Betreff..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="w-full"
    />
  </div>

  <Button onClick={() => fetchContacts(statusFilter, searchTerm)}>
    <Search className="w-4 h-4 mr-2" />
    Suchen
  </Button>
</div>
```

### Pagination Component

```tsx
<div className="flex justify-center items-center gap-4 mt-6">
  <Button
    variant="outline"
    disabled={page === 1}
    onClick={() => setPage(page - 1)}
  >
    <ChevronLeft className="w-4 h-4" />
    Zurück
  </Button>

  <span className="text-sm text-gray-600">
    Seite {page} von {totalPages}
  </span>

  <Button
    variant="outline"
    disabled={page === totalPages}
    onClick={() => setPage(page + 1)}
  >
    Weiter
    <ChevronRight className="w-4 h-4" />
  </Button>
</div>
```

---

## 📊 TypeScript Types (for Frontend)

```typescript
// Contact Type
interface Contact {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied';
  adminReply?: string;
  adminRepliedAt?: string;
  adminRepliedBy?: string;
  createdAt: string;
  updatedAt: string;
}

// Statistics Type
interface ContactStats {
  total: number;
  new: number;
  read: number;
  replied: number;
}

// API Response Type
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
```

---

## ✅ Testing Checklist

### Contact Form (Public):

- [ ] Form validation working
- [ ] Submit button disabled while loading
- [ ] Success toast appears
- [ ] Form clears after success
- [ ] Error handling works

### Admin Dashboard:

- [ ] Statistics cards showing correct numbers
- [ ] Contact list loads with pagination
- [ ] Filter by status works
- [ ] Search functionality works
- [ ] Reply modal opens
- [ ] Reply email sends successfully
- [ ] Status update works
- [ ] Delete confirmation and deletion works
- [ ] Pagination works

---

## 🚀 Next Steps

1. ✅ **Backend Complete** - All endpoints ready
2. 📝 **Frontend Tasks:**

   - Integrate contact form
   - Create admin dashboard page
   - Add statistics cards
   - Implement contact list
   - Create reply modal
   - Add filters and search

3. 📧 **Email Setup:**
   - Configure `.env` file
   - Test email delivery
   - Customize email template if needed

---

## 📚 Documentation Files

- `CONTACT_MODULE_BANGLA.md` - বাংলা ডকুমেন্টেশন
- `src/app/modules/Contact/README.md` - Detailed English docs
- `test-contact.http` - API testing file

---

**All backend work is complete! Now you can start building the frontend. Good luck! 🎉**
