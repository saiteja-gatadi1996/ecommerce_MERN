const Product = require('../models/Product');
const { subscribeEvent } = require('@repo/event-bus');

async function registerOrderPaidConsumer(channel) {
  await subscribeEvent(
    channel,
    'product-service.order-events',
    ['order.paid'],
    async (routingKey, payload) => {
      const items = payload.items || [];

      for (const item of items) {
        const product = await Product.findById(item.productId);
        if (!product) continue;

        const newStock = Math.max(0, product.stock - item.quantity);
        product.stock = newStock;
        await product.save();
      }

      console.log(
        `[product-service] handled ${routingKey} for order ${payload.orderId}`
      );
    }
  );
}

module.exports = { registerOrderPaidConsumer };
