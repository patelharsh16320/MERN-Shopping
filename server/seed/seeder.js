const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config({ path: '../.env' });

mongoose.connect('mongodb://localhost:27017/women_hubclub');

const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Invoice = require('../models/Invoice');
const Category = require('../models/Category');

const hashPwd = async (pwd) => await bcrypt.hash(pwd, 12);

const usersData = [
  { name: 'Admin User', email: 'admin@gmail.com', password: 'admin@gmail.com', role: 'admin', phone: '9999999999' },
  { name: 'Priya Sharma', email: 'priya@gmail.com', password: 'priya@gmail.com', phone: '9876543210' },
  { name: 'Anjali Mehta', email: 'anjali@gmail.com', password: 'anjali@gmail.com', phone: '9876543211' },
  { name: 'Sneha Kapoor', email: 'sneha@gmail.com', password: 'sneha@gmail.com', phone: '9876543212' },
  { name: 'Kavya Nair', email: 'kavya@gmail.com', password: 'kavya@gmail.com', phone: '9876543213' },
  { name: 'Divya Patel', email: 'divya@gmail.com', password: 'divya@gmail.com', phone: '9876543214' },
  { name: 'Meera Iyer', email: 'meera@gmail.com', password: 'meera@gmail.com', phone: '9876543215' },
  { name: 'Riya Singh', email: 'riya@gmail.com', password: 'riya@gmail.com', phone: '9876543216' },
  { name: 'Pooja Verma', email: 'pooja@gmail.com', password: 'pooja@gmail.com', phone: '9876543217' },
  { name: 'Nisha Gupta', email: 'nisha@gmail.com', password: 'nisha@gmail.com', phone: '9876543218' },
  { name: 'Sana Khan', email: 'sana@gmail.com', password: 'sana@gmail.com', phone: '9876543219' },
  { name: 'Tanya Reddy', email: 'tanya@gmail.com', password: 'tanya@gmail.com', phone: '9876543220' },
];

const productsData = [
  // Skincare
  { name: 'Rose Glow Face Serum', description: 'Luxurious rose-infused vitamin C serum that brightens skin, reduces dark spots and gives a natural glow. Suitable for all skin types.', price: 799, originalPrice: 999, discount: 20, category: 'Skincare', images: ['https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400'], stock: 80, rating: 4.8, numReviews: 214, isFeatured: true, tags: ['vitamin-c', 'brightening', 'serum'], weight: '30ml' },
  { name: 'Hydrating Vitamin C Moisturizer', description: 'Rich daily moisturizer with vitamin C, hyaluronic acid and niacinamide. Keeps skin soft, plump and radiant all day long.', price: 649, originalPrice: 849, discount: 24, category: 'Skincare', images: ['https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400'], stock: 70, rating: 4.7, numReviews: 189, isFeatured: true, tags: ['moisturizer', 'hydrating', 'daily'], weight: '50ml' },
  { name: 'Gentle Foaming Face Wash', description: 'Sulphate-free gentle foam cleanser with salicylic acid and aloe vera. Removes impurities without stripping natural oils.', price: 349, originalPrice: 449, discount: 22, category: 'Skincare', images: ['https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400'], stock: 100, rating: 4.5, numReviews: 302, isFeatured: false, tags: ['cleanser', 'gentle', 'acne'], weight: '150ml' },
  { name: 'SPF 50 Sunscreen with Niacinamide', description: 'Lightweight, non-greasy sunscreen offering broad spectrum SPF 50 protection. Infused with niacinamide for skin tone correction.', price: 449, originalPrice: 549, discount: 18, category: 'Skincare', images: ['https://images.unsplash.com/photo-1629198688000-71f23e745b6e?w=400'], stock: 90, rating: 4.6, numReviews: 278, isFeatured: true, tags: ['sunscreen', 'spf50', 'protection'], weight: '50g' },
  { name: 'Hyaluronic Acid Toner', description: 'Alcohol-free hydrating toner with 3 molecular weights of hyaluronic acid. Visibly plumps skin and minimises the appearance of pores.', price: 549, originalPrice: 699, discount: 21, category: 'Skincare', images: ['https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400'], stock: 65, rating: 4.4, numReviews: 145, isFeatured: false, tags: ['toner', 'hyaluronic', 'pores'], weight: '150ml' },

  // Makeup & Beauty
  { name: 'Velvet Matte Lipstick Set (6 Shades)', description: 'Pigment-rich matte lipsticks in 6 stunning shades — from nudes to bold reds. Long-lasting 10-hour formula with vitamin E.', price: 1199, originalPrice: 1599, discount: 25, category: 'Makeup & Beauty', images: ['https://images.unsplash.com/photo-1586495777744-4e6232bf2176?w=400'], stock: 55, rating: 4.9, numReviews: 432, isFeatured: true, tags: ['lipstick', 'matte', 'set'], weight: '6x3.5g' },
  { name: '12-Pan Eyeshadow Palette — Rose Gold', description: 'Stunning rose gold themed eyeshadow palette with 12 highly pigmented shades. Mix of matte, shimmer and glitter finishes.', price: 1299, originalPrice: 1799, discount: 28, category: 'Makeup & Beauty', images: ['https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=400'], stock: 45, rating: 4.8, numReviews: 367, isFeatured: true, tags: ['eyeshadow', 'palette', 'rosegold'], weight: '15g' },
  { name: 'Waterproof Kajal & Eyeliner Duo', description: 'Intense black kajal and precision liquid eyeliner that lasts all day. Smudge-proof, sweat-proof and waterproof formula.', price: 399, originalPrice: 499, discount: 20, category: 'Makeup & Beauty', images: ['https://images.unsplash.com/photo-1583241800698-e8ab01830a22?w=400'], stock: 120, rating: 4.6, numReviews: 521, isFeatured: false, tags: ['kajal', 'eyeliner', 'waterproof'], weight: '2x1.2g' },
  { name: 'Dewy Foundation SPF 15', description: 'Medium-to-full coverage foundation with SPF 15. Gives a natural dewy finish that lasts 16 hours. Available in 10 shades.', price: 849, originalPrice: 1099, discount: 23, category: 'Makeup & Beauty', images: ['https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400'], stock: 60, rating: 4.5, numReviews: 289, isFeatured: true, tags: ['foundation', 'spf', 'coverage'], weight: '30ml' },

  // Hair Care
  { name: 'Argan Oil Hair Serum', description: 'Lightweight argan oil serum that tames frizz, adds shine and protects from heat damage up to 230°C. For all hair types.', price: 649, originalPrice: 849, discount: 24, category: 'Hair Care', images: ['https://images.unsplash.com/photo-1626120032630-b51c96a544e5?w=400'], stock: 75, rating: 4.7, numReviews: 198, isFeatured: true, tags: ['argan', 'frizz', 'serum'], weight: '100ml' },
  { name: 'Keratin Repair Shampoo & Conditioner Set', description: 'Salon-grade keratin shampoo and conditioner that repairs damaged hair, reduces breakage and adds intense shine.', price: 999, originalPrice: 1299, discount: 23, category: 'Hair Care', images: ['https://images.unsplash.com/photo-1643185450492-6ba77dea00f6?w=400'], stock: 55, rating: 4.8, numReviews: 243, isFeatured: false, tags: ['keratin', 'shampoo', 'conditioner'], weight: '2x200ml' },
  { name: 'Onion & Bhringraj Hair Growth Oil', description: 'Traditional Ayurvedic hair oil with onion extract, bhringraj and castor oil. Promotes hair growth and reduces hair fall significantly.', price: 499, originalPrice: 649, discount: 23, category: 'Hair Care', images: ['https://images.unsplash.com/photo-1617791160588-241658ad0d3b?w=400'], stock: 90, rating: 4.6, numReviews: 387, isFeatured: true, tags: ['onion', 'growth', 'ayurvedic'], weight: '200ml' },
  { name: 'Silk Hair Wrap Turban (2 Pack)', description: 'Ultra-soft microfiber hair turbans that dry hair 3x faster and reduce breakage from friction. No tangles or frizz.', price: 349, originalPrice: 449, discount: 22, category: 'Hair Care', images: ['https://images.unsplash.com/photo-1522204523234-8729aa6e3d5f?w=400'], stock: 80, rating: 4.4, numReviews: 156, isFeatured: false, tags: ['silk', 'turban', 'microfiber'], weight: '180g' },

  // Wellness
  { name: 'Jade Facial Roller & Gua Sha Set', description: 'Authentic jade facial roller and gua sha stone set. Reduces puffiness, improves circulation and enhances skincare absorption.', price: 699, originalPrice: 899, discount: 22, category: 'Wellness', images: ['https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=400'], stock: 60, rating: 4.7, numReviews: 312, isFeatured: true, tags: ['jade', 'gua-sha', 'massage'], weight: '250g' },
  { name: 'Aromatherapy Essential Oil Set (8 Oils)', description: 'Premium set of 8 therapeutic-grade essential oils including lavender, rose, peppermint, eucalyptus and more.', price: 1299, originalPrice: 1699, discount: 24, category: 'Wellness', images: ['https://images.unsplash.com/photo-1608571423539-e951a8d56f8e?w=400'], stock: 40, rating: 4.9, numReviews: 267, isFeatured: true, tags: ['aromatherapy', 'essential oils', 'relaxation'], weight: '8x10ml' },
  { name: 'Women\'s Daily Multivitamin Pack', description: 'Comprehensive women\'s multivitamin with 25+ nutrients including iron, folic acid, vitamin D3 and B12. 60-day supply.', price: 899, originalPrice: 1199, discount: 25, category: 'Wellness', images: ['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400'], stock: 70, rating: 4.6, numReviews: 189, isFeatured: false, tags: ['vitamins', 'supplement', 'daily'], weight: '60 tablets' },

  // Accessories
  { name: 'Gold Plated Earring Set (5 Pairs)', description: 'Elegant gold-plated earring set with 5 versatile styles — hoops, studs, drops and more. Hypoallergenic and tarnish-resistant.', price: 799, originalPrice: 999, discount: 20, category: 'Accessories', images: ['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400'], stock: 65, rating: 4.7, numReviews: 445, isFeatured: true, tags: ['earrings', 'gold', 'set'], weight: '50g' },
  { name: 'Silk Scrunchie Set (12 Pieces)', description: 'Luxurious silk scrunchies in 12 gorgeous colours. Gentle on hair, prevents breakage and creases. Perfect for all hair types.', price: 349, originalPrice: 449, discount: 22, category: 'Accessories', images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'], stock: 100, rating: 4.5, numReviews: 678, isFeatured: false, tags: ['scrunchie', 'silk', 'hair'], weight: '150g' },
  { name: 'Crystal Hair Clips Set (8 Pcs)', description: 'Dainty crystal-studded hair clips in assorted styles. Lightweight, strong grip and won\'t snag your hair. Gift-ready packaging.', price: 399, originalPrice: 549, discount: 27, category: 'Accessories', images: ['https://images.unsplash.com/photo-1631234764568-8c9a1a55baee?w=400'], stock: 85, rating: 4.4, numReviews: 234, isFeatured: true, tags: ['clips', 'crystal', 'hair'], weight: '100g' },

  // Fashion
  { name: 'Floral Rayon Kurti (S/M/L/XL)', description: 'Breezy floral printed rayon kurti with a flattering A-line fit. Soft, lightweight fabric perfect for daily wear and festive occasions.', price: 899, originalPrice: 1199, discount: 25, category: 'Fashion', images: ['https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=400'], stock: 50, rating: 4.6, numReviews: 321, isFeatured: true, tags: ['kurti', 'floral', 'rayon'], weight: '300g' },
  { name: 'Women\'s Athleisure Jogger Set', description: 'Ultra-comfortable athleisure set with moisture-wicking crop top and high-waist joggers. Perfect for gym, yoga or lounging.', price: 1299, originalPrice: 1699, discount: 24, category: 'Fashion', images: ['https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=400'], stock: 40, rating: 4.8, numReviews: 267, isFeatured: false, tags: ['athleisure', 'gym', 'comfort'], weight: '400g' },
  { name: 'Cozy Pastel Loungewear Set', description: 'Incredibly soft pastel loungewear set in premium brushed cotton blend. Wide-leg pants and matching oversized top. Perfect for home.', price: 1099, originalPrice: 1499, discount: 27, category: 'Fashion', images: ['https://images.unsplash.com/photo-1594938298603-c8148c4b4057?w=400'], stock: 35, rating: 4.7, numReviews: 198, isFeatured: true, tags: ['loungewear', 'pastel', 'comfy'], weight: '500g' },

  // Fitness
  { name: 'Resistance Band Set (5 Levels)', description: 'Professional fabric resistance bands in 5 resistance levels. Non-slip, anti-roll design. Perfect for glutes, legs and full body workouts.', price: 599, originalPrice: 799, discount: 25, category: 'Fitness', images: ['https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400'], stock: 70, rating: 4.7, numReviews: 412, isFeatured: true, tags: ['resistance', 'bands', 'workout'], weight: '300g' },
  { name: 'Yoga Mat Anti-Slip Premium (6mm)', description: 'Professional 6mm thick yoga mat with alignment lines. Eco-friendly TPE material, non-slip on both sides. Includes carry strap.', price: 1499, originalPrice: 1999, discount: 25, category: 'Fitness', images: ['https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400'], stock: 45, rating: 4.8, numReviews: 356, isFeatured: true, tags: ['yoga', 'mat', 'non-slip'], weight: '1.2kg' },
  { name: 'Women\'s High-Support Sports Bra', description: 'Seamless high-support sports bra with removable padding. 4-way stretch fabric, breathable mesh panelling and racerback design.', price: 599, originalPrice: 799, discount: 25, category: 'Fitness', images: ['https://images.unsplash.com/photo-1510771463146-e89e6e86560e?w=400'], stock: 60, rating: 4.6, numReviews: 289, isFeatured: false, tags: ['sports-bra', 'support', 'workout'], weight: '150g' },

  // Books & Journals
  { name: 'Guided Gratitude Journal — 90 Days', description: 'Beautiful 90-day guided gratitude journal with daily prompts, affirmations and reflection pages. Premium linen cover with gilded edges.', price: 399, originalPrice: 549, discount: 27, category: 'Books & Journals', images: ['https://images.unsplash.com/photo-1517971129774-8a2b38fa128e?w=400'], stock: 80, rating: 4.8, numReviews: 567, isFeatured: true, tags: ['journal', 'gratitude', 'mindfulness'], weight: '400g' },
  { name: 'Women\'s Self-Care Planner 2024-25', description: 'Comprehensive wellness planner with monthly, weekly and daily views. Includes habit trackers, mood logs and self-care checklists.', price: 499, originalPrice: 699, discount: 29, category: 'Books & Journals', images: ['https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=400'], stock: 65, rating: 4.7, numReviews: 389, isFeatured: false, tags: ['planner', 'organizer', 'wellness'], weight: '500g' },

  // Home & Living
  { name: 'Luxury Soy Wax Candle Set (3 Pcs)', description: 'Hand-poured soy wax candles in rose, jasmine and sandalwood fragrances. 40-hour burn time each, in beautiful frosted glass jars.', price: 999, originalPrice: 1299, discount: 23, category: 'Home & Living', images: ['https://images.unsplash.com/photo-1602028915047-37269d1a73f7?w=400'], stock: 55, rating: 4.9, numReviews: 478, isFeatured: true, tags: ['candle', 'soy', 'fragrance'], weight: '3x200g' },
  { name: 'Velvet Cushion Cover Set (5 Pcs)', description: 'Sumptuous velvet cushion covers in blush pink, dusty rose and ivory tones. Concealed zip closure, fits 40x40cm inserts.', price: 699, originalPrice: 899, discount: 22, category: 'Home & Living', images: ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400'], stock: 45, rating: 4.6, numReviews: 234, isFeatured: false, tags: ['cushion', 'velvet', 'decor'], weight: '800g' },
  { name: 'Inspirational Ceramic Mug (350ml)', description: 'Handcrafted ceramic mug with gold foil inspirational quote. Dishwasher safe, comes in a beautiful gift box. Perfect for coffee and tea.', price: 449, originalPrice: 599, discount: 25, category: 'Home & Living', images: ['https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400'], stock: 90, rating: 4.5, numReviews: 312, isFeatured: false, tags: ['mug', 'ceramic', 'gift'], weight: '350g' },

  // Nutrition
  { name: 'Women\'s Collagen Peptide Supplement', description: 'Hydrolysed marine collagen peptides for skin elasticity, joint health and hair strength. Unflavoured, mixes easily in any drink. 60-day supply.', price: 1499, originalPrice: 1999, discount: 25, category: 'Nutrition', images: ['https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=400'], stock: 50, rating: 4.8, numReviews: 312, isFeatured: true, tags: ['collagen', 'skin', 'supplement'], weight: '150g' },
  { name: 'Iron & Folic Acid Supplement', description: 'Easy-absorb iron bisglycinate with folic acid and vitamin B12. Gentle on the stomach, no constipation. Essential for women\'s health.', price: 549, originalPrice: 699, discount: 21, category: 'Nutrition', images: ['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400'], stock: 80, rating: 4.6, numReviews: 245, isFeatured: false, tags: ['iron', 'folic acid', 'supplement'], weight: '60 capsules' },
  { name: 'Organic Women\'s Protein Powder (Vanilla)', description: 'Plant-based protein powder with 22g protein per serving, iron, calcium and probiotics. Delicious vanilla flavour, no artificial sweeteners.', price: 1999, originalPrice: 2499, discount: 20, category: 'Nutrition', images: ['https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=400'], stock: 35, rating: 4.7, numReviews: 178, isFeatured: true, tags: ['protein', 'plant-based', 'organic'], weight: '500g' },
];

const statuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
const paymentMethods = ['COD', 'UPI', 'Credit Card', 'Debit Card', 'Net Banking'];
const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Kolkata', 'Pune', 'Ahmedabad'];
const states = ['Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'Telangana', 'West Bengal', 'Maharashtra', 'Gujarat'];

async function seedDB() {
  try {
    await User.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});
    await Invoice.deleteMany({});
    await Category.deleteMany({});
    console.log('Cleared existing data...');

    await Category.insertMany([
      { name: 'General', icon: '🏷️', description: 'Default category for uncategorised products', isDefault: true },
      { name: 'Skincare', icon: '✨', description: 'Serums, moisturizers, cleansers and sunscreen' },
      { name: 'Makeup & Beauty', icon: '💄', description: 'Lipstick, foundation, eyeshadow and more' },
      { name: 'Hair Care', icon: '💇', description: 'Shampoo, conditioner, oils and serums' },
      { name: 'Wellness', icon: '🧘', description: 'Essential oils, vitamins and wellness tools' },
      { name: 'Accessories', icon: '💍', description: 'Jewellery, scrunchies and hair clips' },
      { name: 'Fashion', icon: '👗', description: 'Kurtis, joggers and loungewear' },
      { name: 'Fitness', icon: '🏋️', description: 'Resistance bands, yoga mats and sports bras' },
      { name: 'Books & Journals', icon: '📓', description: 'Gratitude journals and planners' },
      { name: 'Home & Living', icon: '🕯️', description: 'Candles, cushion covers and mugs' },
      { name: 'Nutrition', icon: '🥗', description: 'Protein powders and healthy snacks' },
    ]);
    console.log('Created categories');

    const hashedUsers = await Promise.all(usersData.map(async (u) => ({
      ...u,
      password: await hashPwd(u.password),
      address: {
        street: `${Math.floor(Math.random() * 999) + 1} Main Street`,
        city: cities[Math.floor(Math.random() * cities.length)],
        state: states[Math.floor(Math.random() * states.length)],
        zip: `${Math.floor(Math.random() * 90000) + 10000}`,
        country: 'India'
      }
    })));
    const users = await User.insertMany(hashedUsers);
    console.log(`Created ${users.length} users`);

    const products = await Product.insertMany(productsData.map(p => ({ ...p, totalStock: p.stock })));
    console.log(`Created ${products.length} products`);

    const regularUsers = users.filter(u => u.role !== 'admin');
    const ordersToInsert = [];
    const invoicesToInsert = [];

    for (let i = 0; i < regularUsers.length; i++) {
      const user = regularUsers[i];
      const numOrders = Math.floor(Math.random() * 3) + 1;

      for (let j = 0; j < numOrders; j++) {
        const numItems = Math.floor(Math.random() * 3) + 1;
        const orderItems = [];
        const shuffled = [...products].sort(() => 0.5 - Math.random()).slice(0, numItems);

        for (const prod of shuffled) {
          orderItems.push({
            product: prod._id,
            name: prod.name,
            image: prod.images[0],
            price: prod.price,
            quantity: Math.floor(Math.random() * 3) + 1
          });
        }

        const itemsPrice = orderItems.reduce((s, i) => s + i.price * i.quantity, 0);
        const shippingPrice = itemsPrice > 999 ? 0 : 49;
        const taxPrice = Math.round(itemsPrice * 0.18);
        const totalPrice = itemsPrice + shippingPrice + taxPrice;
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
        const cityIdx = Math.floor(Math.random() * cities.length);
        const createdAt = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000);

        ordersToInsert.push({
          user: user._id,
          orderItems,
          shippingAddress: {
            street: `${Math.floor(Math.random() * 999) + 1} Rose Lane`,
            city: cities[cityIdx],
            state: states[cityIdx],
            zip: `${Math.floor(Math.random() * 90000) + 10000}`,
            country: 'India'
          },
          paymentMethod, itemsPrice, shippingPrice, taxPrice, totalPrice,
          orderStatus: status,
          isPaid: status !== 'Pending' && status !== 'Cancelled',
          paidAt: status !== 'Pending' && status !== 'Cancelled' ? createdAt : undefined,
          isDelivered: status === 'Delivered',
          deliveredAt: status === 'Delivered' ? new Date(createdAt.getTime() + 3 * 24 * 60 * 60 * 1000) : undefined,
          createdAt, updatedAt: createdAt
        });
      }
    }

    const insertedOrders = await Order.insertMany(ordersToInsert);
    console.log(`Created ${insertedOrders.length} orders`);

    for (let i = 0; i < insertedOrders.length; i++) {
      const order = insertedOrders[i];
      const user = regularUsers.find(u => u._id.toString() === order.user.toString());
      const invStatus = order.isDelivered ? 'Paid' : order.orderStatus === 'Cancelled' ? 'Cancelled' : 'Sent';

      invoicesToInsert.push({
        invoiceNumber: `INV-${Date.now()}-${i + 1000}`,
        order: order._id,
        user: order.user,
        items: order.orderItems.map(item => ({ name: item.name, quantity: item.quantity, price: item.price, total: item.price * item.quantity })),
        subtotal: order.itemsPrice,
        tax: order.taxPrice,
        shipping: order.shippingPrice,
        total: order.totalPrice,
        status: invStatus,
        paymentMethod: order.paymentMethod,
        dueDate: new Date(order.createdAt.getTime() + 7 * 24 * 60 * 60 * 1000),
        billingAddress: {
          name: user ? user.name : 'Customer',
          email: user ? user.email : 'customer@gmail.com',
          phone: user ? user.phone : '9876543210',
          ...order.shippingAddress
        },
        createdAt: order.createdAt,
        updatedAt: order.createdAt
      });
    }

    await Invoice.insertMany(invoicesToInsert);
    console.log(`Created ${invoicesToInsert.length} invoices`);
    console.log('\n✅ Women HubClub database seeded!');
    console.log('Admin: admin@gmail.com / admin@gmail.com');
    console.log('User:  priya@gmail.com / priya@gmail.com');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err.message);
    process.exit(1);
  }
}

seedDB();
