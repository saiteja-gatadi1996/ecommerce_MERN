const axios = require('axios');
const Order = require('../models/Order');
const { productServiceUrl, paymentServiceUrl } = require('../config/env');
const { publishEvent } = require('@repo/event-bus');

async function getProductMap(productIds) {
  const response = await axios.get(`${productServiceUrl}/api/products/batch`, {
    params: { ids: productIds.join(',') }
  });

  return response.data.reduce((acc, product) => {
    acc[product._id] = product;
    return acc;
  }, {});
}

async function createOrder(req, res) {
  try {
    const { items, shippingAddress } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'At least one order item is required' });
    }

    const productIds = items.map((item) => item.productId);
    const productMap = await getProductMap(productIds);

    const normalizedItems = [];
    let totalAmount = 0;

    for (const item of items) {
      const product = productMap[item.productId];
      if (!product) {
        return res.status(400).json({ message: `Invalid product: ${item.productId}` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
      }

      normalizedItems.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity
      });

      totalAmount += product.price * item.quantity;
    }

    const order = await Order.create({
      userId: req.user.id,
      items: normalizedItems,
      shippingAddress,
      totalAmount,
      status: 'payment_pending',
      paymentStatus: 'pending'
    });

    await publishEvent(req.app.locals.channel, 'order.created', {
      orderId: order._id.toString(),
      userId: req.user.id,
      totalAmount,
      items: normalizedItems
    });

    await axios.post(`${paymentServiceUrl}/api/payments/process`, {
      orderId: order._id,
      userId: req.user.id,
      amount: totalAmount,
      paymentMethod: 'mock-card'
    });

    return res.status(201).json(order);
  } catch (error) {
    return res.status(500).json({ message: error.response?.data?.message || error.message });
  }
}

async function listMyOrders(req, res) {
  try {
    const orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 });
    return res.json(orders);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

module.exports = { createOrder, listMyOrders };
