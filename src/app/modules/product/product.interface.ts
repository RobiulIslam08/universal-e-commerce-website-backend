export type TSpecification = {
  key: string;
  value: string;
};

export type TProduct = {
  title: string;
  category: string; // Main category slug (e.g., "men", "women", "electronics")
  subCategory: string; // Sub-category slug (e.g., "mobile", "laptop", "shirt")
  price: number;
  strikePrice: number;
  stockQuantity: number;
  sku: string;
  shortDescription: string;
  longDescription: string;
  images: string[];
  specifications: TSpecification[];
  tags?: string[]; // Additional tags for better search (e.g., ["smartphone", "5g", "android"])
  brand?: string; // Product brand
  rating?: number; // Average rating
  reviewCount?: number; // Number of reviews
  soldCount?: number; // Number of items sold (for best sellers)
  isDeleted?: boolean;
  isFeatured?: boolean; // Featured products
  isBestSeller?: boolean; // Best seller products
};
