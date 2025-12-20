# Carousel Module

## Overview

Dynamic carousel management system for homepage hero slides with image upload support.

## API Endpoints

### Public Routes

#### Get All Carousel Slides

```
GET /api/carousel
```

Returns all carousel slides (both active and inactive).

#### Get Active Slides Only

```
GET /api/carousel/active
```

Returns only active slides sorted by order (used for frontend display).

#### Get Single Slide

```
GET /api/carousel/:id
```

Returns a specific carousel slide by ID.

---

### Admin Routes (Authentication Required)

#### Create New Slide

```
POST /api/carousel
Headers: Authorization: <accessToken>
Content-Type: multipart/form-data

Body (FormData):
- title: string (required)
- subtitle: string (required)
- badge: string (required)
- badgeSubtext: string (required)
- bgColor: string (required)
- buttonText: string (optional)
- buttonLink: string (optional)
- image: file (optional)
- isActive: boolean (optional, default: true)
- order: number (optional, auto-assigned)
```

#### Update Slide

```
PATCH /api/carousel/:id
Headers: Authorization: <accessToken>
Content-Type: multipart/form-data

Body (FormData): Same as create, all fields optional
```

#### Delete Slide

```
DELETE /api/carousel/:id
Headers: Authorization: <accessToken>
```

#### Toggle Slide Status

```
PATCH /api/carousel/:id/toggle
Headers: Authorization: <accessToken>
Content-Type: application/json

Body:
{
  "isActive": boolean
}
```

#### Reorder Slides

```
PATCH /api/carousel/reorder
Headers: Authorization: <accessToken>
Content-Type: application/json

Body:
{
  "slides": [
    { "id": "slide_id_1", "order": 0 },
    { "id": "slide_id_2", "order": 1 }
  ]
}
```

## Data Model

```typescript
{
  _id: ObjectId,
  title: string,           // Main heading
  subtitle: string,        // Secondary text
  badge: string,          // Badge text (e.g., "20% OFF")
  badgeSubtext: string,   // Badge subtext (e.g., "on first order")
  bgColor: string,        // CSS gradient class
  image?: string,         // Cloudinary URL (optional)
  buttonText?: string,    // CTA button text (optional)
  buttonLink?: string,    // CTA button link (optional)
  isActive: boolean,      // Visibility status
  order: number,          // Display order
  createdAt: Date,
  updatedAt: Date
}
```

## Features

✅ **Image Upload** - Cloudinary integration with automatic upload  
✅ **Authentication** - Admin-only routes protected  
✅ **Validation** - Comprehensive Zod validation  
✅ **Auto-ordering** - Automatic order assignment  
✅ **Status Toggle** - Show/hide slides without deletion  
✅ **Reorder** - Drag-and-drop order management  
✅ **TypeScript** - Full type safety  
✅ **Error Handling** - Proper error messages

## Usage Example

### Frontend Integration (Next.js)

```typescript
// Fetch active slides for homepage
const response = await fetch('http://your-api.com/api/carousel/active');
const { data: slides } = await response.json();

// Create new slide
const formData = new FormData();
formData.append('title', 'Welcome Sale');
formData.append('subtitle', 'Get 30% OFF');
formData.append('badge', '30% OFF');
formData.append('badgeSubtext', 'Limited time');
formData.append('bgColor', 'bg-linear-to-r from-blue-400 to-blue-600');
formData.append('image', imageFile);
formData.append('isActive', 'true');

const response = await fetch('http://your-api.com/api/carousel', {
  method: 'POST',
  headers: {
    Authorization: accessToken,
  },
  body: formData,
});
```

## Environment Variables Required

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## File Structure

```
carousel/
├── carousel.interface.ts    # TypeScript interfaces
├── carousel.model.ts        # Mongoose schema
├── carousel.validation.ts   # Zod validation schemas
├── carousel.service.ts      # Business logic
├── carousel.controller.ts   # Request handlers
├── carousel.routes.ts       # Route definitions
└── README.md               # Documentation
```
