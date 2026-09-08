const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const User = require('./models/User');
const Store = require('./models/Store');
const Category = require('./models/Category');
const Product = require('./models/Product');
const Voucher = require('./models/Voucher');

const connectDB = require('./config/db');

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing catalog/business data only (keep auth users intact)
    await Store.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    await Voucher.deleteMany({});

    console.log('Catalog data cleared (users preserved)...');

    // Keep existing users/accounts and attach seeded stores to available managers
    const adminUser = await User.findOne({ role: 'admin' });
    const managers = await User.find({ role: 'manager' }).sort({ createdAt: 1 }).limit(2);
    const manager1 = managers[0] || adminUser;
    const manager2 = managers[1] || manager1;

    if (!adminUser) {
      throw new Error('No admin user found. Create an admin account before seeding.');
    }

    // Create Stores
    const store1 = await Store.create({
      managerId: manager1._id,
      name: 'Mobixa',
      slug: 'mobixa',
      description: 'Premium destination for the latest smartphones, tablets, and high-end tech accessories.',
      address: '123 Tech Avenue, Colombo 03',
      city: 'Colombo',
      phone: '+94112555101',
      email: 'hello@mobixa.com',
      bannerImage: 'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=1200',
      logo: 'https://images.unsplash.com/photo-1541560052-5e137f229371?w=200',
      operatingHours: { open: '09:00', close: '20:00' },
      isActive: true,
    });

    const store2 = await Store.create({
      managerId: manager2._id,
      name: 'Tech Gadgets',
      slug: 'tech-gadgets',
      description: 'Your one-stop shop for laptops, smartwatches, earbuds, and premium electronic gear.',
      address: '456 Gadget Street, Colombo 04',
      city: 'Colombo',
      phone: '+94112555202',
      email: 'info@techgadgets.com',
      bannerImage: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200',
      logo: 'https://images.unsplash.com/photo-1550009158-9ebf6d1734a7?w=200',
      operatingHours: { open: '09:30', close: '21:00' },
      isActive: true,
    });

    console.log('Stores created...');

    // Keep existing staff users and remap assigned stores
    await User.updateMany({ role: 'cashier' }, { $set: { assignedStore: store1._id } });
    await User.updateMany({ role: 'deliveryGuy' }, { $set: { assignedStore: store2._id } });

    // Create Categories
    const categories = await Category.insertMany([
      { name: 'Smartphones', slug: 'smartphones', icon: '📱', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400', isActive: true },
      { name: 'Tablets', slug: 'tablets', icon: '📝', image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400', isActive: true },
      { name: 'Smart Watches', slug: 'smart-watches', icon: '⌚', image: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=400', isActive: true },
      { name: 'Accessories', slug: 'accessories', icon: '🔌', image: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400', isActive: true },
      { name: 'Chargers', slug: 'chargers', icon: '⚡', image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=400', isActive: true },
      { name: 'Earbuds', slug: 'earbuds', icon: '🎧', image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400', isActive: true },
      { name: 'Phone Cases', slug: 'phone-cases', icon: '🛡️', image: 'https://images.unsplash.com/photo-1601593346740-925612772716?w=400', isActive: true },
      { name: 'Laptops', slug: 'laptops', icon: '💻', image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400', isActive: true },
    ]);

    console.log('Categories created...');

    // Create Products (with barcodes, SKUs, and multi-currency pricing)
    const products = [
      {
        storeId: store1._id, name: 'iPhone 15 Pro Max', slug: 'iphone-15-pro-max',
        categoryId: categories[0]._id, description: 'The ultimate iPhone featuring a titanium design, A17 Pro chip, and an advanced camera system.',
        price: 450000, priceLKR: 450000, priceUSD: 1499, mrp: 480000, discount: 6, unit: 'piece',
        stock: 45, images: ['https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600'],
        averageRating: 4.9, totalReviews: 120, isFeatured: true, isOnSale: true, status: 'active',
        barcode: '5901234568001', sku: 'MH-IP15PM-001',
      },
      {
        storeId: store1._id, name: 'Samsung Galaxy S24 Ultra', slug: 'samsung-galaxy-s24-ultra',
        categoryId: categories[0]._id, description: 'Experience the power of Galaxy AI with a stunning display, built-in S Pen, and epic cameras.',
        price: 420000, priceLKR: 420000, priceUSD: 1399, mrp: 450000, discount: 6, unit: 'piece',
        stock: 50, images: ['https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600'],
        averageRating: 4.8, totalReviews: 95, isFeatured: true, isOnSale: false, status: 'active',
        barcode: '5901234568002', sku: 'MH-S24U-001',
      },
      {
        storeId: store2._id, name: 'iPad Pro 12.9" M2', slug: 'ipad-pro-12-9-m2',
        categoryId: categories[1]._id, description: 'Astonishing performance, incredibly advanced displays, and superfast wireless connectivity.',
        price: 380000, priceLKR: 380000, priceUSD: 1250, mrp: 400000, discount: 5, unit: 'piece',
        stock: 30, images: ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600'],
        averageRating: 4.9, totalReviews: 80, isFeatured: true, isOnSale: true, status: 'active',
        barcode: '5901234568003', sku: 'TG-IPADP-001',
      },
      {
        storeId: store2._id, name: 'Apple Watch Series 9', slug: 'apple-watch-series-9',
        categoryId: categories[2]._id, description: 'Smarter, brighter, and mightier. Featuring a new custom silicon and a magical new way to use your watch without touching the screen.',
        price: 120000, priceLKR: 120000, priceUSD: 399, mrp: 130000, discount: 7, unit: 'piece',
        stock: 60, images: ['https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=600'],
        averageRating: 4.8, totalReviews: 150, isFeatured: true, isOnSale: true, status: 'active',
        barcode: '5901234568004', sku: 'TG-AW9-001',
      },
      {
        storeId: store1._id, name: 'AirPods Pro (2nd Gen)', slug: 'airpods-pro-2nd-gen',
        categoryId: categories[5]._id, description: 'Up to 2x more Active Noise Cancellation, plus Adaptive Transparency, and Personalized Spatial Audio.',
        price: 85000, priceLKR: 85000, priceUSD: 249, mrp: 95000, discount: 10, unit: 'piece',
        stock: 120, images: ['https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=600'],
        averageRating: 4.9, totalReviews: 210, isFeatured: true, isOnSale: true, status: 'active',
        barcode: '5901234568005', sku: 'MH-APP2-001',
      },
      {
        storeId: store2._id, name: 'MacBook Air M2', slug: 'macbook-air-m2',
        categoryId: categories[7]._id, description: 'Supercharged by M2. Strikingly thin design, 1080p FaceTime HD camera, and up to 18 hours of battery life.',
        price: 400000, priceLKR: 400000, priceUSD: 1199, mrp: 420000, discount: 4, unit: 'piece',
        stock: 25, images: ['https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=600'],
        averageRating: 4.8, totalReviews: 75, isFeatured: true, isOnSale: false, status: 'active',
        barcode: '5901234568006', sku: 'TG-MBA-M2-001',
      },
      {
        storeId: store1._id, name: '20W USB-C Power Adapter', slug: '20w-usb-c-power-adapter',
        categoryId: categories[4]._id, description: 'Offers fast, efficient charging at home, in the office, or on the go.',
        price: 8500, priceLKR: 8500, priceUSD: 25, mrp: 9500, discount: 10, unit: 'piece',
        stock: 200, images: ['https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600'],
        averageRating: 4.7, totalReviews: 320, isFeatured: false, isOnSale: true, status: 'active',
        barcode: '5901234568007', sku: 'MH-20W-001',
      },
      {
        storeId: store1._id, name: 'MagSafe Silicone Case', slug: 'magsafe-silicone-case',
        categoryId: categories[6]._id, description: 'Designed to protect your iPhone with style, featuring a silky, soft-touch finish.',
        price: 15000, priceLKR: 15000, priceUSD: 49, mrp: 18000, discount: 16, unit: 'piece',
        stock: 150, images: ['https://images.unsplash.com/photo-1601593346740-925612772716?w=600'],
        averageRating: 4.6, totalReviews: 85, isFeatured: false, isOnSale: true, status: 'active',
        barcode: '5901234568008', sku: 'MH-MS-CASE-001',
      },
      {
        storeId: store2._id, name: 'Sony WH-1000XM5 Wireless Headphones', slug: 'sony-wh-1000xm5',
        categoryId: categories[3]._id, description: 'Industry-leading noise cancellation, magnificent sound, and unmatched call quality.',
        price: 135000, priceLKR: 135000, priceUSD: 398, mrp: 150000, discount: 10, unit: 'piece',
        stock: 40, images: ['https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=600'],
        averageRating: 4.9, totalReviews: 145, isFeatured: true, isOnSale: true, status: 'active',
        barcode: '5901234568009', sku: 'TG-SONY-XM5-001',
      },
      {
        storeId: store2._id, name: 'Anker PowerCore 10000mAh', slug: 'anker-powercore-10000mah',
        categoryId: categories[3]._id, description: 'One of the smallest and lightest 10000mAh portable chargers. High-speed charging technology.',
        price: 12000, priceLKR: 12000, priceUSD: 35, mrp: 15000, discount: 20, unit: 'piece',
        stock: 180, images: ['https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=600'],
        averageRating: 4.8, totalReviews: 260, isFeatured: false, isOnSale: true, status: 'active',
        barcode: '5901234568010', sku: 'TG-ANK-PB-001',
      },
      {
        storeId: store1._id, name: 'C-mic Cable', slug: 'c-mic-cable',
        categoryId: categories[3]._id, description: 'High quality Type-C to Micro USB Fast Charging Cable for smartphones and mobile accessories.',
        price: 1500, priceLKR: 1500, priceUSD: 5, mrp: 1800, discount: 10, unit: 'piece',
        stock: 100, images: ['https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600'],
        averageRating: 4.8, totalReviews: 50, isFeatured: true, isOnSale: true, status: 'active',
        barcode: '5903245598504', sku: 'C-mic Cable',
      },
      {
        storeId: store1._id, name: 'Phone Cable', slug: 'phone-cable',
        categoryId: categories[3]._id, description: 'Universal braided fast charging phone cable (Type-C / Lightning).',
        price: 1800, priceLKR: 1800, priceUSD: 6, mrp: 2000, discount: 10, unit: 'piece',
        stock: 100, images: ['https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600'],
        averageRating: 4.7, totalReviews: 40, isFeatured: true, isOnSale: true, status: 'active',
        barcode: '5903245598504', sku: 'Phone Cable',
      }
    ];

    await Product.insertMany(products);

    // Create sample vouchers
    await Voucher.insertMany([
      {
        code: 'WELCOME10',
        type: 'percentage',
        value: 10,
        minOrderAmount: 500,
        maxDiscountAmount: 200,
        maxUses: 1000,
        usedCount: 0,
        expiresAt: new Date('2027-12-31'),
        isActive: true,
        createdBy: adminUser._id,
        source: 'promotion',
        description: 'Welcome discount - 10% off your first order!',
      },
      {
        code: 'FRESH500',
        type: 'fixed',
        value: 500,
        minOrderAmount: 3000,
        maxUses: 500,
        usedCount: 0,
        expiresAt: new Date('2027-06-30'),
        isActive: true,
        createdBy: adminUser._id,
        source: 'admin',
        description: 'Rs.500 off on orders above Rs.3000',
      },
    ]);

    console.log('Products & Vouchers created...');
    console.log('');
    console.log('=== SEED DATA COMPLETE ===');
    console.log('');
    console.log('Existing user accounts are preserved.');
    console.log('Seed updates only categories, products, stores, and vouchers.');
    console.log('');
    console.log('Voucher Codes: WELCOME10, FRESH500');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
