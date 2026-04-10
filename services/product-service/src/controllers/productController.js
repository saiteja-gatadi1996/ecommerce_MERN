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
      sku
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
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200',
        category: 'electronics',
        stock: 12,
        sku: 'ELEC-HEAD-001'
      },
      {
        name: 'Mechanical Keyboard',
        description: 'Hot-swappable keyboard with tactile switches',
        price: 5499,
        image: 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=1200',
        category: 'electronics',
        stock: 20,
        sku: 'ELEC-KEY-002'
      },
      {
        name: 'Running Shoes',
        description: 'Lightweight trainer for daily runs',
        price: 3299,
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200',
        category: 'fashion',
        stock: 18,
        sku: 'FASH-SHOE-003'
      },
      {
        name: 'Smart Watch',
        description: 'Fitness tracking, sleep monitoring, and notifications',
        price: 8999,
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200',
        category: 'wearables',
        stock: 9,
        sku: 'WEAR-WATCH-004'
      }
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

module.exports = { listProducts, getProduct, createProduct, seedProducts, getProductsByIds };
