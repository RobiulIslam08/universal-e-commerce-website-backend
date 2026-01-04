import mongoose from 'mongoose';
import { Category } from '../modules/Category/category.model';
import config from '../config';

const categories = [
  // Root Categories (Level 0)
  {
    name: 'Electronics',
    slug: 'electronics',
    description: 'Electronic devices and accessories',
    level: 0,
    parentCategory: null,
    isActive: true,
    order: 1,
  },
  {
    name: 'Fashion',
    slug: 'fashion',
    description: 'Clothing and fashion accessories',
    level: 0,
    parentCategory: null,
    isActive: true,
    order: 2,
  },
  {
    name: 'Home & Kitchen',
    slug: 'home-kitchen',
    description: 'Home and kitchen essentials',
    level: 0,
    parentCategory: null,
    isActive: true,
    order: 3,
  },

  // Electronics Subcategories (Level 1)
  {
    name: 'Mobile',
    slug: 'mobile',
    description: 'Smartphones and mobile accessories',
    level: 1,
    parentCategory: 'electronics',
    isActive: true,
    order: 1,
  },
  {
    name: 'Laptop',
    slug: 'laptop',
    description: 'Laptops and notebook computers',
    level: 1,
    parentCategory: 'electronics',
    isActive: true,
    order: 2,
  },
  {
    name: 'Computer',
    slug: 'computer',
    description: 'Desktop computers and accessories',
    level: 1,
    parentCategory: 'electronics',
    isActive: true,
    order: 3,
  },
  {
    name: 'Speaker',
    slug: 'speaker',
    description: 'Audio speakers and sound systems',
    level: 1,
    parentCategory: 'electronics',
    isActive: true,
    order: 4,
  },
  {
    name: 'Headphone',
    slug: 'headphone',
    description: 'Headphones and earphones',
    level: 1,
    parentCategory: 'electronics',
    isActive: true,
    order: 5,
  },

  // Fashion Subcategories (Level 1)
  {
    name: 'Men',
    slug: 'men',
    description: "Men's fashion and accessories",
    level: 1,
    parentCategory: 'fashion',
    isActive: true,
    order: 1,
  },
  {
    name: 'Women',
    slug: 'women',
    description: "Women's fashion and accessories",
    level: 1,
    parentCategory: 'fashion',
    isActive: true,
    order: 2,
  },
  {
    name: 'Children',
    slug: 'children',
    description: "Children's clothing and accessories",
    level: 1,
    parentCategory: 'fashion',
    isActive: true,
    order: 3,
  },

  // Men's Fashion Subcategories (Level 2)
  {
    name: 'Shirt',
    slug: 'shirt',
    description: "Men's shirts",
    level: 2,
    parentCategory: 'men',
    isActive: true,
    order: 1,
  },
  {
    name: 'Pant',
    slug: 'pant',
    description: "Men's pants and trousers",
    level: 2,
    parentCategory: 'men',
    isActive: true,
    order: 2,
  },
  {
    name: 'Shoes',
    slug: 'shoes',
    description: "Men's footwear",
    level: 2,
    parentCategory: 'men',
    isActive: true,
    order: 3,
  },
  {
    name: 'Watch',
    slug: 'watch',
    description: "Men's watches",
    level: 2,
    parentCategory: 'men',
    isActive: true,
    order: 4,
  },

  // Women's Fashion Subcategories (Level 2)
  {
    name: 'Dress',
    slug: 'dress',
    description: "Women's dresses",
    level: 2,
    parentCategory: 'women',
    isActive: true,
    order: 1,
  },
  {
    name: 'Saree',
    slug: 'saree',
    description: 'Traditional sarees',
    level: 2,
    parentCategory: 'women',
    isActive: true,
    order: 2,
  },
  {
    name: 'Salwar Kameez',
    slug: 'salwar-kameez',
    description: 'Salwar kameez sets',
    level: 2,
    parentCategory: 'women',
    isActive: true,
    order: 3,
  },
  {
    name: 'Jewelry',
    slug: 'jewelry',
    description: "Women's jewelry and accessories",
    level: 2,
    parentCategory: 'women',
    isActive: true,
    order: 4,
  },

  // Mobile Subcategories (Level 2)
  {
    name: 'Android',
    slug: 'android',
    description: 'Android smartphones',
    level: 2,
    parentCategory: 'mobile',
    isActive: true,
    order: 1,
  },
  {
    name: 'iPhone',
    slug: 'iphone',
    description: 'Apple iPhones',
    level: 2,
    parentCategory: 'mobile',
    isActive: true,
    order: 2,
  },

  // Home & Kitchen Subcategories (Level 1)
  {
    name: 'Kitchen',
    slug: 'kitchen',
    description: 'Kitchen appliances and utensils',
    level: 1,
    parentCategory: 'home-kitchen',
    isActive: true,
    order: 1,
  },
  {
    name: 'Bedroom',
    slug: 'bedroom',
    description: 'Bedroom furniture and accessories',
    level: 1,
    parentCategory: 'home-kitchen',
    isActive: true,
    order: 2,
  },
  {
    name: 'Living Room',
    slug: 'living-room',
    description: 'Living room furniture and decor',
    level: 1,
    parentCategory: 'home-kitchen',
    isActive: true,
    order: 3,
  },
];

const seedCategories = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.database_url as string);
    console.log('🔗 Connected to MongoDB');

    // Clear existing categories
    await Category.deleteMany({});
    console.log('🗑️  Cleared existing categories');

    // Insert new categories
    await Category.insertMany(categories);
    console.log(`✅ Successfully seeded ${categories.length} categories`);

    // Show category tree
    const rootCategories = await Category.find({ level: 0 }).sort({ order: 1 });

    console.log('\n📁 Category Structure:');
    for (const root of rootCategories) {
      console.log(`\n${root.name} (${root.slug})`);

      const level1 = await Category.find({ parentCategory: root.slug }).sort({
        order: 1,
      });

      for (const cat1 of level1) {
        console.log(`  ├── ${cat1.name} (${cat1.slug})`);

        const level2 = await Category.find({ parentCategory: cat1.slug }).sort({
          order: 1,
        });

        for (const cat2 of level2) {
          console.log(`  │   ├── ${cat2.name} (${cat2.slug})`);
        }
      }
    }

    console.log('\n✨ Category seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding categories:', error);
    process.exit(1);
  }
};

// Run the seed function
seedCategories();
