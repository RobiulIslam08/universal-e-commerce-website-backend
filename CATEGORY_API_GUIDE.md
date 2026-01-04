# Category & Product API Documentation

## 🎯 Overview

এই backend system একটি scalable hierarchical category structure সহ e-commerce platform এর জন্য তৈরি করা হয়েছে। এখানে unlimited level এর category এবং subcategory support করে।

---

## 📁 Category Structure

### Category Hierarchy উদাহরণ:

```
Electronics (Level 0)
├── Mobile (Level 1)
│   ├── Android (Level 2)
│   └── iPhone (Level 2)
├── Laptop (Level 1)
└── Computer (Level 1)

Fashion (Level 0)
├── Men (Level 1)
│   ├── Shirt (Level 2)
│   ├── Pant (Level 2)
│   └── Shoes (Level 2)
├── Women (Level 1)
│   ├── Dress (Level 2)
│   ├── Saree (Level 2)
│   └── Shoes (Level 2)
└── Children (Level 1)
```

---

## 🔌 API Endpoints

### **Category APIs**

#### 1. Create Category

```http
POST /api/v1/categories/create-category
Content-Type: application/json

{
  "name": "Men",
  "slug": "men",
  "description": "Men's fashion collection",
  "image": "https://example.com/image.jpg",
  "parentCategory": null,  // null for root category
  "order": 1
}
```

#### 2. Get All Categories (Flat List)

```http
GET /api/v1/categories
```

**Response:**

```json
{
  "success": true,
  "message": "Categories retrieved successfully",
  "data": [
    {
      "_id": "...",
      "name": "Men",
      "slug": "men",
      "level": 0,
      "parentCategory": null
    }
  ]
}
```

#### 3. Get Category Tree (Hierarchical)

```http
GET /api/v1/categories/tree
```

**Response:**

```json
{
  "success": true,
  "message": "Category tree retrieved successfully",
  "data": [
    {
      "_id": "...",
      "name": "Fashion",
      "slug": "fashion",
      "level": 0,
      "productCount": 150,
      "children": [
        {
          "name": "Men",
          "slug": "men",
          "level": 1,
          "productCount": 75,
          "children": [...]
        }
      ]
    }
  ]
}
```

#### 4. Get Root Categories (Top Level)

```http
GET /api/v1/categories/root
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "name": "Electronics",
      "slug": "electronics",
      "level": 0,
      "productCount": 200
    },
    {
      "name": "Fashion",
      "slug": "fashion",
      "level": 0,
      "productCount": 150
    }
  ]
}
```

#### 5. Get Single Category with Subcategories

```http
GET /api/v1/categories/:slug
```

**Example:**

```http
GET /api/v1/categories/men
```

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "Men",
    "slug": "men",
    "level": 1,
    "productCount": 75,
    "subCategories": [
      {
        "name": "Shirt",
        "slug": "shirt",
        "level": 2,
        "productCount": 25
      },
      {
        "name": "Pant",
        "slug": "pant",
        "level": 2,
        "productCount": 30
      }
    ]
  }
}
```

#### 6. Get Subcategories of a Category

```http
GET /api/v1/categories/:slug/subcategories
```

**Example:**

```http
GET /api/v1/categories/electronics/subcategories
```

#### 7. Get Category Statistics

```http
GET /api/v1/categories/stats
```

**Response:**

```json
{
  "success": true,
  "data": {
    "totalCategories": 25,
    "rootCategories": 5,
    "topCategories": [
      { "_id": "electronics", "count": 200 },
      { "_id": "fashion", "count": 150 }
    ]
  }
}
```

---

### **Product APIs**

#### 1. Get Products by Category

```http
GET /api/v1/products/category/:category
```

**Query Parameters:**

- `subCategory` - Filter by subcategory
- `minPrice` - Minimum price
- `maxPrice` - Maximum price
- `sortBy` - Sort field (default: createdAt)
- `sortOrder` - asc/desc (default: desc)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 12)
- `searchTerm` - Search within category

**Examples:**

```http
# Get all products in "men" category
GET /api/v1/products/category/men?page=1&limit=12

# Get only shirts from men category
GET /api/v1/products/category/men?subCategory=shirt

# Get men's products with price filter
GET /api/v1/products/category/men?minPrice=500&maxPrice=2000

# Search within men's category
GET /api/v1/products/category/men?searchTerm=casual

# Get mobile phones from electronics
GET /api/v1/products/category/electronics?subCategory=mobile
```

**Response:**

```json
{
  "success": true,
  "message": "Products in category 'men' retrieved successfully",
  "meta": {
    "page": 1,
    "limit": 12,
    "total": 75,
    "totalPage": 7
  },
  "data": [
    {
      "_id": "...",
      "title": "Casual Shirt",
      "category": "men",
      "subCategory": "shirt",
      "price": 1200,
      "rating": 4.5,
      "soldCount": 150
    }
  ]
}
```

#### 2. Get Best Seller Products

```http
GET /api/v1/products/best-sellers?limit=10
```

**Response:**

```json
{
  "success": true,
  "message": "Best seller products retrieved successfully",
  "data": [
    {
      "title": "Popular Product",
      "price": 1500,
      "soldCount": 500,
      "rating": 4.8
    }
  ]
}
```

#### 3. Get Featured Products

```http
GET /api/v1/products/featured?limit=10
```

#### 4. Search Products (Global)

```http
GET /api/v1/products/search?q=shirt
```

#### 5. Get All Products with Filters

```http
GET /api/v1/products?category=men&subCategory=shirt&minPrice=500&maxPrice=2000
```

---

## 🎨 Frontend Integration Guide

### 1. **Category Page Setup**

```typescript
// pages/category/[slug].tsx or app/category/[slug]/page.tsx

interface CategoryPageProps {
  params: { slug: string };
  searchParams: {
    subCategory?: string;
    minPrice?: string;
    maxPrice?: string;
    page?: string;
  };
}

export default async function CategoryPage({
  params,
  searchParams
}: CategoryPageProps) {
  // Fetch category info with subcategories
  const categoryData = await fetch(
    `${API_URL}/categories/${params.slug}`
  ).then(res => res.json());

  // Fetch products for this category
  const productsData = await fetch(
    `${API_URL}/products/category/${params.slug}?${new URLSearchParams(searchParams)}`
  ).then(res => res.json());

  // Fetch best sellers
  const bestSellers = await fetch(
    `${API_URL}/products/best-sellers?limit=5`
  ).then(res => res.json());

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Sidebar */}
      <aside className="col-span-3">
        <FilterSidebar
          category={categoryData.data}
          subCategories={categoryData.data.subCategories}
        />

        <BestSellersSidebar products={bestSellers.data} />
      </aside>

      {/* Product Grid */}
      <main className="col-span-9">
        <ProductGrid products={productsData.data} />
        <Pagination meta={productsData.meta} />
      </main>
    </div>
  );
}
```

### 2. **Filter Sidebar Component**

```typescript
// components/FilterSidebar.tsx

interface FilterSidebarProps {
  category: any;
  subCategories: any[];
}

export function FilterSidebar({ category, subCategories }: FilterSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSubCategoryFilter = (subCategorySlug: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('subCategory', subCategorySlug);
    params.set('page', '1'); // Reset to first page
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      {/* Category Info */}
      <div>
        <h2 className="text-2xl font-bold">{category.name}</h2>
        <p className="text-sm text-gray-600">
          {category.productCount} products
        </p>
      </div>

      {/* Subcategories Filter */}
      <div>
        <h3 className="font-semibold mb-3">Categories</h3>
        <ul className="space-y-2">
          {subCategories.map((sub) => (
            <li key={sub.slug}>
              <button
                onClick={() => handleSubCategoryFilter(sub.slug)}
                className="flex justify-between w-full hover:text-primary"
              >
                <span>{sub.name}</span>
                <span className="text-gray-500">({sub.productCount})</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Price Range Filter */}
      <PriceRangeFilter />
    </div>
  );
}
```

### 3. **Category Navigation**

```typescript
// components/CategoryNav.tsx

export function CategoryNav() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/categories/root`)
      .then(res => res.json())
      .then(data => setCategories(data.data));
  }, []);

  return (
    <nav className="flex gap-4">
      {categories.map((cat) => (
        <Link
          key={cat.slug}
          href={`/category/${cat.slug}`}
          className="flex items-center gap-2"
        >
          <span>{cat.name}</span>
          <span className="text-xs text-gray-500">
            ({cat.productCount})
          </span>
        </Link>
      ))}
    </nav>
  );
}
```

### 4. **Updated Add Product Form**

```typescript
// Update your form to fetch categories dynamically

const [categories, setCategories] = useState([]);
const [subCategories, setSubCategories] = useState([]);

// Fetch root categories on mount
useEffect(() => {
  fetch(`${API_URL}/categories/root`)
    .then(res => res.json())
    .then(data => setCategories(data.data));
}, []);

// Fetch subcategories when category changes
useEffect(() => {
  if (selectedCategorySlug) {
    fetch(`${API_URL}/categories/${selectedCategorySlug}/subcategories`)
      .then(res => res.json())
      .then(data => setSubCategories(data.data));
  }
}, [selectedCategorySlug]);

// In your form:
<Select value={field.value} onValueChange={field.onChange}>
  <SelectTrigger>
    <SelectValue placeholder="Select category" />
  </SelectTrigger>
  <SelectContent>
    {categories.map((cat) => (
      <SelectItem key={cat.slug} value={cat.slug}>
        {cat.name} ({cat.productCount})
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

---

## 🗄️ Database Setup

### Sample Categories to Insert:

```javascript
// Run this in MongoDB or create a seed file

const categories = [
  // Root Categories
  {
    name: 'Electronics',
    slug: 'electronics',
    level: 0,
    parentCategory: null,
    order: 1,
  },
  {
    name: 'Fashion',
    slug: 'fashion',
    level: 0,
    parentCategory: null,
    order: 2,
  },

  // Electronics Subcategories
  {
    name: 'Mobile',
    slug: 'mobile',
    level: 1,
    parentCategory: 'electronics',
    order: 1,
  },
  {
    name: 'Laptop',
    slug: 'laptop',
    level: 1,
    parentCategory: 'electronics',
    order: 2,
  },
  {
    name: 'Computer',
    slug: 'computer',
    level: 1,
    parentCategory: 'electronics',
    order: 3,
  },
  {
    name: 'Speaker',
    slug: 'speaker',
    level: 1,
    parentCategory: 'electronics',
    order: 4,
  },

  // Fashion Subcategories
  { name: 'Men', slug: 'men', level: 1, parentCategory: 'fashion', order: 1 },
  {
    name: 'Women',
    slug: 'women',
    level: 1,
    parentCategory: 'fashion',
    order: 2,
  },
  {
    name: 'Children',
    slug: 'children',
    level: 1,
    parentCategory: 'fashion',
    order: 3,
  },

  // Men's Subcategories
  { name: 'Shirt', slug: 'shirt', level: 2, parentCategory: 'men', order: 1 },
  { name: 'Pant', slug: 'pant', level: 2, parentCategory: 'men', order: 2 },
  { name: 'Shoes', slug: 'shoes', level: 2, parentCategory: 'men', order: 3 },
];

// Insert via API or directly in DB
```

---

## 🚀 Key Features

✅ **Hierarchical Category System** - Unlimited levels  
✅ **Product Count by Category** - Real-time count  
✅ **Best Seller Products** - Based on soldCount  
✅ **Featured Products** - Admin curated  
✅ **Advanced Filtering** - Category, subcategory, price range  
✅ **Search within Category** - Category-specific search  
✅ **Pagination** - Efficient data loading  
✅ **Indexed Database** - Fast queries  
✅ **Scalable Structure** - Easy to extend

---

## 📝 Product Model Updates

এখন Product model এ নতুন fields যোগ করা হয়েছে:

- `tags` - Additional search tags
- `brand` - Product brand
- `rating` - Average rating (0-5)
- `reviewCount` - Number of reviews
- `soldCount` - Number sold (for best sellers)
- `isFeatured` - Featured product flag
- `isBestSeller` - Best seller flag

---

## 🎯 Usage Flow

1. **User clicks "Men" category**

   - Navigate to `/category/men`
   - API: `GET /api/v1/categories/men` (get category info)
   - API: `GET /api/v1/products/category/men` (get products)

2. **User filters by "Shirt" subcategory**

   - API: `GET /api/v1/products/category/men?subCategory=shirt`

3. **Sidebar shows:**

   - All subcategories with counts
   - Price range filter
   - Best seller products (from `GET /api/v1/products/best-sellers`)

4. **Product Creation:**
   - Admin selects "Fashion" → then "Men" → then "Shirt"
   - Product saved with: `category: "men"`, `subCategory: "shirt"`

---

এই backend system সম্পূর্ণ scalable এবং আপনার Next.js frontend এর সাথে পুরোপুরি compatible। যেকোনো level এর category add করতে পারবেন এবং সহজেই manage করতে পারবেন! 🚀
