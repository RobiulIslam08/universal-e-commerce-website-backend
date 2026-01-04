import { Product } from '../product/product.model';
import {
  TCategory,
  TCategoryTree,
  TCategoryWithCount,
} from './category.interface';
import { Category } from './category.model';

// Create a new category
const createCategoryIntoDB = async (payload: TCategory) => {
  // If parent category is provided, validate it exists and set level
  if (payload.parentCategory) {
    const parent = await Category.findOne({ slug: payload.parentCategory });
    if (!parent) {
      throw new Error('Parent category not found');
    }
    payload.level = parent.level + 1;
  } else {
    payload.level = 0;
  }

  const result = await Category.create(payload);
  return result;
};

// Get all categories (flat list)
const getAllCategoriesFromDB = async () => {
  const categories = await Category.find({ isActive: true }).sort({
    order: 1,
    name: 1,
  });
  return categories;
};

// Get category hierarchy (tree structure)
const getCategoryTreeFromDB = async (): Promise<TCategoryTree[]> => {
  const categories = await Category.find({ isActive: true }).sort({
    order: 1,
    name: 1,
  });

  // Get product counts for all categories
  const categorySlugs = categories.map((cat) => cat.slug);
  const productCounts = await Product.aggregate([
    { $match: { isDeleted: { $ne: true } } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);

  const countMap = new Map(productCounts.map((item) => [item._id, item.count]));

  // Build tree structure
  const categoryMap = new Map<string, TCategoryTree>();
  const rootCategories: TCategoryTree[] = [];

  categories.forEach((cat) => {
    const categoryTree: TCategoryTree = {
      _id: cat._id.toString(),
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      image: cat.image,
      level: cat.level,
      productCount: countMap.get(cat.slug) || 0,
      children: [],
    };
    categoryMap.set(cat.slug, categoryTree);
  });

  categories.forEach((cat) => {
    const categoryTree = categoryMap.get(cat.slug);
    if (categoryTree) {
      if (cat.parentCategory) {
        const parent = categoryMap.get(cat.parentCategory);
        if (parent) {
          parent.children?.push(categoryTree);
        }
      } else {
        rootCategories.push(categoryTree);
      }
    }
  });

  return rootCategories;
};

// Get category by slug with product count
const getCategoryBySlugFromDB = async (
  slug: string,
): Promise<TCategoryWithCount | null> => {
  const category = await Category.findOne({ slug, isActive: true });

  if (!category) {
    return null;
  }

  // Get product count for this category
  const productCount = await Product.countDocuments({
    category: slug,
    isDeleted: { $ne: true },
  });

  // Get subcategories with their product counts
  const subCategories = await Category.find({
    parentCategory: slug,
    isActive: true,
  }).sort({ order: 1, name: 1 });

  const subCategoriesWithCount: TCategoryWithCount[] = await Promise.all(
    subCategories.map(async (subCat) => {
      const subProductCount = await Product.countDocuments({
        subCategory: subCat.slug,
        isDeleted: { $ne: true },
      });

      return {
        ...subCat.toObject(),
        productCount: subProductCount,
      };
    }),
  );

  return {
    ...category.toObject(),
    productCount,
    subCategories: subCategoriesWithCount,
  };
};

// Get categories by parent (get children of a category)
const getCategoriesByParentFromDB = async (
  parentSlug: string | null,
): Promise<TCategoryWithCount[]> => {
  const categories = await Category.find({
    parentCategory: parentSlug,
    isActive: true,
  }).sort({ order: 1, name: 1 });

  // Get product counts for each category
  const categoriesWithCount: TCategoryWithCount[] = await Promise.all(
    categories.map(async (cat) => {
      const productCount = await Product.countDocuments({
        category: cat.slug,
        isDeleted: { $ne: true },
      });

      return {
        ...cat.toObject(),
        productCount,
      };
    }),
  );

  return categoriesWithCount;
};

// Get root categories (level 0) with product counts
const getRootCategoriesFromDB = async (): Promise<TCategoryWithCount[]> => {
  return getCategoriesByParentFromDB(null);
};

// Update category
const updateCategoryInDB = async (
  slug: string,
  payload: Partial<TCategory>,
) => {
  // If updating parent category, validate and update level
  if (payload.parentCategory !== undefined) {
    if (payload.parentCategory) {
      const parent = await Category.findOne({ slug: payload.parentCategory });
      if (!parent) {
        throw new Error('Parent category not found');
      }
      payload.level = parent.level + 1;
    } else {
      payload.level = 0;
    }
  }

  const result = await Category.findOneAndUpdate({ slug }, payload, {
    new: true,
    runValidators: true,
  });

  return result;
};

// Delete category (soft delete)
const deleteCategoryFromDB = async (slug: string) => {
  // Check if category has products
  const productCount = await Product.countDocuments({
    category: slug,
    isDeleted: { $ne: true },
  });

  if (productCount > 0) {
    throw new Error(
      `Cannot delete category with ${productCount} products. Please reassign or delete products first.`,
    );
  }

  // Check if category has subcategories
  const subCategoryCount = await Category.countDocuments({
    parentCategory: slug,
    isActive: true,
  });

  if (subCategoryCount > 0) {
    throw new Error(
      `Cannot delete category with ${subCategoryCount} subcategories. Please delete subcategories first.`,
    );
  }

  const result = await Category.findOneAndUpdate(
    { slug },
    { isActive: false },
    { new: true },
  );

  return result;
};

// Get category statistics
const getCategoryStatsFromDB = async () => {
  const totalCategories = await Category.countDocuments({ isActive: true });
  const rootCategories = await Category.countDocuments({
    parentCategory: null,
    isActive: true,
  });

  // Get categories with most products
  const topCategories = await Product.aggregate([
    { $match: { isDeleted: { $ne: true } } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);

  return {
    totalCategories,
    rootCategories,
    topCategories,
  };
};

export const CategoryServices = {
  createCategoryIntoDB,
  getAllCategoriesFromDB,
  getCategoryTreeFromDB,
  getCategoryBySlugFromDB,
  getCategoriesByParentFromDB,
  getRootCategoriesFromDB,
  updateCategoryInDB,
  deleteCategoryFromDB,
  getCategoryStatsFromDB,
};
