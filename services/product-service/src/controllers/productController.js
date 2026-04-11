const Product = require('../models/Product');

async function listProducts(req, res) {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    return res.json(products);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

async function getProduct(req, res) {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    return res.json(product);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

async function createProduct(req, res) {
  try {
    const { name, description, price, stock, image, category, sku } = req.body;
    const product = await Product.create({
      name,
      description,
      price,
      stock,
      image,
      category,
      sku,
    });
    return res.status(201).json(product);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

async function seedProducts(req, res) {
  try {
    const count = await Product.countDocuments();
    if (count > 0) {
      return res.json({ message: 'Products already seeded' });
    }

    const docs = await Product.insertMany([
      {
        name: 'Noise-Cancelling Headphones',
        description: 'Wireless over-ear headphones with 30-hour battery',
        price: 7999,
        image:
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200',
        category: 'electronics',
        stock: 12,
        sku: 'ELEC-HEAD-001',
      },
      {
        name: 'Mechanical Keyboard',
        description: 'Hot-swappable keyboard with tactile switches',
        price: 5499,
        image:
          'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=1200',
        category: 'electronics',
        stock: 20,
        sku: 'ELEC-KEY-002',
      },
      {
        name: 'Running Shoes',
        description: 'Lightweight trainer for daily runs',
        price: 3299,
        image:
          'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200',
        category: 'fashion',
        stock: 18,
        sku: 'FASH-SHOE-003',
      },
      {
        name: 'Smart Watch',
        description: 'Fitness tracking, sleep monitoring, and notifications',
        price: 8999,
        image:
          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200',
        category: 'wearables',
        stock: 9,
        sku: 'WEAR-WATCH-004',
      },
      {
        name: 'Gaming Mouse',
        description: 'Ergonomic design with customizable buttons',
        price: 2999,
        image:
          'https://images.unsplash.com/photo-1581089781785-2e7e4b70f8f5?w=1200',
        category: 'electronics',
        stock: 25,
        sku: 'ELEC-MOUSE-005',
      },
      {
        name: 'Bluetooth Speaker',
        description: 'Portable speaker with deep bass and 12-hour battery life',
        price: 4599,
        image:
          'https://images.unsplash.com/photo-1512499617640-c2f999b37c90?w=1200',
        category: 'electronics',
        stock: 15,
        sku: 'ELEC-SPKR-006',
      },
      {
        name: 'Yoga Mat',
        description: 'Non-slip, eco-friendly yoga mat for home workouts',
        price: 1299,
        image:
          'https://images.unsplash.com/photo-1599058917213-0c5d6a6d5a5e?w=1200',
        category: 'fitness',
        stock: 30,
        sku: 'FIT-MAT-007',
      },
      {
        name: 'Dumbbell Set',
        description: 'Adjustable dumbbells for strength training',
        price: 4999,
        image:
          'https://images.unsplash.com/photo-1599058917213-0c5d6a6d5a5e?w=1200',
        category: 'fitness',
        stock: 10,
        sku: 'FIT-DUMB-008',
      },
      {
        name: 'Backpack',
        description: 'Water-resistant backpack with multiple compartments',
        price: 1999,
        image:
          'https://images.unsplash.com/photo-1512295767273-ac1c5b7a3d2c?w=1200',
        category: 'fashion',
        stock: 22,
        sku: 'FASH-BAG-009',
      },
      {
        name: 'Sunglasses',
        description: 'UV-protected stylish sunglasses',
        price: 1499,
        image:
          'https://images.unsplash.com/photo-1512295767273-ac1c5b7a3d2c?w=1200',
        category: 'fashion',
        stock: 40,
        sku: 'FASH-SUN-010',
      },
      {
        name: 'Wireless Earbuds',
        description: 'Compact earbuds with noise isolation',
        price: 3999,
        image:
          'https://images.unsplash.com/photo-1512499617640-c2f999b37c90?w=1200',
        category: 'electronics',
        stock: 18,
        sku: 'ELEC-EARB-011',
      },
      {
        name: 'Laptop Stand',
        description: 'Adjustable aluminum stand for laptops',
        price: 2599,
        image:
          'https://images.unsplash.com/photo-1512499617640-c2f999b37c90?w=1200',
        category: 'electronics',
        stock: 12,
        sku: 'ELEC-STND-012',
      },
      {
        name: 'Coffee Maker',
        description: 'Automatic coffee maker with programmable settings',
        price: 6999,
        image:
          'https://images.unsplash.com/photo-1512499617640-c2f999b37c90?w=1200',
        category: 'home-appliances',
        stock: 8,
        sku: 'HOME-COFF-013',
      },
      {
        name: 'Air Purifier',
        description: 'HEPA filter air purifier for clean indoor air',
        price: 12999,
        image:
          'https://images.unsplash.com/photo-1512499617640-c2f999b37c90?w=1200',
        category: 'home-appliances',
        stock: 5,
        sku: 'HOME-AIR-014',
      },
      {
        name: 'Electric Kettle',
        description: 'Fast-boiling electric kettle with auto shut-off',
        price: 1999,
        image:
          'https://images.unsplash.com/photo-1512499617640-c2f999b37c90?w=1200',
        category: 'home-appliances',
        stock: 20,
        sku: 'HOME-KETT-015',
      },
      {
        name: 'Smartphone',
        description: 'Latest model with high-resolution camera',
        price: 49999,
        image:
          'https://images.unsplash.com/photo-1512499617640-c2f999b37c90?w=1200',
        category: 'electronics',
        stock: 10,
        sku: 'ELEC-PHONE-016',
      },
      {
        name: 'Tablet',
        description: 'Lightweight tablet with 10-inch display',
        price: 29999,
        image:
          'https://images.unsplash.com/photo-1512499617640-c2f999b37c90?w=1200',
        category: 'electronics',
        stock: 7,
        sku: 'ELEC-TAB-017',
      },
      {
        name: 'Office Chair',
        description: 'Ergonomic chair with lumbar support',
        price: 8999,
        image:
          'https://images.unsplash.com/photo-1512499617640-c2f999b37c90?w=1200',
        category: 'furniture',
        stock: 6,
        sku: 'FURN-CHAIR-018',
      },
      {
        name: 'Desk Lamp',
        description: 'LED desk lamp with adjustable brightness',
        price: 1599,
        image:
          'https://images.unsplash.com/photo-1512499617640-c2f999b37c90?w=1200',
        category: 'home-decor',
        stock: 25,
        sku: 'HOME-LAMP-019',
      },
      {
        name: 'Wall Clock',
        description: 'Modern wall clock with silent movement',
        price: 999,
        image:
          'https://images.unsplash.com/photo-1512499617640-c2f999b37c90?w=1200',
        category: 'home-decor',
        stock: 30,
        sku: 'HOME-CLOCK-020',
      },
    ]);

    return res.status(201).json(docs);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

async function getProductsByIds(req, res) {
  try {
    const ids = String(req.query.ids || '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    const products = await Product.find({ _id: { $in: ids } });
    return res.json(products);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

module.exports = {
  listProducts,
  getProduct,
  createProduct,
  seedProducts,
  getProductsByIds,
};
