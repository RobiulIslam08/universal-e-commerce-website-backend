export interface TCategory {
  name: string; // e.g., "Men", "Women", "Electronics"
  slug: string; // e.g., "men", "women", "electronics"
  description?: string;
  image?: string;
  parentCategory?: string | null; // Reference to parent category slug
  level: number; // 0 = root, 1 = first level, 2 = second level
  isActive: boolean;
  order: number; // For sorting categories
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TCategoryWithCount extends TCategory {
  productCount: number;
  subCategories?: TCategoryWithCount[];
}

export interface TCategoryTree {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  level: number;
  productCount: number;
  children?: TCategoryTree[];
}
