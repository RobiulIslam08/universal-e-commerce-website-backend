# Review Module

This module handles product reviews for the e-commerce application. Users can submit reviews without logging in.

## API Endpoints

### Public Endpoints (No Authentication Required)

#### 1. Create Review

- **POST** `/api/v1/reviews`
- **Description**: Submit a new review for a product
- **Body**:

```json
{
  "productId": "product_id_here",
  "reviewerName": "John Doe",
  "reviewerEmail": "john@example.com", // optional
  "rating": 5,
  "title": "Great product!", // optional
  "comment": "I really loved this product. It exceeded my expectations!"
}
```

#### 2. Get Reviews by Product

- **GET** `/api/v1/reviews/product/:productId`
- **Description**: Get all approved reviews for a specific product
- **Response**:

```json
{
  "success": true,
  "message": "Reviews retrieved successfully",
  "data": {
    "reviews": [...],
    "totalReviews": 10,
    "averageRating": 4.5,
    "ratingDistribution": {
      "5": 5,
      "4": 3,
      "3": 1,
      "2": 1,
      "1": 0
    }
  }
}
```

### Admin Endpoints

#### 3. Get All Reviews

- **GET** `/api/v1/reviews/admin/all`
- **Description**: Get all reviews (for admin panel)

#### 4. Get Pending Reviews

- **GET** `/api/v1/reviews/admin/pending`
- **Description**: Get reviews waiting for approval

#### 5. Get Single Review

- **GET** `/api/v1/reviews/:id`
- **Description**: Get a single review by ID

#### 6. Update Review

- **PATCH** `/api/v1/reviews/:id`
- **Description**: Update a review
- **Body** (all fields optional):

```json
{
  "reviewerName": "Updated Name",
  "rating": 4,
  "comment": "Updated comment",
  "isApproved": true
}
```

#### 7. Toggle Review Approval

- **PATCH** `/api/v1/reviews/admin/toggle-approval/:id`
- **Description**: Toggle approval status of a review

#### 8. Delete Review

- **DELETE** `/api/v1/reviews/:id`
- **Description**: Soft delete a review

## Frontend Integration Example

### Submit Review Form (React)

```jsx
import { useState } from 'react';

const ReviewForm = ({ productId }) => {
  const [formData, setFormData] = useState({
    reviewerName: '',
    reviewerEmail: '',
    rating: 5,
    title: '',
    comment: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/v1/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          productId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setFormData({
          reviewerName: '',
          reviewerEmail: '',
          rating: 5,
          title: '',
          comment: '',
        });
      }
    } catch (error) {
      console.error('Error submitting review:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Your Name"
        value={formData.reviewerName}
        onChange={(e) =>
          setFormData({ ...formData, reviewerName: e.target.value })
        }
        required
      />

      <input
        type="email"
        placeholder="Email (optional)"
        value={formData.reviewerEmail}
        onChange={(e) =>
          setFormData({ ...formData, reviewerEmail: e.target.value })
        }
      />

      <select
        value={formData.rating}
        onChange={(e) =>
          setFormData({ ...formData, rating: Number(e.target.value) })
        }
      >
        <option value={5}>5 Stars</option>
        <option value={4}>4 Stars</option>
        <option value={3}>3 Stars</option>
        <option value={2}>2 Stars</option>
        <option value={1}>1 Star</option>
      </select>

      <input
        type="text"
        placeholder="Review Title (optional)"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
      />

      <textarea
        placeholder="Write your review..."
        value={formData.comment}
        onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
        required
        minLength={10}
      />

      <button type="submit" disabled={loading}>
        {loading ? 'Submitting...' : 'Submit Review'}
      </button>

      {success && <p>Thank you for your review!</p>}
    </form>
  );
};
```

### Display Reviews (React)

```jsx
import { useState, useEffect } from 'react';

const ProductReviews = ({ productId }) => {
  const [reviewData, setReviewData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch(`/api/v1/reviews/product/${productId}`);
        const data = await response.json();

        if (data.success) {
          setReviewData(data.data);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [productId]);

  if (loading) return <p>Loading reviews...</p>;

  return (
    <div>
      <div className="review-summary">
        <h3>Customer Reviews</h3>
        <p>Average Rating: {reviewData.averageRating} / 5</p>
        <p>Total Reviews: {reviewData.totalReviews}</p>

        <div className="rating-distribution">
          {[5, 4, 3, 2, 1].map((star) => (
            <div key={star}>
              {star} stars: {reviewData.ratingDistribution[star]} reviews
            </div>
          ))}
        </div>
      </div>

      <div className="reviews-list">
        {reviewData.reviews.map((review) => (
          <div key={review._id} className="review-card">
            <div className="review-header">
              <span className="reviewer-name">{review.reviewerName}</span>
              <span className="rating">{'★'.repeat(review.rating)}</span>
            </div>
            {review.title && <h4>{review.title}</h4>}
            <p>{review.comment}</p>
            <small>{new Date(review.createdAt).toLocaleDateString()}</small>
          </div>
        ))}
      </div>
    </div>
  );
};
```

## Notes

- Reviews are auto-approved by default. Change `isApproved: true` to `false` in the model if you want manual approval.
- Email is optional but can be used for follow-up or verification.
- Soft delete is used - reviews are marked as deleted but not removed from database.
