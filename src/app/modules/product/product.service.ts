import { TProduct } from './product.interface';
import { Product } from './product.model';

// Search query interface
type TProductQuery = {
  searchTerm?: string;
  category?: string;
  subCategory?: string;
  minPrice?: string;
  maxPrice?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: string;
  limit?: string;
};

const createProductIntoDB = async (payload: TProduct) => {
  const result = await Product.create(payload);
  return result;
};

// const getAllProductsFromDB = async (query: TProductQuery) => {
//   const {
//     searchTerm,
//     category,
//     subCategory,
//     minPrice,
//     maxPrice,
//     sortBy = 'createdAt',
//     sortOrder = 'desc',
//     page = '1',
//     limit = '10',
//   } = query;

//   // Build filter object
//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   const filter: any = { isDeleted: { $ne: true } };

//   // Search by title, category, subCategory, shortDescription
//   if (searchTerm) {
//     filter.$or = [
//       { title: { $regex: searchTerm, $options: 'i' } },
//       { category: { $regex: searchTerm, $options: 'i' } },
//       { subCategory: { $regex: searchTerm, $options: 'i' } },
//       { shortDescription: { $regex: searchTerm, $options: 'i' } },
//       { sku: { $regex: searchTerm, $options: 'i' } },
//     ];
//   }

//   // Filter by category
//   if (category) {
//     filter.category = { $regex: category, $options: 'i' };
//   }

//   // Filter by subCategory
//   if (subCategory) {
//     filter.subCategory = { $regex: subCategory, $options: 'i' };
//   }

//   // Filter by price range
//   if (minPrice || maxPrice) {
//     filter.price = {};
//     if (minPrice) filter.price.$gte = Number(minPrice);
//     if (maxPrice) filter.price.$lte = Number(maxPrice);
//   }

//   // Pagination
//   const pageNumber = Number(page);
//   const limitNumber = Number(limit);
//   const skip = (pageNumber - 1) * limitNumber;

//   // Sort
//   const sortObject: { [key: string]: 1 | -1 } = {
//     [sortBy]: sortOrder === 'asc' ? 1 : -1,
//   };

//   // Get total count for pagination
//   const total = await Product.countDocuments(filter);

//   // Get products
//   const products = await Product.find(filter)
//     .sort(sortObject)
//     .skip(skip)
//     .limit(limitNumber);

//   return {
//     products,
//     meta: {
//       page: pageNumber,
//       limit: limitNumber,
//       total,
//       totalPage: Math.ceil(total / limitNumber),
//     },
//   };
// };

const getAllProductsFromDB = async (query: TProductQuery) => {
  const {
    searchTerm,
    category,
    subCategory,
    minPrice,
    maxPrice,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = '1',
    limit = '10',
  } = query;

  console.log('🔍 getAllProductsFromDB called with:', {
    searchTerm,
    category,
    subCategory,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: any = { isDeleted: { $ne: true } };

  // Search functionality
  if (searchTerm && searchTerm.trim() !== '') {
    const trimmedSearch = searchTerm.trim();
    console.log(`🎯 Search term detected: "${trimmedSearch}"`);

    // Escape special regex characters for security
    const escapedSearch = trimmedSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Use word boundary \b for exact word matching
    // This prevents "shirt" from matching "Sheet"
    const searchPattern = `\\b${escapedSearch}\\b`;

    filter.$or = [
      { title: { $regex: searchPattern, $options: 'i' } },
      { category: { $regex: searchPattern, $options: 'i' } },
      { subCategory: { $regex: searchPattern, $options: 'i' } },
      { shortDescription: { $regex: searchPattern, $options: 'i' } },
      { longDescription: { $regex: searchPattern, $options: 'i' } },
      { sku: { $regex: searchPattern, $options: 'i' } },
    ];

    console.log('🔍 Search pattern:', searchPattern);
  }

  // Category filter
  if (category && category.trim() !== '') {
    filter.category = { $regex: category.trim(), $options: 'i' };
    console.log('📁 Category filter:', category);
  }

  // SubCategory filter
  if (subCategory && subCategory.trim() !== '') {
    filter.subCategory = { $regex: subCategory.trim(), $options: 'i' };
    console.log('📂 SubCategory filter:', subCategory);
  }

  // Price range filter
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
    console.log('💰 Price filter:', filter.price);
  }

  console.log('🔍 Final MongoDB filter:', JSON.stringify(filter, null, 2));

  // Pagination
  const pageNumber = Math.max(1, Number(page) || 1);
  const limitNumber = Math.max(1, Math.min(100, Number(limit) || 10));
  const skip = (pageNumber - 1) * limitNumber;

  // Sort
  const sortObject: { [key: string]: 1 | -1 } = {
    [sortBy]: sortOrder === 'asc' ? 1 : -1,
  };

  // Execute query
  const total = await Product.countDocuments(filter);
  const products = await Product.find(filter)
    .sort(sortObject)
    .skip(skip)
    .limit(limitNumber);

  console.log(`✅ Found ${products.length} products (total: ${total})`);

  if (searchTerm && products.length > 0) {
    console.log('📋 Search results:');
    products.forEach((p, i) => console.log(`   ${i + 1}. "${p.title}"`));
  }

  return {
    products,
    meta: {
      page: pageNumber,
      limit: limitNumber,
      total,
      totalPage: Math.ceil(total / limitNumber),
    },
  };
};
const getSingleProductFromDB = async (id: string) => {
  const result = await Product.findById(id);
  return result;
};

const updateProductInDB = async (id: string, payload: Partial<TProduct>) => {
  const result = await Product.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
  return result;
};

const deleteProductFromDB = async (id: string) => {
  const result = await Product.findByIdAndUpdate(
    id,
    { isDeleted: true },
    { new: true },
  );
  return result;
};

// Search products (dedicated search endpoint)
// const searchProductsFromDB = async (searchTerm: string) => {
//   if (!searchTerm || searchTerm.trim() === '') {
//     return [];
//   }

//   const filter = {
//     isDeleted: { $ne: true },
//     $or: [
//       { title: { $regex: searchTerm, $options: 'i' } },
//       { category: { $regex: searchTerm, $options: 'i' } },
//       { subCategory: { $regex: searchTerm, $options: 'i' } },
//       { shortDescription: { $regex: searchTerm, $options: 'i' } },
//       { sku: { $regex: searchTerm, $options: 'i' } },
//     ],
//   };

//   const products = await Product.find(filter)
//     .select('title price strikePrice images category subCategory')
//     .limit(20);

//   return products;
// };

const searchProductsFromDB = async (searchTerm: string) => {
  console.log('🔍 searchProductsFromDB called with:', searchTerm);

  // Validation
  if (
    !searchTerm ||
    typeof searchTerm !== 'string' ||
    searchTerm.trim() === ''
  ) {
    console.log('❌ Invalid search term');
    return [];
  }

  const trimmedSearch = searchTerm.trim();

  // Escape special regex characters
  const escapedSearchTerm = trimmedSearch.replace(
    /[.*+?^${}()|[\]\\]/g,
    '\\$&',
  );

  // Use word boundary for exact word matching
  const searchPattern = `\\b${escapedSearchTerm}\\b`;

  console.log(`🎯 Searching with pattern: "${searchPattern}"`);

  const filter = {
    isDeleted: { $ne: true },
    $or: [
      { title: { $regex: searchPattern, $options: 'i' } },
      { category: { $regex: searchPattern, $options: 'i' } },
      { subCategory: { $regex: searchPattern, $options: 'i' } },
      { shortDescription: { $regex: searchPattern, $options: 'i' } },
      { longDescription: { $regex: searchPattern, $options: 'i' } },
      { sku: { $regex: searchPattern, $options: 'i' } },
    ],
  };

  const products = await Product.find(filter)
    .select(
      'title price strikePrice images category subCategory shortDescription',
    )
    .limit(50);

  console.log(`✅ Found ${products.length} products`);

  if (products.length > 0) {
    console.log('📋 Results:');
    products.forEach((p, i) => console.log(`   ${i + 1}. "${p.title}"`));
  }

  return products;
};

// Get best seller products
const getBestSellerProductsFromDB = async (limit: number = 10) => {
  const products = await Product.find({
    isDeleted: { $ne: true },
  })
    .sort({ soldCount: -1, rating: -1 })
    .limit(limit)
    .select(
      'title price strikePrice images category subCategory rating reviewCount soldCount',
    );

  return products;
};

// Get featured products
const getFeaturedProductsFromDB = async (limit: number = 10) => {
  const products = await Product.find({
    isDeleted: { $ne: true },
    isFeatured: true,
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select(
      'title price strikePrice images category subCategory rating reviewCount',
    );

  return products;
};

// Get products by category with advanced filtering
const getProductsByCategoryFromDB = async (
  categorySlug: string,
  query: TProductQuery,
) => {
  const {
    subCategory,
    minPrice,
    maxPrice,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = '1',
    limit = '12',
    searchTerm,
  } = query;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: any = {
    isDeleted: { $ne: true },
    category: categorySlug,
  };

  // Filter by subcategory
  if (subCategory && subCategory.trim() !== '') {
    filter.subCategory = subCategory.trim().toLowerCase();
  }

  // Search within category
  if (searchTerm && searchTerm.trim() !== '') {
    const escapedSearch = searchTerm
      .trim()
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { title: { $regex: escapedSearch, $options: 'i' } },
      { shortDescription: { $regex: escapedSearch, $options: 'i' } },
      { brand: { $regex: escapedSearch, $options: 'i' } },
      { tags: { $regex: escapedSearch, $options: 'i' } },
    ];
  }

  // Price range filter
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  // Pagination
  const pageNumber = Math.max(1, Number(page) || 1);
  const limitNumber = Math.max(1, Math.min(100, Number(limit) || 12));
  const skip = (pageNumber - 1) * limitNumber;

  // Sort
  const sortObject: { [key: string]: 1 | -1 } = {
    [sortBy]: sortOrder === 'asc' ? 1 : -1,
  };

  // Execute query
  const total = await Product.countDocuments(filter);
  const products = await Product.find(filter)
    .sort(sortObject)
    .skip(skip)
    .limit(limitNumber);

  return {
    products,
    meta: {
      page: pageNumber,
      limit: limitNumber,
      total,
      totalPage: Math.ceil(total / limitNumber),
    },
  };
};

// Get product count by category
const getProductCountByCategoryFromDB = async (categorySlug: string) => {
  const count = await Product.countDocuments({
    category: categorySlug,
    isDeleted: { $ne: true },
  });
  return count;
};

export const ProductServices = {
  createProductIntoDB,
  getAllProductsFromDB,
  getSingleProductFromDB,
  updateProductInDB,
  deleteProductFromDB,
  searchProductsFromDB,
  getBestSellerProductsFromDB,
  getFeaturedProductsFromDB,
  getProductsByCategoryFromDB,
  getProductCountByCategoryFromDB,
};
