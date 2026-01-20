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
  stock?:string
};

const createProductIntoDB = async (payload: TProduct) => {
  const result = await Product.create(payload);
  return result;
};


const getAllProductsFromDB = async (query: TProductQuery) => {
  const {
    searchTerm,
    category,
    subCategory,
    minPrice,
    maxPrice,
    stock,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = '1',
    limit = '10',
  } = query;

  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: any = { isDeleted: { $ne: true } };


// ১. স্টক ফিল্টার (এটি সবার আগে রাখা ভালো)
  if (stock === 'inStock') {
    filter.stockQuantity = { $gt: 0 };
  } else if (stock === 'outOfStock') {
    filter.stockQuantity = { $lte: 0 };
  }

  // ২. ক্যাটাগরি ফিল্টার (শুধুমাত্র ভ্যালু থাকলেই ফিল্টার হবে)
  if (category && category !== 'all') {
    filter.category = { $regex: category, $options: 'i' };
  }

  // ৩. সাব-ক্যাটাগরি ফিল্টার
  if (subCategory && subCategory !== 'all') {
    filter.subCategory = { $regex: subCategory, $options: 'i' };
  }
  // Search functionality
  if (searchTerm && searchTerm.trim() !== '') {
    const trimmedSearch = searchTerm.trim();


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

  
  }

  

  // Price range filter
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);

  }

 

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



  if (searchTerm && products.length > 0) {

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


  // Validation
  if (
    !searchTerm ||
    typeof searchTerm !== 'string' ||
    searchTerm.trim() === ''
  ) {
   
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

 

  if (products.length > 0) {
   
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
